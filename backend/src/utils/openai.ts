import OpenAI from "openai";
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";
import fs from "fs/promises";
import type { RetrivedDocs } from "../routes/chatRoutes";

const openai = new OpenAI({
  apiKey: process.env.GOOGLE_API_KEY,
  baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/",
});

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
        `Content: ${doc.content}\n` +
        `Metadata: ${doc.metaData}`,
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
        `You are an expert Scout Master AI. Answer strictly based on the provided context.\n\n` +
        `--- Retrieved Context ---\n${context}\n--- End of Context ---`,
    },
  ];

  if (imageUrl) {
    const base64Image = await encodeImage(imageUrl);
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
            url: `data:image/jpeg;base64,${base64Image}`,
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
                url: `data:image/jpeg;base64,${base64Image}`,
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
