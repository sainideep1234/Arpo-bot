import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf"
import path from 'node:path';


const nike10kPdfPath = ""

const loader = new PDFLoader(nike10kPdfPath)