import "dotenv/config";
import express from "express";
import cors from "cors";

import userRouter from "./routes/userRoutes";
import chatRouter from "./routes/chatRoutes";
import pineConeRouter from "./routes/pineconeRoutes";
import { startCleanupScheduler } from "./utils/multer";
import { connectToDb } from "./utils/db";

const app = express();
const PORT = process.env.PORT || 3001;

// Connect to Database
connectToDb();

// CORS — only allow requests from known frontend origins
const allowedOrigins = [
  process.env.LOCAL_FRONTEND_URL,
  process.env.PROD_FRONTEND_URL,
].filter(Boolean) as string[];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, Postman, server-to-server)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error(`CORS: origin ${origin} not allowed`));
    },
    credentials: true,
  }),
);
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
