import { AirtableFetchConfig } from "../util/types";

const AIRTABLE_API_BASE = "https://api.airtable.com/v0";

export async function fetchAirtableRecords(
  config: AirtableFetchConfig,
  context: any,
  logger: any,
): Promise<{ records: Record<string, any>[]; totalCount: number }> {
  const credentials = context.credentials?.airtableCredential || context.credentials;
  const pat = credentials?.personalAccessToken;

  if (!pat) {
    throw new Error("Airtable Personal Access Token not found in credentials");
  }

  const { baseId, tableId } = config;
  const maxRecords = Math.round(config.maxRecords ?? 100);
  const dedupField = config.dedupField?.trim();

  const headers = {
    Authorization: `Bearer ${pat}`,
    "Content-Type": "application/json",
  };

  const allRecords: Record<string, any>[] = [];
  let offset: string | undefined;

  do {
    const params = new URLSearchParams();

    if (config.filterFormula?.trim()) params.set("filterByFormula", config.filterFormula.trim());
    if (config.view?.trim()) params.set("view", config.view.trim());
    if (config.sortField?.trim()) {
      params.set("sort[0][field]", config.sortField.trim());
      params.set("sort[0][direction]", config.sortDirection?.trim() || "asc");
    }

    const fields = config.fields
      ? config.fields
          .split(",")
          .map((f) => f.trim())
          .filter(Boolean)
      : [];
    fields.forEach((f) => params.append("fields[]", f));

    const remaining = maxRecords - allRecords.length;
    params.set("pageSize", String(Math.min(remaining, 100)));

    if (offset) params.set("offset", offset);

    const url = `${AIRTABLE_API_BASE}/${baseId}/${encodeURIComponent(tableId)}?${params}`;

    logger.info("Fetching Airtable page", { page: Math.floor(allRecords.length / 100) + 1, offset: !!offset });

    const res = await fetch(url, { headers });

    if (!res.ok) {
      const errText = await res.text().catch(() => res.statusText);
      throw new Error(`Airtable API error ${res.status}: ${errText}`);
    }

    const data: any = await res.json();

    for (const rec of data.records || []) {
      allRecords.push({ id: rec.id, ...rec.fields });
    }

    offset = data.offset;
  } while (offset && allRecords.length < maxRecords);

  let records = allRecords.slice(0, maxRecords);

  if (dedupField) {
    const seen = new Set<string>();
    records = records.filter((r) => {
      const val = String(r[dedupField] ?? "");
      if (!val || seen.has(val)) return false;
      seen.add(val);
      return true;
    });
    logger.info("Dedup applied", { dedupField, before: allRecords.length, after: records.length });
  }

  logger.info("Airtable fetch complete", { records: records.length });

  return { records, totalCount: records.length };
}
