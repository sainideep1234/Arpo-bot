const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<ApiResponse<T>> {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("arpo_token") : null;

  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  // Don't set Content-Type for FormData (browser sets it with boundary)
  if (!(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  const json = await res.json();
  return json;
}

// Auth
export interface AuthData {
  token: string;
  role: "user" | "admin";
  name: string;
}

export async function signUp(name: string, email: string, password: string) {
  return request<AuthData>("/api/v1/signup", {
    method: "POST",
    body: JSON.stringify({ name, email, password }),
  });
}

export async function signIn(email: string, password: string) {
  return request<AuthData>("/api/v1/signin", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

// Admin Auth
export async function adminSignIn(email: string, password: string) {
  return request<AuthData>("/api/v1/admin/signin", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

// Chat
export interface SourceDoc {
  confidenceScore: string;
  content: string;
  metaData: string;
  sourceFile: string;
  pageNumber: number | null;
  chunkIndex: number | null;
}

export interface ChatResponse {
  userMessage: unknown;
  agentMessage: unknown;
  response: string;
  sources: SourceDoc[];
}

export async function sendMessage(
  message: string,
  role: string = "user",
  imageFile?: File,
) {
  if (imageFile) {
    const formData = new FormData();
    formData.append("image", imageFile);
    formData.append("message", message);
    formData.append("messageType", "image");
    formData.append("role", role);

    return request<ChatResponse>("/api/v1/chats", {
      method: "POST",
      body: formData,
    });
  }

  return request<ChatResponse>("/api/v1/chats", {
    method: "POST",
    body: JSON.stringify({
      message,
      messageType: "text",
      role,
    }),
  });
}

export async function getMessages() {
  return request<{ messages: unknown[] }>("/api/v1/chats", {
    method: "GET",
  });
}

// Admin — PDF upload (supports multiple files)
export interface PdfUploadResult {
  totalChunks: number;
  files: Array<{
    fileName: string;
    chunks: number;
    status: "success" | "failed";
    error?: string;
  }>;
}

export async function uploadPdfs(files: File[]) {
  const formData = new FormData();
  for (const file of files) {
    formData.append("pdfFiles", file);
  }

  return request<PdfUploadResult>("/api/v1/pinecone/pdf", {
    method: "POST",
    body: formData,
  });
}

// Keep backward compat for single file
export async function uploadPdf(file: File) {
  return uploadPdfs([file]);
}
