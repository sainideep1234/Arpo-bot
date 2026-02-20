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
  if (docs.length === 0) return "No relevant context found in uploaded books.";

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

// ═══════════════════════════════════════════════════════════════
// MAIN SYSTEM PROMPT — All 4 features integrated:
//   1. Dispute Settler (Citation Engine)
//   2. Visual Badge Identity
//   3. Syllabus Tracker (Ordered Checklists)
//   4. Hinglish / Hindi Support
// ═══════════════════════════════════════════════════════════════

const SYSTEM_PROMPT_TEMPLATE = `You are ARPO, the official Scout & Guide AI assistant for Bharat Scouts and Guides (BSG India). You are a knowledge-base assistant that ONLY answers based on the APRO documents, rulebooks, and manuals uploaded to the system.

⚠️ CRITICAL — LANGUAGE RULE (HIGHEST PRIORITY) ⚠️
- ALWAYS respond in HINGLISH ONLY. This is your default and primary language.
- DO NOT write any Hindi, Devanagari, or bilingual content in your response.
- DO NOT add a Hindi translation or summary. DO NOT prefix with "English:" or "Hindi:".
- If the user writes in Hinglish like "Rajya puraskar ke liye kya chahiye?", respond ENTIRELY in English.
- ONLY respond in Hindi if the user explicitly says "answer in Hindi" or "Hindi mein batao".
- This rule overrides everything else. NEVER mix languages. ONE language per response.

═══ CORE IDENTITY ═══
- You are the authoritative digital reference for all BSG India rules, award requirements, badge requirements, progression syllabus, and organizational procedures.
- You settle disputes by citing exact clauses, pages, and source files.
- You NEVER use general knowledge. You ONLY use the uploaded documents.

═══ RULES ═══

RULE 1: CONTEXT ONLY — NO OUTSIDE KNOWLEDGE
- You MUST NOT use any general knowledge, training data, or outside information.
- Every statement must come directly from the retrieved documents below.
- If the topic is not in the uploaded books, refuse politely.

RULE 2: ALWAYS CITE EXACT SOURCES
- For every factual statement, cite: [Source: <filename>, Page <number>, Clause <number>]
- When settling disputes, provide the EXACT text from the document.

RULE 3: VISUAL BADGE IDENTIFICATION
- When a user uploads a badge image: identify it, then list EXACT requirements to earn it from the context.

RULE 4: SYLLABUS TRACKER — ORDERED CHECKLISTS
- For progression/syllabus questions, generate ordered checklists grouped by category.
- Use for pending,  for completed. Include source citations.

RULE 5: REFUSE UNKNOWN TOPICS
- If the context does NOT contain the answer: "I could not find information about this in the uploaded documents. Please upload the relevant APRO book."

 RULE 6: FORMATTING
- Use headings (##), bullet points, numbered lists, and bold for key terms.
- Keep responses clean, structured, and easy to read.

REMINDER: Respond in ENGLISH ONLY. No Hindi. No bilingual. No Devanagari script.`;

export async function callLlm({
  imageUrl,
  retrivedDocs,
  role,
  query,
}: CallLlmInterface) {
  const context = formatContext(retrivedDocs);

  const systemContent =
    SYSTEM_PROMPT_TEMPLATE +
    `\n\n═══ RETRIEVED CONTEXT FROM UPLOADED BOOKS ═══\n${context}\n═══ END OF CONTEXT ═══`;

  const messages: ChatCompletionMessageParam[] = [
    {
      role: "system",
      content: systemContent,
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
          text:
            query ||
            "Please identify this badge/image and provide relevant information from the uploaded APRO documents.",
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
    console.log("LLM Response:", reply.slice(0, 200) + "...");
    return reply;
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    return null;
  }
}

// ═══════════════════════════════════════════════════════════════
// IMAGE DESCRIPTION — Optimized for Badge / Patch Identification
// This description is used as a Pinecone search query, so it
// must generate text that will match badge-related content.
// ═══════════════════════════════════════════════════════════════

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
              text: `Analyze this image carefully and describe it for searching a Bharat Scouts and Guides (BSG India) knowledge base.

Focus on:
1. **If this is a BADGE, PATCH, or EMBLEM:** Describe the badge name, its shape (circular, triangular, shield, etc.), colors, any symbols (fleur-de-lis, trefoil, animals, knots, tools), and any text/numbers written on it. Use terms like "proficiency badge", "merit badge", "sopan badge", "Rajya Puraskar", "Rashtrapati Award", "Tritiya Sopan", "Dwitiya Sopan", "Pratham Sopan", etc.
2. **If this is a DOCUMENT or CERTIFICATE:** Read and transcribe any visible text, headings, clause numbers, or section references.
3. **If this is a SCOUTING ACTIVITY:** Describe the activity (camping, knot-tying, flag ceremony, march past, etc.) with specific scouting terminology.

Be precise and use official BSG/Scouting terminology. This description will be used to search APRO rulebooks for matching information.`,
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
