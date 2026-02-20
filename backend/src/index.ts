import "dotenv/config";
import express from "express";
import cors from "cors";

import userRouter from "./routes/userRoutes";
import chatRouter from "./routes/chatRoutes";
import pineConeRouter from "./routes/pineconeRoutes";
import { startCleanupScheduler } from "./utils/multer";
import { connectToDb } from "./utils/db";
import { log } from "node:console";

const app = express();
const PORT = process.env.PORT || 3001;

// Connect to Database
connectToDb();

app.use(cors());
app.use(express.json());
console.log("[INFO ] routes are ready ");

// API Routes
app.use("/api/v1", userRouter);
app.use("/api/v1", chatRouter);
app.use("/api/v1/pinecone", pineConeRouter);

// Start cleanup scheduler for uploaded files
startCleanupScheduler();

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
