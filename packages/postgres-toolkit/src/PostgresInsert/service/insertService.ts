import { Pool } from "pg";
import { createHash } from "crypto";
import { PostgresInsertConfig, PostgresInsertOutput, PROTECTED_TABLES } from "../util/types";

interface InsertServiceParams extends PostgresInsertConfig {
  context: any;
  logger: any;
  embeddings?: (number[] | null)[];
}

const HASH_COLUMN = "content_hash";
const VECTOR_COLUMN = "embedding_original";

/**
 * Check if the connection string points to the core Gravity database
 */
function isGravityDB(connectionString: string): boolean {
  const gravityUrl = process.env.DATABASE_URL;
  if (!gravityUrl) return false;

  try {
    const inputHost = new URL(connectionString).hostname;
    const gravityHost = new URL(gravityUrl).hostname;
    return inputHost === gravityHost;
  } catch {
    return connectionString.includes(gravityUrl.split("@")[1]?.split("/")[0] || "__no_match__");
  }
}

/**
 * Validate table exists and get its columns from information_schema
 */
async function getTableColumns(pool: Pool, tableName: string): Promise<{ names: string[]; arrayColumns: Set<string> }> {
  const result = await pool.query(
    `SELECT column_name, data_type, udt_name FROM information_schema.columns WHERE table_schema = 'public' AND table_name = $1 ORDER BY ordinal_position`,
    [tableName],
  );
  const names = result.rows.map((r: any) => r.column_name);
  const arrayColumns = new Set<string>(
    result.rows
      .filter((r: any) => r.data_type === "ARRAY" || r.udt_name?.startsWith("_"))
      .map((r: any) => r.column_name),
  );
  return { names, arrayColumns };
}

/**
 * Compute SHA-256 hash from specified fields of a record
 */
function computeContentHash(record: any, fields: string[]): string {
  const parts = fields.map((f) => {
    const val = record[f];
    if (val === undefined || val === null) return "";
    return typeof val === "object" ? JSON.stringify(val) : String(val);
  });
  return createHash("sha256").update(parts.join("|")).digest("hex");
}

/**
 * Build and execute batch INSERT statements with parameterized queries
 */
