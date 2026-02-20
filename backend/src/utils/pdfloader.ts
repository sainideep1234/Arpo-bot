import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { Document } from "@langchain/core/documents";
import path from "path";

export async function processPdf(
  filePath: string,
  originalFileName?: string,
): Promise<Document[]> {
  try {
    const fileName =
      originalFileName ||
      path.basename(filePath).replace(/^pdfFiles-\d+-\d+\./, "");

    const loader = new PDFLoader(filePath, {
      splitPages: true,
    });
    const rawDocs = await loader.load();

    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
    });

    const splitDocs = await splitter.splitDocuments(rawDocs);

    // Enrich every chunk with source attribution metadata
    const enrichedDocs = splitDocs.map((doc, index) => {
      const pageNumber =
        doc.metadata?.loc?.pageNumber ?? doc.metadata?.page ?? null;

      return new Document({
        pageContent: doc.pageContent,
        metadata: {
          ...doc.metadata,
          sourceFile: fileName,
          pageNumber: pageNumber,
          chunkIndex: index,
          totalChunks: splitDocs.length,
          uploadedAt: new Date().toISOString(),
        },
      });
    });

    return enrichedDocs;
  } catch (error) {
    console.error("Error processing PDF:", error);
    throw new Error("Failed to process PDF");
  }
}
