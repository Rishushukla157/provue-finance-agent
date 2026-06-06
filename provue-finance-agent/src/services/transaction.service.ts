import { pool } from "../db/connection.js";
import { normalizeMerchant } from "../scripts/merchantNormalizer.js";

export type TransactionFilters = {
  startDate?: string;
  endDate?: string;
  category?: string;
  merchant?: string;
  excludeTransfers?: boolean;
};

function buildWhere(filters: TransactionFilters) {
  const conditions: string[] = [];
  const values: unknown[] = [];

  if (filters.startDate) {
    values.push(filters.startDate);
    conditions.push(`date >= $${values.length}`);
  }

  if (filters.endDate) {
    values.push(filters.endDate);
    conditions.push(`date <= $${values.length}`);
  }

  if (filters.category) {
    values.push(filters.category.toLowerCase());
    conditions.push(`LOWER(category) = $${values.length}`);
  }

  if (filters.merchant) {
    const normalized = normalizeMerchant(filters.merchant);
    values.push(`%${normalized.split(" ")[0]}%`);
    conditions.push(`merchant_normalized LIKE $${values.length}`);
  }

  if (filters.excludeTransfers ?? true) {
    conditions.push(`LOWER(COALESCE(category, '')) <> 'transfer'`);
  }

  const whereClause =
    conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  return { whereClause, values };
}

export async function getTransactionSummary(filters: TransactionFilters) {
  const { whereClause, values } = buildWhere(filters);

  const result = await pool.query(
    `
    SELECT
      COUNT(*)::int AS transaction_count,
      COALESCE(SUM(amount), 0)::numeric AS net_spend,
      COALESCE(AVG(amount), 0)::numeric AS average_amount,
      COALESCE(MIN(amount), 0)::numeric AS min_amount,
      COALESCE(MAX(amount), 0)::numeric AS max_amount
    FROM transactions
    ${whereClause};
    `,
    values
  );

  const row = result.rows[0];

  return {
    transactionCount: Number(row.transaction_count),
    netSpend: Number(row.net_spend),
    averageAmount: Number(row.average_amount),
    minAmount: Number(row.min_amount),
    maxAmount: Number(row.max_amount),
    filters,
  };
}

export async function getTopMerchants(
  filters: TransactionFilters,
  limit = 5
) {
  const { whereClause, values } = buildWhere(filters);

  values.push(limit);

  const result = await pool.query(
    `
    SELECT
      merchant_normalized,
      COUNT(*)::int AS transaction_count,
      COALESCE(SUM(amount), 0)::numeric AS net_spend
    FROM transactions
    ${whereClause}
    GROUP BY merchant_normalized
    ORDER BY net_spend DESC
    LIMIT $${values.length};
    `,
    values
  );

  return result.rows.map((row) => ({
    merchant: row.merchant_normalized,
    transactionCount: Number(row.transaction_count),
    netSpend: Number(row.net_spend),
  }));
}

export async function getMonthlySpend(filters: TransactionFilters) {
  const { whereClause, values } = buildWhere(filters);

  const result = await pool.query(
    `
    SELECT
      TO_CHAR(date, 'YYYY-MM') AS month,
      COALESCE(SUM(amount), 0)::numeric AS net_spend,
      COUNT(*)::int AS transaction_count
    FROM transactions
    ${whereClause}
    GROUP BY TO_CHAR(date, 'YYYY-MM')
    ORDER BY month;
    `,
    values
  );

  return result.rows.map((row) => ({
    month: row.month,
    netSpend: Number(row.net_spend),
    transactionCount: Number(row.transaction_count),
  }));
}