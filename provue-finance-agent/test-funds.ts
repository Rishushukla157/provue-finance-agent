import {
  getFundReturn,
  rankFundsByReturn,
} from "./src/services/fund.service.js";

import { pool } from "./src/db/connection.js";

console.log(
  "Bluechip return:",
  await getFundReturn(
    "Saffron Bluechip Equity Fund",
    "2024-01-01",
    "2025-01-01"
  )
);

console.log(
  "Rank funds:",
  await rankFundsByReturn("2024-01-01", "2025-01-01")
);

await pool.end();