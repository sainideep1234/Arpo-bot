# ARPO Bot

AI assistant for **Bharat Scouts & Guides (BSG India)**. Answers scouting questions from official APRO documents with page citations, Hinglish support, syllabus checklists, and badge photo identification.

## Features

- **Citations** — Answers grounded in APRO PDFs with source file and page number
- **Syllabus tracker** — Ordered requirements from Pratham Sopan to Rajya Puraskar
- **Hinglish** — Ask in Hinglish, get structured responses
- **Badge ID** — Upload a badge photo; bot identifies it and pulls requirements
- **Admin panel** — Upload and index APRO PDFs into Pinecone

## Tech Stack

Next.js · React · Tailwind · Bun · Express · MongoDB · Pinecone · LangChain · Gemini 2.0 Flash

## How It Works

**Text:** Question → embed → Pinecone search → Gemini + PDF context → cited answer

**Image:** Badge photo → Gemini describes it → text search in Pinecone → Gemini (image + context) → answer. Images are not stored in Pinecone — only PDF text is indexed.

## Setup

**Prerequisites:** Bun, Node.js 18+, MongoDB, Pinecone index (768 dims), Google AI API key

```bash
# Backend
cd backend && bun install && cp .env.example .env
# Fill in .env, then:
bun run dev          # http://localhost:3001

# Frontend
cd frontend && npm install && cp .env.example .env.local
# Set NEXT_PUBLIC_API_URL=http://localhost:3001, then:
npm run dev          # http://localhost:3000
```

See `.env.example` in each folder for all required variables.

**Index documents:** Sign in at `/admin/auth`, upload APRO PDFs. The bot needs indexed docs to answer questions.

## API

Base: `http://localhost:3001/api/v1`

| Endpoint | Auth | Description |
|---|---|---|
| `POST /signup`, `/signin` | — | User auth |
| `POST /admin/signin` | — | Admin auth |
| `GET /chats` | JWT | Chat history |
| `POST /chats` | JWT | Text or image message |
| `POST /pinecone/pdf` | Admin | Index PDFs |

Health: `GET /health`

## Example Questions

- *"Rajya puraskar ke liye camping requirements kya hain?"*
- *"I finished Tritiya Sopan — what's left for Rajya Puraskar?"*
- *"How does one become a Rashtrapati Scout/Guide?"*
- Upload a badge photo: *"What is this badge?"*

---

Built for **Bharat Scouts & Guides**. Private project.
