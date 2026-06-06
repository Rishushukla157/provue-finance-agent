import fs from "fs";
import path from "path";
import { pool } from "../db/connection.js";

async function main() {
  const schemaPath = path.join(
    process.cwd(),
    "src",
    "db",
    "schema.sql"
  );

  const sql = fs.readFileSync(schemaPath, "utf8");

  await pool.query(sql);

  console.log("Database schema created");

  await pool.end();
}

main().catch(console.error);