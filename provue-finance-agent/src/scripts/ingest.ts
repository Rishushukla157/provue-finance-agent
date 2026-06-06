import fs from "fs";
import path from "path";
import { pool } from "../db/connection.js";
import { normalizeMerchant } from "./merchantNormalizer.js";

type Transaction = {
  id: string;
  date: string;
  merchant: string;
  category: string;
  amount: number;
  currency: string;
  memo?: string;
};

type Fund = {
  id: string;
  name: string;
  category: string;
  nav: {
    date: string;
    value: number;
  }[];
};

type Holding = {
  fund_id: string;
  fund_name: string;
  units: number;
  purchase_date: string;
  purchase_nav: number;
};

function readJson<T>(filePath: string): T {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

async function clearTables() {
  await pool.query(`
    TRUNCATE TABLE
      fund_nav,
      holdings,
      funds,
      transactions
    RESTART IDENTITY CASCADE;
  `);
}

async function ingestTransactions(dataDir: string) {
  const transactionsPath = path.join(dataDir, "transactions.json");
  const transactions = readJson<Transaction[]>(transactionsPath);

  for (const txn of transactions) {
    await pool.query(
      `
      INSERT INTO transactions (
        id,
        date,
        merchant,
        merchant_normalized,
        category,
        amount,
        currency,
        memo
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      ON CONFLICT (id) DO UPDATE SET
        date = EXCLUDED.date,
        merchant = EXCLUDED.merchant,
        merchant_normalized = EXCLUDED.merchant_normalized,
        category = EXCLUDED.category,
        amount = EXCLUDED.amount,
        currency = EXCLUDED.currency,
        memo = EXCLUDED.memo;
      `,
      [
        txn.id,
        txn.date,
        txn.merchant,
        normalizeMerchant(txn.merchant),
        txn.category,
        txn.amount,
        txn.currency,
        txn.memo ?? null,
      ]
    );
  }

  console.log(`Inserted ${transactions.length} transactions`);
}

async function ingestFunds(dataDir: string) {
  const fundsPath = path.join(dataDir, "funds.json");
  const funds = readJson<Fund[]>(fundsPath);

  for (const fund of funds) {
    await pool.query(
      `
      INSERT INTO funds (id, name, category)
      VALUES ($1, $2, $3)
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        category = EXCLUDED.category;
      `,
      [fund.id, fund.name, fund.category]
    );

    for (const navPoint of fund.nav) {
      await pool.query(
        `
        INSERT INTO fund_nav (
          fund_id,
          nav_date,
          nav
        )
        VALUES ($1, $2, $3)
        ON CONFLICT (fund_id, nav_date) DO UPDATE SET
          nav = EXCLUDED.nav;
        `,
        [fund.id, navPoint.date, navPoint.value]
      );
    }
  }

  console.log(`Inserted ${funds.length} funds with NAV history`);
}

async function ingestHoldings(dataDir: string) {
  const holdingsPath = path.join(dataDir, "holdings.json");
  const holdings = readJson<Holding[]>(holdingsPath);

  for (const holding of holdings) {
    await pool.query(
      `
      INSERT INTO holdings (
        fund_id,
        fund_name,
        units,
        purchase_date,
        purchase_nav
      )
      VALUES ($1, $2, $3, $4, $5);
      `,
      [
        holding.fund_id,
        holding.fund_name,
        holding.units,
        holding.purchase_date,
        holding.purchase_nav,
      ]
    );
  }

  console.log(`Inserted ${holdings.length} holdings`);
}

async function main() {
  const dataDir = process.env.DATA_DIR || "./data/sample_a";
  const absoluteDataDir = path.resolve(process.cwd(), dataDir);

  console.log(`Using DATA_DIR: ${absoluteDataDir}`);

  if (!fs.existsSync(absoluteDataDir)) {
    throw new Error(`DATA_DIR does not exist: ${absoluteDataDir}`);
  }

  await clearTables();

  await ingestTransactions(absoluteDataDir);
  await ingestFunds(absoluteDataDir);
  await ingestHoldings(absoluteDataDir);

  console.log("Ingestion completed successfully");

  await pool.end();
}

main().catch(async (error) => {
  console.error("Ingestion failed:", error);
  await pool.end();
  process.exit(1);
});