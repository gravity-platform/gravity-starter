import { AirtableExistsConfig } from "../util/types";

const AIRTABLE_API_BASE = "https://api.airtable.com/v0";

export async function checkAirtableExists(
  config: AirtableExistsConfig,
  context: any,
  logger: any,
): Promise<{ exists: boolean; recordId: string | null }> {
  const credentials = context.credentials?.airtableCredential || context.credentials;
  const pat = credentials?.personalAccessToken;

  if (!pat) {
    throw new Error("Airtable Personal Access Token not found in credentials");
  }

  const { baseId, tableId, field, value } = config;

  if (!field?.trim() || value === undefined || value === null) {
    throw new Error("AirtableExists: 'field' and 'value' are required");
  }

  const formula = `{${field}}="${String(value).replace(/"/g, '\\"')}"`;
  const params = new URLSearchParams({ filterByFormula: formula, maxRecords: "1" });

  const url = `${AIRTABLE_API_BASE}/${baseId}/${encodeURIComponent(tableId)}?${params}`;

  logger.info("Checking Airtable exists", { baseId, tableId, field, value });

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${pat}`,
      "Content-Type": "application/json",
    },
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => res.statusText);
    throw new Error(`Airtable API error ${res.status}: ${errText}`);
  }

  const data: any = await res.json();
  const records = data.records || [];
  const exists = records.length > 0;
  const recordId = exists ? records[0].id : null;

  logger.info("Airtable exists check complete", { exists, recordId });

  return { exists, recordId };
}
