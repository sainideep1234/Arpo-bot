import { Router, type Request, type Response } from "express";
import { MessageSchema } from "../utils/types";
import { Messages } from "../models/db_models";
import { vectorStore } from "../utils/vector";
import { callLlm, describeImage } from "../utils/openai";
import upload, { deleteFile } from "../utils/multer";

const chatRouter = Router();

export interface RetrivedDocs {
  confidenceScore: string;
  content: string;
  metaData: string;
  sourceFile: string;
  pageNumber: number | null;
  chunkIndex: number | null;
}

chatRouter.get("/chats", async (req: Request, res: Response) => {
  try {
    const messages = await Messages.find();

    if (!messages) {
      return res.status(500).json({
        success: false,
        message: "internal server error",
      });
    }

    return res.status(201).json({
      success: true,
      message: "Message received succefully",
      data: {
        messages,
      },
    });
  } catch (error) {
    console.log("[ERROR]", error);
    res.status(500).json({
      success: false,
      message: "internal server error",
    });
  }
});

chatRouter.post(
  "/chats",
  upload.single("image"),
  async (req: Request, res: Response) => {
    try {
      const { success, data } = MessageSchema.safeParse(req.body);
      if (!success) {
        return res.status(401).json({
          success: false,
          message: "Please provide all fields",
        });
      }

      const { messageType, message, role } = data;
      const imagePath = req.file?.path;

      // Step 1: Save the user's message to MongoDB
      const saveUserMessage = await Messages.create({
        role,
        message_description: message,
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

      // Step 3: Vector similarity search in Pinecone
      const retrivedDocs: RetrivedDocs[] = [];
      const similaritySearchWithScoreResults =
        await vectorStore.similaritySearchWithScore(searchQuery, 5);

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

      // Step 5: Save the agent's response to MongoDB
      const saveAgentMessage = await Messages.create({
        role: "agent",
        message_description: llmResponse,
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
