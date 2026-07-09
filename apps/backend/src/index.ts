import express from "express";
import cors from "cors";
import { config } from "./config";
import importRoutes from "./routes/importRoutes";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler";
import { logger } from "./utils/logger";

const app = express();

// CORS
app.use(
  cors({
    origin: config.allowedOrigins,
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Body parsing
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Routes
app.use("/api", importRoutes);

// 404 handler
app.use(notFoundHandler);

// Global error handler
app.use(errorHandler);

app.listen(config.port, () => {
  logger.info(`GrowEasy CSV Importer API running on port ${config.port}`, {
    env: config.nodeEnv,
    port: config.port,
    batchSize: config.batchSize,
  });
});

export default app;
