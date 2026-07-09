import csvParser from "csv-parser";
import { Readable } from "stream";
import { logger } from "../../utils/logger";

export interface ParsedCSV {
  headers: string[];
  rows: Record<string, string>[];
}

export async function parseCSVBuffer(buffer: Buffer): Promise<ParsedCSV> {
  return new Promise((resolve, reject) => {
    const rows: Record<string, string>[] = [];
    let headers: string[] = [];
    let headersCaptured = false;

    const stream = Readable.from(buffer);

    stream
      .pipe(
        csvParser({
          mapHeaders: ({ header }) => header.trim(),
          mapValues: ({ value }) =>
            typeof value === "string" ? value.trim() : String(value ?? ""),
        })
      )
      .on("headers", (hdrs: string[]) => {
        headers = hdrs;
        headersCaptured = true;
        logger.debug("CSV headers detected", { headers });
      })
      .on("data", (row: Record<string, string>) => {
        rows.push(row);
      })
      .on("error", (err: Error) => {
        logger.error("CSV parse error", { error: err.message });
        reject(new Error(`Failed to parse CSV: ${err.message}`));
      })
      .on("end", () => {
        if (!headersCaptured || headers.length === 0) {
          reject(new Error("CSV file has no headers or is empty"));
          return;
        }
        if (rows.length === 0) {
          reject(new Error("CSV file has headers but no data rows"));
          return;
        }
        logger.info(`CSV parsed: ${rows.length} rows, ${headers.length} columns`);
        resolve({ headers, rows });
      });
  });
}
