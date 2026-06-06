import { getPortfolioSummary } from "./src/services/portfolio.service.js";
import { pool } from "./src/db/connection.js";

console.log(JSON.stringify(await getPortfolioSummary(), null, 2));

await pool.end();