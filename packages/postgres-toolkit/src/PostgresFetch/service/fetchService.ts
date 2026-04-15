import { Pool } from "pg";
import { PostgresFetchConfig, PostgresFetchOutput } from "../util/types";

const SAFE_OPERATORS = ["=", "!=", ">", ">=", "<", "<=", "LIKE", "ILIKE", "IN", "IS NULL", "IS NOT NULL"];

interface FetchServiceParams extends PostgresFetchConfig {
  logger: any;
}

/**
 * Execute a SELECT query against any PostgreSQL table
 */
export async function executeFetch(params: FetchServiceParams): Promise<PostgresFetchOutput> {
  const {
    connectionString,
    tableName,
    columns,
    filterColumn,
    filterOperator,
    filterValue,
    orderBy,
    orderDirection = "ASC",
    limit,
    offset,
    logger,
  } = params;

  // Validate table name format
  if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(tableName)) {
    throw new Error(`Invalid table name: "${tableName}". Only alphanumeric characters and underscores allowed.`);
  }

  // Validate orderBy column name if provided
  if (orderBy && !/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(orderBy)) {
    throw new Error(`Invalid orderBy column: "${orderBy}". Only alphanumeric characters and underscores allowed.`);
  }

  // Validate direction
  const direction = orderDirection === "DESC" ? "DESC" : "ASC";

  const prevTLS = process.env.NODE_TLS_REJECT_UNAUTHORIZED;
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

  const pool = new Pool({
    connectionString,
    max: 3,
    ssl: connectionString.includes("sslmode=disable") ? false : { rejectUnauthorized: false },
  });

  try {
    // Build SELECT column list
    let selectColumns = "*";
    if (columns && columns.trim()) {
      const cols = columns
        .split(",")
        .map((c) => c.trim())
        .filter(Boolean);
      // Validate each column name
      for (const col of cols) {
        if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(col)) {
          throw new Error(`Invalid column name: "${col}". Only alphanumeric characters and underscores allowed.`);
        }
      }
      selectColumns = cols.map((c) => `"${c}"`).join(", ");
    }

    // Build WHERE clause from flat filter fields
    const paramValues: any[] = [];
    let whereClause = "";

    if (filterColumn && filterColumn.trim()) {
      if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(filterColumn.trim())) {
        throw new Error(`Invalid filter column: "${filterColumn}".`);
      }
      const op = (filterOperator || "=").trim().toUpperCase();
      if (!SAFE_OPERATORS.includes(op)) {
        throw new Error(`Invalid operator: "${op}". Allowed: ${SAFE_OPERATORS.join(", ")}`);
      }
      const quoted = `"${filterColumn.trim()}"`;
      if (op === "IS NULL") {
        whereClause = `WHERE ${quoted} IS NULL`;
      } else if (op === "IS NOT NULL") {
        whereClause = `WHERE ${quoted} IS NOT NULL`;
      } else if (op === "IN") {
        let arr: any[];
        try {
          arr = JSON.parse(filterValue || "[]");
          if (!Array.isArray(arr)) arr = [filterValue];
        } catch {
          arr = [filterValue];
        }
        const placeholders = arr.map((_, i) => `$${i + 1}`).join(", ");
        paramValues.push(...arr);
        whereClause = `WHERE ${quoted} IN (${placeholders})`;
      } else {
        paramValues.push(filterValue !== undefined ? filterValue : null);
        whereClause = `WHERE ${quoted} ${op} $1`;
      }
    }

    // Build ORDER BY clause
    const orderClause = orderBy ? `ORDER BY "${orderBy}" ${direction}` : "";

    // Build LIMIT / OFFSET
    let limitClause = "";
    let offsetClause = "";

    if (limit !== undefined && limit > 0) {
      paramValues.push(limit);
      limitClause = `LIMIT $${paramValues.length}`;
    }

    if (offset !== undefined && offset > 0) {
      paramValues.push(offset);
      offsetClause = `OFFSET $${paramValues.length}`;
    }

    const sql = [`SELECT ${selectColumns} FROM "${tableName}"`, whereClause, orderClause, limitClause, offsetClause]
      .filter(Boolean)
      .join(" ");

    logger.info("PostgresFetch: executing query", {
      tableName,
      filterColumn,
      filterOperator,
      columns: selectColumns,
      orderBy,
      limit,
      offset,
    });

    const result = await pool.query(sql, paramValues);

    logger.info("PostgresFetch: complete", {
      tableName,
      rowCount: result.rowCount,
    });

    return {
      success: true,
      rows: result.rows,
      rowCount: result.rowCount ?? result.rows.length,
      tableName,
    };
  } finally {
    await pool.end();
    if (prevTLS === undefined) {
      delete process.env.NODE_TLS_REJECT_UNAUTHORIZED;
    } else {
      process.env.NODE_TLS_REJECT_UNAUTHORIZED = prevTLS;
    }
  }
}
