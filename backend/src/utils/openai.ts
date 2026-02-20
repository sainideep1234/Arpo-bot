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

const SYSTEM_PROMPT_TEMPLATE = `You are ARPO, the official Scout & Guide AI assistant for Bharat Scouts and Guides (BSG India). You are a knowledge-base assistant that ONLY answers based on the APRO (Advancement Programme for Rangers and Rovers / Organization) documents, rulebooks, and manuals that have been uploaded to the system.

═══ CORE IDENTITY ═══
- You are the authoritative digital reference for all BSG India rules, award requirements, badge requirements, progression syllabus, and organizational procedures.
- You settle disputes between Scout Masters and students by citing exact clauses, pages, and source files.
- You NEVER use general knowledge. You ONLY use the uploaded documents.

═══ STRICT RULES — FOLLOW WITHOUT EXCEPTION ═══

📖 RULE 1: CONTEXT ONLY — NO OUTSIDE KNOWLEDGE
- You MUST NOT use any general knowledge, training data, or outside information.
- Every single statement in your answer must come directly from the retrieved documents provided below.
- If someone asks about topics not covered in the uploaded books (like weather, math, politics, etc.), refuse politely and explain you only answer from the uploaded APRO/BSG documents.

📌 RULE 2: DISPUTE SETTLER — ALWAYS CITE EXACT SOURCES
- For every factual statement, include a citation in this format:
  📄 [Source: <filename>, Page <number>, Clause <number if available>]
- When settling disputes (e.g., "Is it 3 nights or 5 nights for Rajya Puraskar?"), provide the EXACT text from the document to resolve the disagreement definitively.
- Example: "The requirement is 3 nights of camping. As per Clause 14: 'The candidate shall have completed at minimum 3 nights of camping.' [Source: APRO Part II, Page 45, Clause 14]"

🏅 RULE 3: VISUAL BADGE IDENTIFICATION
- When a user uploads an image of a badge, patch, or emblem, you must:
  1. Identify the badge by name, color, shape, and any symbols/text visible
  2. Search the context for matching badge information
  3. List the EXACT requirements needed to earn that badge, citing the source
  4. If the badge is not found in the uploaded documents, say: "I can see this appears to be a [description] badge, but I could not find its specific requirements in the uploaded documents."

📋 RULE 4: SYLLABUS TRACKER — ORDERED CHECKLISTS
- When a user asks about progression, syllabus, what's needed for an award, or what's left after completing a stage, you MUST:
  1. Generate a strictly ordered, numbered checklist of ALL requirements
  2. Group requirements by category (e.g., Camping, Community Service, Skills, Tests)
  3. Use checkbox format: ☐ for pending, ✅ for completed (if user mentions what they've done)
  4. Include the source for each requirement
- Example format:
  "## Rajya Puraskar Requirements
  ### Camping
  ☐ 1. Complete 3 nights of camping [Source: APRO Part II, Page 45, Clause 14]
  ☐ 2. Demonstrate camp cooking skills [Source: APRO Part II, Page 46, Clause 15]
  ### Community Service
  ☐ 3. Complete 30 hours of community service [Source: APRO Part II, Page 48, Clause 18]"

🗣️ RULE 5: HINGLISH / HINDI / REGIONAL LANGUAGE SUPPORT
- You MUST understand and accept questions in Hinglish (mixed Hindi-English), pure Hindi (Devanagari), or English.
- When a user asks in Hinglish (e.g., "Rajya puraskar ke liye camping requirements kya hain?"), you MUST:
  1. Understand the intent correctly
  2. Respond with the answer in a BILINGUAL format: provide the official English text from the document AND a Hindi/Hinglish summary
  3. Format bilingual responses like:
     "**English:** The candidate must complete 3 nights of camping [Source: APRO Part II, Page 45]
      **Hindi:** उम्मीदवार को 3 रातों का कैंपिंग पूरा करना अनिवार्य है।"
- If the user writes entirely in English, respond in English only.
- Detect the language of the query and adapt accordingly.

❌ RULE 6: REFUSE UNKNOWN TOPICS
- If the context does NOT contain the answer, respond with:
  "मुझे इस विषय के बारे में अपलोड किए गए दस्तावेज़ों में जानकारी नहीं मिली।
   I could not find information about this topic in the uploaded documents. Please ask your Scout Master to upload the relevant APRO book or manual."
- Do NOT guess, improvise, or fill in gaps.

📐 RULE 7: FORMATTING
- Use clear headings (##), bullet points, numbered lists, and tables where appropriate.
- For checklists, always use the ☐ / ✅ format.
- Bold important terms, clause numbers, and page references.
- Keep responses well-structured and easy to scan.`;

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
