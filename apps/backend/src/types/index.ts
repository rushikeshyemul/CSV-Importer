// CRM Record schema as defined by GrowEasy
export interface CRMRecord {
  created_at: string;
  name: string;
  email: string;
  country_code: string;
  mobile_without_country_code: string;
  company: string;
  city: string;
  state: string;
  country: string;
  lead_owner: string;
  crm_status: string;
  crm_note: string;
  data_source: string;
  possession_time: string;
  description: string;
}

export type CRMStatus =
  | "GOOD_LEAD_FOLLOW_UP"
  | "DID_NOT_CONNECT"
  | "BAD_LEAD"
  | "SALE_DONE"
  | "";

export type DataSource =
  | "leads_on_demand"
  | "meridian_tower"
  | "eden_park"
  | "varah_swamy"
  | "sarjapur_plots"
  | "";

export interface ImportResult {
  imported: CRMRecord[];
  skipped: SkippedRecord[];
  total: number;
  totalImported: number;
  totalSkipped: number;
}

export interface SkippedRecord {
  row: number;
  reason: string;
  data: Record<string, string>;
}

export interface BatchResult {
  extracted: CRMRecord[];
  skipped: SkippedRecord[];
}

export interface AIBatchRequest {
  headers: string[];
  rows: Record<string, string>[];
  batchIndex: number;
  totalBatches: number;
}
