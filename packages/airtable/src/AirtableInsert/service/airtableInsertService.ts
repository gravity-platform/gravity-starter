import { AirtableInsertConfig } from "../util/types";

const AIRTABLE_API_BASE = "https://api.airtable.com/v0";

export async function insertAirtableRecords(
  config: AirtableInsertConfig,
  context: any,
  logger: any,
): Promise<{ inserted: number; skipped: number; total: number; errors: string[] }> {
  const credentials = context.credentials?.airtableCredential || context.credentials;
  const pat = credentials?.personalAccessToken;

  if (!pat) {
    throw new Error("Airtable Personal Access Token not found in credentials");
  }

  const { baseId, tableId, dedupField } = config;

  const rawRecords = config.records;
  const rawArray: Record<string, any>[] = Array.isArray(rawRecords) ? rawRecords : [rawRecords];

  if (rawArray.length === 0) {
    return { inserted: 0, skipped: 0, total: 0, errors: [] };
  }

  const RESERVED_FIELDS: Record<string, string> = { id: "apollo_id" };
  const AIRTABLE_ID_RE = /^rec[A-Za-z0-9]{14}$/;

  // Split records into upserts (have Airtable record ID) and inserts
  type RecordWithMeta = { airtableId?: string; fields: Record<string, any> };
  const prepared: RecordWithMeta[] = rawArray.map((r) => {
    const rawId = r["id"];
    if (rawId && AIRTABLE_ID_RE.test(String(rawId))) {
      // It's an Airtable record ID — use for PATCH, exclude from fields
      const fields: Record<string, any> = {};
      for (const [k, v] of Object.entries(r)) {
        if (k === "id") continue;
        fields[k] = v;
      }
      return { airtableId: String(rawId), fields };
    }
    // Not an Airtable ID — remap id → apollo_id and insert
    const fields: Record<string, any> = {};
    for (const [k, v] of Object.entries(r)) {
      fields[RESERVED_FIELDS[k] ?? k] = v;
    }
    return { fields };
  });

  const toUpsert = prepared.filter((r) => r.airtableId);
  const toInsertRaw = prepared.filter((r) => !r.airtableId);

  const effectiveDedupField =
    config.dedupField && RESERVED_FIELDS[config.dedupField] ? RESERVED_FIELDS[config.dedupField] : config.dedupField;

  const headers = {
    Authorization: `Bearer ${pat}`,
    "Content-Type": "application/json",
  };

  let existingValues = new Set<string>();

  if (effectiveDedupField && effectiveDedupField.trim() && toInsertRaw.length > 0) {
    logger.info("Fetching existing records for dedup", { baseId, tableId, dedupField: effectiveDedupField });
    try {
      let offset: string | undefined;
      do {
        const params = new URLSearchParams({
          fields: [effectiveDedupField],
          ...(offset ? { offset } : {}),
        } as any);
        const res = await fetch(`${AIRTABLE_API_BASE}/${baseId}/${encodeURIComponent(tableId)}?${params}`, { headers });
        if (res.ok) {
          const data: any = await res.json();
          for (const rec of data.records || []) {
            const val = rec.fields?.[effectiveDedupField];
            if (val) existingValues.add(String(val));
          }
          offset = data.offset;
        } else {
          break;
        }
      } while (offset);
      logger.info(`Found ${existingValues.size} existing values for dedup`);
    } catch (e: any) {
      logger.warn("Dedup fetch failed, proceeding without dedup", { error: e.message });
    }
  }

  const toInsert =
    effectiveDedupField && effectiveDedupField.trim()
      ? toInsertRaw.filter((r) => !existingValues.has(String(r.fields[effectiveDedupField] ?? "")))
      : toInsertRaw;

  const skipped = toInsertRaw.length - toInsert.length;
  let inserted = 0;
  let updated = 0;
  const errors: string[] = [];

  // PATCH existing records (upsert)
  const BATCH_SIZE = 10;
  for (let i = 0; i < toUpsert.length; i += BATCH_SIZE) {
    const batch = toUpsert.slice(i, i + BATCH_SIZE);
    const body = {
      records: batch.map((r) => ({ id: r.airtableId, fields: r.fields })),
    };
    try {
      const res = await fetch(`${AIRTABLE_API_BASE}/${baseId}/${encodeURIComponent(tableId)}`, {
        method: "PATCH",
        headers,
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const errText = await res.text();
        errors.push(`Upsert batch ${i / BATCH_SIZE + 1}: ${res.status} ${errText}`);
        logger.error("Airtable batch upsert failed", { status: res.status, error: errText });
      } else {
        const data: any = await res.json();
        updated += data.records?.length ?? batch.length;
        logger.info(`Updated batch ${i / BATCH_SIZE + 1}`, { count: data.records?.length });
      }
    } catch (e: any) {
      errors.push(`Upsert batch ${i / BATCH_SIZE + 1}: ${e.message}`);
      logger.error("Airtable batch upsert threw", { error: e.message });
    }
  }

  // POST new records
  for (let i = 0; i < toInsert.length; i += BATCH_SIZE) {
    const batch = toInsert.slice(i, i + BATCH_SIZE);
    const body = {
      records: batch.map((r) => ({ fields: r.fields })),
    };

    try {
      const res = await fetch(`${AIRTABLE_API_BASE}/${baseId}/${encodeURIComponent(tableId)}`, {
        method: "POST",
        headers,
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const errText = await res.text();
        errors.push(`Insert batch ${i / BATCH_SIZE + 1}: ${res.status} ${errText}`);
        logger.error("Airtable batch insert failed", { status: res.status, error: errText });
      } else {
        const data: any = await res.json();
        inserted += data.records?.length ?? batch.length;
        logger.info(`Inserted batch ${i / BATCH_SIZE + 1}`, { count: data.records?.length });
      }
    } catch (e: any) {
      errors.push(`Insert batch ${i / BATCH_SIZE + 1}: ${e.message}`);
      logger.error("Airtable batch insert threw", { error: e.message });
    }
  }

  logger.info("Airtable insert complete", {
    inserted,
    updated,
    skipped,
    total: rawArray.length,
    errors: errors.length,
  });

  return { inserted: inserted + updated, skipped, total: rawArray.length, errors };
}
