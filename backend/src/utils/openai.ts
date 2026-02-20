import OpenAI from "openai";
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";
import fs from "fs/promises";
import path from "path";
import type { RetrivedDocs } from "../routes/chatRoutes";

const openai = new OpenAI({
  apiKey: process.env.GOOGLE_API_KEY,
  baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/",
});

function getMimeType(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  const mimeMap: Record<string, string> = {
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".gif": "image/gif",
    ".webp": "image/webp",
    ".svg": "image/svg+xml",
    ".bmp": "image/bmp",
  };
  return mimeMap[ext] || "image/jpeg";
}

async function encodeImage(imagePath: string) {
  try {
    const imageBuffer = await fs.readFile(imagePath);
    return imageBuffer.toString("base64");
  } catch (error) {
    console.error("Error encoding image:", error);
    return null;
  }
}

interface CallLlmInterface {
  retrivedDocs: RetrivedDocs[];
  imageUrl?: string;
  role: "agent" | "user";
  query: string;
}

function formatContext(docs: RetrivedDocs[]): string {
  if (docs.length === 0) return "No relevant context found.";

  return docs
    .map(
      (doc, i) =>
        `[Document ${i + 1}] (confidence: ${doc.confidenceScore})\n` +
        `Source File: ${doc.sourceFile}\n` +
        `Page: ${doc.pageNumber ?? "N/A"}\n` +
        `Content: ${doc.content}`,
    )
    .join("\n\n");
}

export async function callLlm({
  imageUrl,
  retrivedDocs,
  role,
  query,
}: CallLlmInterface) {
  const context = formatContext(retrivedDocs);

  const messages: ChatCompletionMessageParam[] = [
    {
      role: "system",
      content:
        `You are an expert Scout Master AI named ARPO. Answer based on the provided context documents.\n\n` +
        `IMPORTANT RULES:\n` +
        `1. When answering, always cite your sources by referencing the source file name and page number.\n` +
        `2. Use the format: [Source: <filename>, Page <number>] at the end of each relevant statement.\n` +
        `3. If multiple documents support a statement, cite all of them.\n` +
        `4. If the context doesn't contain relevant information, say so clearly.\n` +
        `5. Be precise and factual. Do not hallucinate information not present in the context.\n\n` +
        `--- Retrieved Context ---\n${context}\n--- End of Context ---`,
    },
  ];

  if (imageUrl) {
    const base64Image = await encodeImage(imageUrl);
    const mimeType = getMimeType(imageUrl);
    messages.push({
      role: "user",
      content: [
        {
          type: "text" as const,
          text: query,
        },
        {
          type: "image_url" as const,
          image_url: {
            url: `data:${mimeType};base64,${base64Image}`,
          },
        },
      ],
    });
  } else {
    messages.push({
      role: "user",
      content: query,
    });
  }

  try {
    const response = await openai.chat.completions.create({
      model: "gemini-2.0-flash",
      messages,
    });

    const reply = response.choices[0]?.message?.content ?? "";
    console.log("LLM Response:", reply);
    return reply;
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    return null;
  }
}

export async function describeImage(imagePath: string): Promise<string | null> {
  const base64Image = await encodeImage(imagePath);
  if (!base64Image) return null;

  try {
    const response = await openai.chat.completions.create({
      model: "gemini-2.0-flash",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text" as const,
              text: "Describe this image in detail in a short paragraph. Focus on the key subjects, objects, and any text visible in the image. This description will be used to search a knowledge base, so be precise and factual.",
            },
            {
              type: "image_url" as const,
              image_url: {
                url: `data:${getMimeType(imagePath)};base64,${base64Image}`,
              },
            },
          ],
        },
      ],
    });

    const description = response.choices[0]?.message?.content ?? null;
    console.log("Image Description:", description);
    return description;
  } catch (error) {
    console.error("Error describing image:", error);
    return null;
  }
}

export async function callEmbedModel() {}
