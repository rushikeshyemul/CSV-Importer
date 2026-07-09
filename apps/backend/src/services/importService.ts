import { parseCSVBuffer } from "./csv/csvParser";
import { GeminiService } from "./ai/geminiService";
import { chunkArray } from "../utils/chunks";
import { logger } from "../utils/logger";
import { config } from "../config";
import type { ImportResult, CRMRecord, SkippedRecord } from "../types";

export class ImportService {
  private geminiService: GeminiService;

  constructor() {
    this.geminiService = new GeminiService();
  }

  async processCSV(
    buffer: Buffer,
    onProgress?: (message: string, current: number, total: number) => void
  ): Promise<ImportResult> {
    // Step 1: Parse CSV
    logger.info("Starting CSV parse");
    onProgress?.("Parsing CSV...", 0, 1);
    const { headers, rows } = await parseCSVBuffer(buffer);
    logger.info(`Parsed ${rows.length} rows from CSV`);

    // Step 2: Split into batches
    const batches = chunkArray(rows, config.batchSize);
    const totalBatches = batches.length;
    logger.info(`Processing ${totalBatches} batches of up to ${config.batchSize} rows`);

    const allExtracted: CRMRecord[] = [];
    const allSkipped: SkippedRecord[] = [];

    // Step 3: Process each batch through AI
    for (let i = 0; i < batches.length; i++) {
      onProgress?.(
        `AI Extracting batch ${i + 1}/${totalBatches}...`,
        i,
        totalBatches
      );

      const batchResult = await this.geminiService.extractBatch(
        headers,
        batches[i],
        i,
        totalBatches
      );

      allExtracted.push(...batchResult.extracted);
      allSkipped.push(...batchResult.skipped);
    }

    onProgress?.("Import complete!", totalBatches, totalBatches);

    const result: ImportResult = {
      imported: allExtracted,
      skipped: allSkipped,
      total: rows.length,
      totalImported: allExtracted.length,
      totalSkipped: allSkipped.length,
    };

    logger.info("Import complete", {
      total: result.total,
      imported: result.totalImported,
      skipped: result.totalSkipped,
    });

    return result;
  }
}
