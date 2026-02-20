import { Router, type Request, type Response } from "express";
import upload, { deleteFile } from "../utils/multer";
import { processPdf } from "../utils/pdfloader";
import { vectorStore } from "../utils/vector";
import { authMiddleware, adminMiddleware } from "../utils/middleware";

const pineConeRouter = Router();

// POST /api/v1/pinecone/pdf — Upload and index PDFs (admin only)
pineConeRouter.post(
  "/pdf",
  authMiddleware,
  adminMiddleware,
  upload.array("pdfFiles", 10),
  async (req: Request, res: Response) => {
    const files = req.files as Express.Multer.File[] | undefined;

    try {
      if (!files || files.length === 0) {
        return res.status(400).json({
          success: false,
          message: "No PDF file(s) uploaded",
        });
      }

      const results: Array<{
        fileName: string;
        chunks: number;
        status: "success" | "failed";
        error?: string;
      }> = [];

      let totalChunks = 0;

      for (const file of files) {
        try {
          const pdfPath = file.path;
          const originalName = file.originalname;
          console.log(`[Pinecone] Processing PDF: ${originalName}`);

          // 1. Load PDF, split into chunks with enriched metadata
          const docs = await processPdf(pdfPath, originalName);
          console.log(`[Pinecone] ${originalName} → ${docs.length} chunks`);

          // 2. Add documents to Pinecone vector store
          await vectorStore.addDocuments(docs);
          console.log(`[Pinecone] ${originalName} → indexed in Pinecone`);

          // 3. Cleanup local file
          deleteFile(pdfPath);

          totalChunks += docs.length;
          results.push({
            fileName: originalName,
            chunks: docs.length,
            status: "success",
          });
        } catch (fileError: unknown) {
          const errMsg =
            fileError instanceof Error ? fileError.message : "Unknown error";
          console.error(
            `[Pinecone] Failed to process ${file.originalname}:`,
            fileError,
          );
          deleteFile(file.path);
          results.push({
            fileName: file.originalname,
            chunks: 0,
            status: "failed",
            error: errMsg,
          });
        }
      }

      const allSucceeded = results.every((r) => r.status === "success");
      const anySucceeded = results.some((r) => r.status === "success");

      return res.status(anySucceeded ? 200 : 500).json({
        success: anySucceeded,
        message: allSucceeded
          ? `All ${files.length} PDF(s) processed and indexed successfully`
          : anySucceeded
            ? `Partially indexed: some files failed`
            : `All files failed to process`,
        data: {
          totalChunks,
          files: results,
        },
      });
    } catch (error) {
      console.error("[Pinecone] Error in PDF upload route:", error);
      // Cleanup any leftover files
      if (files) {
        for (const file of files) {
          deleteFile(file.path);
        }
      }
      return res.status(500).json({
        success: false,
        message: "Failed to process PDF upload",
      });
    }
  },
);

// GET /api/v1/pinecone/search — Test search endpoint
pineConeRouter.get("/search", async (req: Request, res: Response) => {
  try {
    const query = req.query.q as string;
    if (!query) {
      return res.status(400).json({
        success: false,
        message: "Query parameter 'q' is required",
      });
    }

    const results = await vectorStore.similaritySearchWithScore(query, 5);

    const sources = results.map(([doc, score]) => ({
      content: doc.pageContent,
      confidenceScore: score.toFixed(3),
      sourceFile: doc.metadata?.sourceFile || "Unknown",
      pageNumber: doc.metadata?.pageNumber || null,
      chunkIndex: doc.metadata?.chunkIndex ?? null,
      uploadedAt: doc.metadata?.uploadedAt || null,
      metaData: JSON.stringify(doc.metadata),
    }));

    return res.status(200).json({
      success: true,
      message: `Found ${sources.length} results`,
      data: { sources },
    });
  } catch (error) {
    console.error("[Pinecone] Search error:", error);
    return res.status(500).json({
      success: false,
      message: "Search failed",
    });
  }
});

export default pineConeRouter;
