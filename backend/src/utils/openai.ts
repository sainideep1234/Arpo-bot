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
        `You are ARPO, the official Scout Master AI assistant. You are a knowledge-base assistant that ONLY answers based on the documents and books that have been uploaded to the system.\n\n` +
        `═══ STRICT RULES — YOU MUST FOLLOW THESE WITHOUT EXCEPTION ═══\n\n` +
        `1. **ONLY answer from the provided context.** You MUST NOT use any general knowledge, training data, or outside information. Every part of your answer must come directly from the retrieved documents below.\n\n` +
        `2. **Always cite your sources.** For every statement you make, include a citation in this exact format:\n` +
        `   [Source: <filename>, Page <number>]\n` +
        `   Example: "Scouts must complete 21 merit badges [Source: ARPO_PART-1.pdf, Page 45]"\n\n` +
        `3. **Reference specific clauses.** When the document contains numbered clauses, rules, sections, or articles, quote the clause number explicitly.\n` +
        `   Example: "As per Clause 4.2.1, a scout leader must..." [Source: ARPO_PART-1.pdf, Page 12]\n\n` +
        `4. **If the context does NOT contain the answer, say so explicitly.** Respond with:\n` +
        `   "I could not find information about this topic in the uploaded documents. Please upload the relevant book or manual to get an accurate answer."\n` +
        `   Do NOT guess, improvise, or fill in gaps with outside knowledge.\n\n` +
        `5. **If only partial information is available,** share what you found and clearly state what is missing.\n\n` +
        `6. **Be precise and factual.** Copy key phrases and terminology directly from the source material. Do not paraphrase in ways that change the meaning.\n\n` +
        `7. **Format your response clearly** using headings, bullet points, and numbered lists where appropriate for readability.\n\n` +
        `═══ RETRIEVED CONTEXT FROM UPLOADED BOOKS ═══\n${context}\n═══ END OF CONTEXT ═══`,
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
