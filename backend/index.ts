import "dotenv/config";
import express, { type Request, type Response } from "express";
import cors from "cors";

import userRouter from "./src/routes/userRoutes";
import chatRouter from "./src/routes/chatRoutes";
import pineConeRouter from "./src/routes/pineconeRoutes";
import { startCleanupScheduler } from "./src/utils/multer";
import { connectToDb } from "./src/utils/db";

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

app.get("/health", (req: Request, res: Response) => {
  res.status(200).json({
    status: "ok",
    message: "Everything is working fine",
  });
});

// Start cleanup scheduler for uploaded files
startCleanupScheduler();

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
