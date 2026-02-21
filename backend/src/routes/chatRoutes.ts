import { Router, type Request, type Response } from "express";
import { MessageSchema } from "../utils/types";
import { Messages, Threads, Users } from "../models/db_models";
import { vectorStore } from "../utils/vector";
import { callLlm, describeImage } from "../utils/openai";
import upload, { deleteFile } from "../utils/multer";
import { authMiddleware } from "../utils/middleware";
import rateLimit from "express-rate-limit";

const chatLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 requests per windowMs
  message: {
    error:
      "Too many chat requests. To protect our LLM credits, please try again in 15 minutes.",
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the deprecated `X-RateLimit-*` headers
});

const chatRouter = Router();

export interface RetrivedDocs {
  confidenceScore: string;
  content: string;
  metaData: string;
  sourceFile: string;
  pageNumber: number | null;
  chunkIndex: number | null;
}

// ─── Helper: Get or create a default thread for the user ───
async function getOrCreateThread(userId: string) {
  // Check if user already has a thread
  const user = await Users.findById(userId);
  if (user?.thread_id && user.thread_id.length > 0) {
    const thread = await Threads.findById(user.thread_id[0]);
    if (thread) return thread;
  }

  // Create a new default thread
  const thread = await Threads.create({
    title: "Default Chat",
    messages: [],
    authors: [userId],
  });

  // Link thread to user
  await Users.findByIdAndUpdate(userId, {
    $push: { thread_id: thread._id },
  });

  return thread;
}

// ─── GET /chats — Fetch previous messages for the logged-in user ───
chatRouter.get(
  "/chats",
  authMiddleware,

  async (req: Request, res: Response) => {
    try {
      const userId = req.userId;
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
      }

      const thread = await getOrCreateThread(userId);

      // Fetch all messages belonging to this thread, sorted by creation time
      const messages = await Messages.find({ thread_id: thread._id }).sort({
        createdAt: 1,
      });

      return res.status(200).json({
        success: true,
        message: "Messages fetched successfully",
        data: {
          messages: messages.map((m) => ({
            _id: m._id,
            role: m.role,
            message_description: m.message_description,
            createdAt: (m as any).createdAt,
          })),
          threadId: thread._id,
        },
      });
    } catch (error) {
      console.log("[ERROR]", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  },
);

// ─── POST /chats — Send a message and get AI response ───
chatRouter.post(
  "/chats",
  chatLimiter,
  authMiddleware,
  upload.single("image"),
  async (req: Request, res: Response) => {
    try {
      const userId = req.userId;
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
      }

      const { success, data } = MessageSchema.safeParse(req.body);
      if (!success) {
        return res.status(401).json({
          success: false,
          message: "Please provide all fields",
        });
      }

      const { messageType, message, role } = data;
      const imagePath = req.file?.path;

      // Get or create the user's thread
      const thread = await getOrCreateThread(userId);

      // Step 1: Save the user's message to MongoDB (linked to thread)
      const saveUserMessage = await Messages.create({
        role,
        message_description: message,
        thread_id: thread._id,
      });

      // Add message to thread
      await Threads.findByIdAndUpdate(thread._id, {
        $push: { messages: saveUserMessage._id },
      });

      // Step 2: Determine the search query for the vector store
      let searchQuery: string;

      if (messageType === "image" && imagePath) {
        // Image flow: LLM describes the image first, use that as the search query
        const imageDescription = await describeImage(imagePath);
        if (!imageDescription) {
          return res.status(500).json({
            success: false,
            message: "Failed to analyze the image",
          });
        }
        // Combine image description with user's text message (if any) for a richer search
        searchQuery = message
          ? `${message} ${imageDescription}`
          : imageDescription;

        console.log("[Image Search Query]:", searchQuery);
      } else {
        // Text flow: use the user's message directly
        if (!message) {
          return res.status(400).json({
            success: false,
            message: "Message is required for text queries",
          });
        }
        searchQuery = message;
      }

      // Step 3: Vector similarity search in Pinecone (fetch 8 for better coverage)
      const retrivedDocs: RetrivedDocs[] = [];
      const similaritySearchWithScoreResults =
        await vectorStore.similaritySearchWithScore(searchQuery, 8);

      for (const [doc, score] of similaritySearchWithScoreResults) {
        console.log(
          `* [SIM=${score.toFixed(3)}] ${doc.pageContent.slice(0, 80)}... [${doc.metadata?.sourceFile || "unknown"}]`,
        );
        retrivedDocs.push({
          confidenceScore: score.toFixed(3),
          content: doc.pageContent,
          metaData: JSON.stringify(doc.metadata),
          sourceFile: doc.metadata?.sourceFile || "Unknown source",
          pageNumber: doc.metadata?.pageNumber ?? null,
          chunkIndex: doc.metadata?.chunkIndex ?? null,
        });
      }

      // Step 4: Call the LLM with retrieved context + user query (+ image if present)
      const llmResponse = await callLlm({
        retrivedDocs,
        query: message || searchQuery,
        role: "user",
        ...(messageType === "image" && imagePath && { imageUrl: imagePath }),
      });

      if (!llmResponse) {
        return res.status(500).json({
          success: false,
          message: "Failed to generate a response",
        });
      }

      // Step 5: Save the agent's response to MongoDB (linked to thread)
      const saveAgentMessage = await Messages.create({
        role: "agent",
        message_description: llmResponse,
        thread_id: thread._id,
      });

      // Add agent message to thread
      await Threads.findByIdAndUpdate(thread._id, {
        $push: { messages: saveAgentMessage._id },
      });

      // Step 6: Cleanup uploaded file
      if (imagePath) {
        deleteFile(imagePath);
      }

      // Step 7: Return the response
      return res.status(200).json({
        success: true,
        data: {
          userMessage: saveUserMessage,
          agentMessage: saveAgentMessage,
          response: llmResponse,
          sources: retrivedDocs,
        },
      });
    } catch (error) {
      // Cleanup file on error too
      if (req.file?.path) {
        deleteFile(req.file.path);
      }
      console.log("[ERROR]", error);
      res.status(500).json({
        success: false,
        message: "internal server error",
      });
    }
  },
);

export default chatRouter;
