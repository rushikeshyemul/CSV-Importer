import type { ImportAPIResponse } from "@/types";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

export async function uploadCSVForImport(
  file: File
): Promise<ImportAPIResponse> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${API_BASE_URL}/import`, {
    method: "POST",
    body: formData,
  });

  const data = (await response.json()) as ImportAPIResponse;

  if (!response.ok) {
    throw new Error(data.error ?? `Server error: ${response.status}`);
  }

  return data;
}
