// ===== API Helper — Simple Version =====

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

// ── Types (used by other files) ──

export interface SourceDoc {
  confidenceScore: string;
  content: string;
  metaData: string;
  sourceFile: string;
  pageNumber: number | null;
  chunkIndex: number | null;
}

export interface PdfUploadResult {
  totalChunks: number;
  files: Array<{
    fileName: string;
    chunks: number;
    status: "success" | "failed";
    error?: string;
  }>;
}

// ── Auth ──

export async function signUp(name: string, email: string, password: string) {
  const res = await fetch(API_BASE + "/api/v1/signup", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email, password }),
  });
  return res.json();
}

export async function signIn(email: string, password: string) {
  const res = await fetch(API_BASE + "/api/v1/signin", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  return res.json();
}

export async function adminSignIn(email: string, password: string) {
  const res = await fetch(API_BASE + "/api/v1/admin/signin", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  return res.json();
}

// ── Chat ──

export async function sendMessage(
  message: string,
  role: string = "user",
  imageFile?: File,
) {
  const token = localStorage.getItem("arpo_token");

  // If there's an image, send as FormData (multipart)
  if (imageFile) {
    const formData = new FormData();
    formData.append("image", imageFile);
    formData.append("message", message);
    formData.append("messageType", "image");
    formData.append("role", role);

    const res = await fetch(API_BASE + "/api/v1/chats", {
      method: "POST",
      headers: {
        Authorization: "Bearer " + token,
        // No Content-Type here — browser sets it for FormData
      },
      body: formData,
    });
    return res.json();
  }

  // Normal text message
  const res = await fetch(API_BASE + "/api/v1/chats", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + token,
    },
    body: JSON.stringify({ message, messageType: "text", role }),
  });
  return res.json();
}

export async function getMessages() {
  const token = localStorage.getItem("arpo_token");

  const res = await fetch(API_BASE + "/api/v1/chats", {
    method: "GET",
    headers: {
      Authorization: "Bearer " + token,
    },
  });
  return res.json();
}

// ── Admin — PDF Upload ──

export async function uploadPdfs(files: File[]) {
  const token = localStorage.getItem("arpo_token");
  const formData = new FormData();
  for (const file of files) {
    formData.append("pdfFiles", file);
  }

  const res = await fetch(API_BASE + "/api/v1/pinecone/pdf", {
    method: "POST",
    headers: {
      Authorization: "Bearer " + token,
      // No Content-Type here — browser sets it for FormData
    },
    body: formData,
  });
  return res.json();
}
