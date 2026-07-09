import { GoogleGenerativeAI, GenerativeModel } from "@google/generative-ai";
import { config } from "../../config";
import { logger } from "../../utils/logger";
import { sleep, exponentialBackoff } from "../../utils/sleep";
import {
  buildExtractionSystemPrompt,
  buildExtractionUserPrompt,
} from "../../prompts/extractionPrompt";
import type { BatchResult, CRMRecord, SkippedRecord } from "../../types";

interface AISkippedRaw {
  row?: number;
  reason?: string;
}

interface AIResponseRaw {
  extracted?: Partial<CRMRecord>[];
  skipped?: AISkippedRaw[];
}

const ALLOWED_CRM_STATUS = new Set([
  "GOOD_LEAD_FOLLOW_UP",
  "DID_NOT_CONNECT",
  "BAD_LEAD",
  "SALE_DONE",
  "",
]);

const ALLOWED_DATA_SOURCES = new Set([
  "leads_on_demand",
  "meridian_tower",
  "eden_park",
  "varah_swamy",
  "sarjapur_plots",
  "",
]);

function sanitizeCRMRecord(raw: Partial<CRMRecord>): CRMRecord {
  const status = raw.crm_status ?? "";
  const source = raw.data_source ?? "";

  return {
    created_at: String(raw.created_at ?? ""),
    name: String(raw.name ?? ""),
    email: String(raw.email ?? "").toLowerCase().trim(),
    country_code: String(raw.country_code ?? ""),
    mobile_without_country_code: String(
      raw.mobile_without_country_code ?? ""
    ),
    company: String(raw.company ?? ""),
    city: String(raw.city ?? ""),
    state: String(raw.state ?? ""),
    country: String(raw.country ?? ""),
    lead_owner: String(raw.lead_owner ?? ""),
    crm_status: ALLOWED_CRM_STATUS.has(status) ? status : "",
    crm_note: String(raw.crm_note ?? ""),
    data_source: ALLOWED_DATA_SOURCES.has(source) ? source : "",
    possession_time: String(raw.possession_time ?? ""),
    description: String(raw.description ?? ""),
  };
}

function parseAIResponse(
  responseText: string,
  originalRows: Record<string, string>[]
): BatchResult {
  // Strip markdown code blocks if present (defensive — responseMimeType should prevent this)
  let cleaned = responseText.trim();
  if (cleaned.startsWith("```")) {
    cleaned = cleaned
      .replace(/^```(?:json)?\n?/, "")
      .replace(/\n?```$/, "")
      .trim();
  }

  const parsed: AIResponseRaw = JSON.parse(cleaned) as AIResponseRaw;

  const extracted: CRMRecord[] = (parsed.extracted ?? []).map((raw) =>
    sanitizeCRMRecord(raw)
  );

  const skipped: SkippedRecord[] = (parsed.skipped ?? []).map((s, idx) => {
    // row is 1-based index within the batch
    const rowIndex = (s.row ?? idx + 1) - 1;
    return {
      row: s.row ?? idx + 1,
      reason: s.reason ?? "Unknown reason",
      // Preserve the original row data so the UI can show what was skipped
      data: originalRows[rowIndex] ?? {},
    };
  });

  return { extracted, skipped };
}

export class GeminiService {
  private model: GenerativeModel;
  private systemPrompt: string;

  constructor() {
    if (!config.geminiApiKey) {
      throw new Error(
        "GEMINI_API_KEY is not configured. Please set it in .env"
      );
    }
    const genAI = new GoogleGenerativeAI(config.geminiApiKey);
    this.systemPrompt = buildExtractionSystemPrompt();
    this.model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      // systemInstruction is the correct way to set a system prompt in the Gemini SDK.
      // Passing it as a regular content part (user turn) would make the model treat
      // the entire rulebook as user input, weakening instruction following.
      systemInstruction: this.systemPrompt,
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.1, // Low temperature for consistent, deterministic extraction
      },
    });
  }

  async extractBatch(
    headers: string[],
    rows: Record<string, string>[],
    batchIndex: number,
    totalBatches: number
  ): Promise<BatchResult> {
    const userPrompt = buildExtractionUserPrompt(headers, rows);

    logger.info(
      `AI extraction: batch ${batchIndex + 1}/${totalBatches} (${rows.length} rows)`
    );

    let lastError: Error | null = null;

    for (let attempt = 0; attempt < config.aiMaxRetries; attempt++) {
      try {
        if (attempt > 0) {
          const delay = exponentialBackoff(attempt - 1, 1000);
          logger.warn(
            `Retrying batch ${batchIndex + 1} (attempt ${attempt + 1}/${config.aiMaxRetries}) after ${delay}ms`
          );
          await sleep(delay);
        }

        const result = await this.model.generateContent([
          { text: userPrompt },
        ]);

        const responseText = result.response.text();
        const batchResult = parseAIResponse(responseText, rows);

        logger.info(
          `Batch ${batchIndex + 1} complete: ${batchResult.extracted.length} extracted, ${batchResult.skipped.length} skipped`
        );

        return batchResult;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        logger.error(
          `Batch ${batchIndex + 1} attempt ${attempt + 1} failed`,
          { error: lastError.message }
        );
      }
    }

    // All retries exhausted — mark all rows as skipped
    logger.error(
      `Batch ${batchIndex + 1} failed after ${config.aiMaxRetries} retries. Skipping batch.`
    );
    const skipped: SkippedRecord[] = rows.map((row, idx) => ({
      row: idx + 1,
      reason: `AI extraction failed: ${lastError?.message ?? "Unknown error"}`,
      data: row,
    }));

    return { extracted: [], skipped };
  }
}
