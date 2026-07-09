import type { Request, Response, NextFunction } from "express";
import { ImportService } from "../services/importService";
import { logger } from "../utils/logger";

const importService = new ImportService();

export async function importCSV(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const file = req.file!;

    logger.info("Import request received", {
      filename: file.originalname,
      size: file.size,
      mimetype: file.mimetype,
    });

    const result = await importService.processCSV(
      file.buffer,
      (message, current, total) => {
        // Progress is logged server-side. For real-time client updates,
        // this would be wired to SSE or WebSocket — for now it feeds the logger.
        logger.info(`Progress [${current}/${total}]: ${message}`);
      }
    );

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

export function healthCheck(_req: Request, res: Response): void {
  res.status(200).json({
    success: true,
    message: "GrowEasy CSV Importer API is running",
    timestamp: new Date().toISOString(),
  });
}
