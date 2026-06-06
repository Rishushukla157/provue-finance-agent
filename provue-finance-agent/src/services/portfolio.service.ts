import { pool } from "../db/connection.js";

export async function getPortfolioSummary() {
  const result = await pool.query(
    `
    WITH latest_nav AS (
      SELECT DISTINCT ON (fund_id)
        fund_id,
        nav_date,
        nav
      FROM fund_nav
      ORDER BY fund_id, nav_date DESC
    )
    SELECT
      h.fund_id,
      h.fund_name,
      h.units,
      h.purchase_date,
      h.purchase_nav,
      ln.nav_date AS current_nav_date,
      ln.nav AS current_nav,
      (h.units * h.purchase_nav) AS purchase_value,
      (h.units * ln.nav) AS current_value,
      ((h.units * ln.nav) - (h.units * h.purchase_nav)) AS profit,
      (((ln.nav - h.purchase_nav) / h.purchase_nav) * 100) AS return_percent
    FROM holdings h
    JOIN latest_nav ln ON ln.fund_id = h.fund_id
    ORDER BY profit DESC;
    `
  );

  const holdings = result.rows.map((row) => ({
    fundId: row.fund_id,
    fundName: row.fund_name,
    units: Number(row.units),
    purchaseDate: row.purchase_date,
    purchaseNav: Number(row.purchase_nav),
    currentNavDate: row.current_nav_date,
    currentNav: Number(row.current_nav),
    purchaseValue: Number(row.purchase_value),
    currentValue: Number(row.current_value),
    profit: Number(row.profit),
    returnPercent: Number(row.return_percent),
  }));

  const totals = holdings.reduce(
    (acc, holding) => {
      acc.purchaseValue += holding.purchaseValue;
      acc.currentValue += holding.currentValue;
      acc.profit += holding.profit;
      return acc;
    },
    {
      purchaseValue: 0,
      currentValue: 0,
      profit: 0,
    }
  );

  const totalReturnPercent =
    totals.purchaseValue === 0
      ? 0
      : (totals.profit / totals.purchaseValue) * 100;

  return {
    holdings,
    totals: {
      purchaseValue: Number(totals.purchaseValue.toFixed(2)),
      currentValue: Number(totals.currentValue.toFixed(2)),
      profit: Number(totals.profit.toFixed(2)),
      returnPercent: Number(totalReturnPercent.toFixed(2)),
    },
  };
}