import Papa from "papaparse";

export interface ParsedPreview {
  headers: string[];
  rows: Record<string, string>[];
  totalRows: number;
}

export function parseCSVForPreview(file: File): Promise<ParsedPreview> {
  return new Promise((resolve, reject) => {
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (h) => h.trim(),
      transform: (value) => (typeof value === "string" ? value.trim() : value),
      complete: (results) => {
        const headers = results.meta.fields ?? [];
        const rows = results.data;

        if (headers.length === 0) {
          reject(new Error("CSV file has no headers"));
          return;
        }
        if (rows.length === 0) {
          reject(new Error("CSV file has no data rows"));
          return;
        }

        resolve({
          headers,
          rows,
          totalRows: rows.length,
        });
      },
      error: (error: Error) => {
        reject(new Error(`Failed to parse CSV: ${error.message}`));
      },
    });
  });
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}