export async function executeInsert(params: InsertServiceParams): Promise<PostgresInsertOutput> {
  const { connectionString, tableName, records, dedupFields, batchSize = 50, context, logger, embeddings } = params;

  // Validate table name format (alphanumeric + underscores only)
  if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(tableName)) {
    throw new Error(`Invalid table name: "${tableName}". Only alphanumeric characters and underscores allowed.`);
  }

  // Check protected tables if targeting Gravity DB
  if (isGravityDB(connectionString)) {
    const lowerTable = tableName.toLowerCase();
    if (PROTECTED_TABLES.includes(lowerTable)) {
      throw new Error(
        `BLOCKED: "${tableName}" is a protected core Gravity table. INSERT is not allowed. Use a different table name or a separate database.`,
      );
    }
  }

  // Parse dedup fields
  const dedupFieldList = dedupFields
    ? dedupFields
        .split(",")
        .map((f) => f.trim())
        .filter(Boolean)
    : [];
  const dedupEnabled = dedupFieldList.length > 0;

  // Normalize records to array
  let recordArray: any[];
  if (Array.isArray(records)) {
    recordArray = records;
  } else if (records && typeof records === "object") {
    recordArray = [records];
  } else {
    throw new Error("Records must be an object or array of objects");
  }

  if (recordArray.length === 0) {
    return { success: true, inserted: 0, skipped: 0, tableName, errors: [] };
  }

  // Force accept self-signed certs (Supabase, RDS, etc.)
  const prevTLS = process.env.NODE_TLS_REJECT_UNAUTHORIZED;
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

  const pool = new Pool({
    connectionString,
    max: 3,
    ssl: connectionString.includes("sslmode=disable") ? false : { rejectUnauthorized: false },
  });

  try {
    // Validate table exists
    const { names: validColumns, arrayColumns } = await getTableColumns(pool, tableName);
    if (validColumns.length === 0) {
      throw new Error(`Table "${tableName}" does not exist or has no columns.`);
    }

    // Validate dedup: table must have content_hash column
    if (dedupEnabled && !validColumns.includes(HASH_COLUMN)) {
      throw new Error(
        `Dedup enabled but table "${tableName}" has no "${HASH_COLUMN}" column. Add: ALTER TABLE "${tableName}" ADD COLUMN content_hash TEXT UNIQUE;`,
      );
    }

    logger.info("PostgresInsert: table validated", {
      tableName,
      validColumns: validColumns.length,
      recordCount: recordArray.length,
      dedupEnabled,
      dedupFields: dedupFieldList,
    });

    // Determine columns from the first record, stripping any that don't exist in the table
    const sampleRecord = recordArray[0];
    const allRecordColumns = Object.keys(sampleRecord);
    const strippedColumns = allRecordColumns.filter((col) => !validColumns.includes(col));
    if (strippedColumns.length > 0) {
      logger.warn("PostgresInsert: stripping unknown columns from records", {
        strippedColumns,
        tableName,
      });
      // Remove unknown columns from every record
      for (const record of recordArray) {
        for (const col of strippedColumns) {
          delete record[col];
        }
      }
    }
    const recordColumns = allRecordColumns.filter((col) => validColumns.includes(col));

    // Validate dedup fields exist in the records
    if (dedupEnabled) {
      const missingDedupFields = dedupFieldList.filter((f) => !(f in sampleRecord));
      if (missingDedupFields.length > 0) {
        throw new Error(
          `Dedup fields not found in records: ${missingDedupFields.join(", ")}. Available: ${recordColumns.join(", ")}`,
        );
      }
    }

    // Build column list
    const insertColumns = [...recordColumns];
    if (dedupEnabled && !insertColumns.includes(HASH_COLUMN)) {
      insertColumns.push(HASH_COLUMN);
    }
    const hasEmbeddings = embeddings && embeddings.some((e) => e !== null);
    if (hasEmbeddings && !insertColumns.includes(VECTOR_COLUMN)) {
      if (!validColumns.includes(VECTOR_COLUMN)) {
        throw new Error(`Vector column "${VECTOR_COLUMN}" does not exist in table "${tableName}".`);
      }
      insertColumns.push(VECTOR_COLUMN);
    }

    let totalInserted = 0;
    let totalSkipped = 0;
    const errors: string[] = [];

    // Process in batches
    for (let i = 0; i < recordArray.length; i += batchSize) {
      const batch = recordArray.slice(i, i + batchSize);
      const values: any[] = [];
      const valuePlaceholders: string[] = [];

      for (let rowIdx = 0; rowIdx < batch.length; rowIdx++) {
        const record = batch[rowIdx];
        const rowPlaceholders: string[] = [];

        for (const col of recordColumns) {
          const val = record[col];
          if (val !== null && val !== undefined && typeof val === "object") {
            // Native PG ARRAY columns (text[], int[], etc.) must be passed as JS arrays.
            // jsonb and plain object columns get JSON.stringify.
            values.push(Array.isArray(val) && arrayColumns.has(col) ? val : JSON.stringify(val));
          } else {
            values.push(val !== undefined ? val : null);
          }
          rowPlaceholders.push(`$${values.length}`);
        }

        // Add content_hash if dedup enabled
        if (dedupEnabled) {
          const hash = computeContentHash(record, dedupFieldList);
          values.push(hash);
          rowPlaceholders.push(`$${values.length}`);
        }

        // Add per-row vector embedding if available
        if (hasEmbeddings) {
          const globalIdx = i + rowIdx;
          const rowEmbedding = embeddings![globalIdx] || null;
          if (rowEmbedding) {
            values.push(`[${rowEmbedding.join(",")}]`);
          } else {
            values.push(null);
          }
          rowPlaceholders.push(`$${values.length}`);
        }

        valuePlaceholders.push(`(${rowPlaceholders.join(", ")})`);
      }

      const quotedColumns = insertColumns.map((c) => `"${c}"`).join(", ");
      const conflictClause = dedupEnabled ? ` ON CONFLICT ("${HASH_COLUMN}") DO NOTHING` : "";

      const sql = `INSERT INTO "${tableName}" (${quotedColumns}) VALUES ${valuePlaceholders.join(", ")}${conflictClause}`;

      try {
        const result = await pool.query(sql, values);
        const rowsAffected = result.rowCount || 0;
        totalInserted += rowsAffected;
        totalSkipped += batch.length - rowsAffected;
      } catch (err: any) {
        logger.error(`PostgresInsert: batch ${Math.floor(i / batchSize) + 1} failed`, { error: err.message });
        errors.push(`Batch ${Math.floor(i / batchSize) + 1}: ${err.message}`);
        totalSkipped += batch.length;
      }
    }

    logger.info("PostgresInsert: complete", {
      tableName,
      inserted: totalInserted,
      skipped: totalSkipped,
      errors: errors.length,
    });

    return {
      success: true,
      inserted: totalInserted,
      skipped: totalSkipped,
      tableName,
      errors,
    };
  } finally {
    await pool.end();
    // Restore original TLS setting
    if (prevTLS === undefined) {
      delete process.env.NODE_TLS_REJECT_UNAUTHORIZED;
    } else {
      process.env.NODE_TLS_REJECT_UNAUTHORIZED = prevTLS;
    }
  }
}
