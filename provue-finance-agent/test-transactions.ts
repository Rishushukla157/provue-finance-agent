import {
  getTransactionSummary,
  getTopMerchants,
  getMonthlySpend,
} from "./src/services/transaction.service.js";
import { pool } from "./src/db/connection.js";

console.log(
  "Food March 2025:",
  await getTransactionSummary({
    category: "food",
    startDate: "2025-03-01",
    endDate: "2025-03-31",
  })
);

console.log(
  "Top merchants Q1 2025:",
  await getTopMerchants(
    {
      startDate: "2025-01-01",
      endDate: "2025-03-31",
    },
    5
  )
);

console.log(
  "Swiggy spend:",
  await getTransactionSummary({
    merchant: "Swiggy",
    startDate: "2024-01-01",
    endDate: "2025-03-31",
  })
);

console.log(
  "Monthly food spend:",
  await getMonthlySpend({
    category: "food",
    startDate: "2025-01-01",
    endDate: "2025-03-31",
  })
);

await pool.end();