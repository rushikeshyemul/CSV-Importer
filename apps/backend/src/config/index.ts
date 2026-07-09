import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

export const config = {
  port: parseInt(process.env.PORT ?? "4000", 10),
  nodeEnv: process.env.NODE_ENV ?? "development",
  geminiApiKey: process.env.GEMINI_API_KEY ?? "",
  batchSize: parseInt(process.env.BATCH_SIZE ?? "100", 10),
  aiMaxRetries: parseInt(process.env.AI_MAX_RETRIES ?? "3", 10),
  maxFileSize: 50 * 1024 * 1024, // 50MB
  allowedOrigins: process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(",")
    : ["http://localhost:3000", "http://localhost:3001"],
} as const;
