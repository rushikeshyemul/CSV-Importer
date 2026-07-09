import { z } from "zod";
import type { Request, Response, NextFunction } from "express";

export const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

export function validateCSVUpload(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (!req.file) {
    res.status(400).json({
      success: false,
      error: "No file uploaded. Please upload a CSV file.",
    });
    return;
  }

  const file = req.file;

  // Validate MIME type
  const allowedMimes = ["text/csv", "text/plain", "application/csv", "application/octet-stream"];
  const hasValidMime = allowedMimes.includes(file.mimetype);
  const hasCSVExtension = file.originalname.toLowerCase().endsWith(".csv");

  if (!hasValidMime && !hasCSVExtension) {
    res.status(400).json({
      success: false,
      error: "Invalid file type. Only CSV files are accepted.",
    });
    return;
  }

  if (file.size === 0) {
    res.status(400).json({
      success: false,
      error: "The uploaded file is empty.",
    });
    return;
  }

  if (file.size > MAX_FILE_SIZE) {
    res.status(400).json({
      success: false,
      error: `File too large. Maximum allowed size is ${MAX_FILE_SIZE / (1024 * 1024)}MB.`,
    });
    return;
  }

  next();
}

// Zod schema for response validation (useful for tests)
export const importResultSchema = z.object({
  success: z.boolean(),
  data: z
    .object({
      imported: z.array(z.record(z.string())),
      skipped: z.array(
        z.object({
          row: z.number(),
          reason: z.string(),
          data: z.record(z.string()),
        })
      ),
      total: z.number(),
      totalImported: z.number(),
      totalSkipped: z.number(),
    })
    .optional(),
  error: z.string().optional(),
});
