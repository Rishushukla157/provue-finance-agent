import { pool } from "../db/connection.js";

export async function getFundReturn(
  fundNameOrId: string,
  startDate: string,
  endDate: string
) {
  const result = await pool.query(
    `
    WITH matched_fund AS (
      SELECT id, name, category
      FROM funds
      WHERE id ILIKE $1
         OR name ILIKE $1
      LIMIT 1
    ),
    start_nav AS (
      SELECT fund_id, nav AS start_nav, nav_date AS start_date
      FROM fund_nav
      WHERE fund_id = (SELECT id FROM matched_fund)
        AND nav_date >= $2
      ORDER BY nav_date ASC
      LIMIT 1
    ),
    end_nav AS (
      SELECT fund_id, nav AS end_nav, nav_date AS end_date
      FROM fund_nav
      WHERE fund_id = (SELECT id FROM matched_fund)
        AND nav_date <= $3
      ORDER BY nav_date DESC
      LIMIT 1
    )
    SELECT
      mf.id,
      mf.name,
      mf.category,
      sn.start_date,
      sn.start_nav,
      en.end_date,
      en.end_nav,
      ((en.end_nav - sn.start_nav) / sn.start_nav) * 100 AS return_percent
    FROM matched_fund mf
    JOIN start_nav sn ON sn.fund_id = mf.id
    JOIN end_nav en ON en.fund_id = mf.id;
    `,
    [`%${fundNameOrId}%`, startDate, endDate]
  );

  if (result.rows.length === 0) {
    return {
      found: false,
      message: "No matching fund or NAV data found for the given dates.",
    };
  }

  const row = result.rows[0];

  return {
    found: true,
    fundId: row.id,
    fundName: row.name,
    category: row.category,
    startDate: row.start_date,
    startNav: Number(row.start_nav),
    endDate: row.end_date,
    endNav: Number(row.end_nav),
    returnPercent: Number(row.return_percent),
  };
}

export async function rankFundsByReturn(
  startDate: string,
  endDate: string
) {
  const result = await pool.query(
    `
    WITH start_nav AS (
      SELECT DISTINCT ON (fund_id)
        fund_id,
        nav_date AS start_date,
        nav AS start_nav
      FROM fund_nav
      WHERE nav_date >= $1
      ORDER BY fund_id, nav_date ASC
    ),
    end_nav AS (
      SELECT DISTINCT ON (fund_id)
        fund_id,
        nav_date AS end_date,
        nav AS end_nav
      FROM fund_nav
      WHERE nav_date <= $2
      ORDER BY fund_id, nav_date DESC
    )
    SELECT
      f.id,
      f.name,
      f.category,
      sn.start_date,
      sn.start_nav,
      en.end_date,
      en.end_nav,
      ((en.end_nav - sn.start_nav) / sn.start_nav) * 100 AS return_percent
    FROM funds f
    JOIN start_nav sn ON sn.fund_id = f.id
    JOIN end_nav en ON en.fund_id = f.id
    ORDER BY return_percent DESC;
    `,
    [startDate, endDate]
  );

  return result.rows.map((row) => ({
    fundId: row.id,
    fundName: row.name,
    category: row.category,
    startDate: row.start_date,
    startNav: Number(row.start_nav),
    endDate: row.end_date,
    endNav: Number(row.end_nav),
    returnPercent: Number(row.return_percent),
  }));
}