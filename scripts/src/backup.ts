/**
 * NFGN Database Backup Script
 *
 * Creates a full SQL dump of the NFGN database that can be used to restore
 * everything (schema + all data) on any PostgreSQL instance.
 *
 * Usage:
 *   pnpm --filter @workspace/scripts run backup
 *
 * Output:
 *   A timestamped .sql file in the project root: nfgn-backup-YYYY-MM-DD.sql
 */

import { execSync } from "child_process";
import { writeFileSync, existsSync } from "fs";
import { resolve } from "path";

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("❌  DATABASE_URL environment variable is not set.");
  process.exit(1);
}

const timestamp = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
const filename  = `nfgn-backup-${timestamp}.sql`;
const outPath   = resolve(process.cwd(), "../../", filename); // project root

console.log("🗄️  NFGN Database Backup");
console.log("━".repeat(50));
console.log(`📅  Date    : ${new Date().toLocaleString()}`);
console.log(`📄  File    : ${filename}`);
console.log(`📁  Location: project root`);
console.log("━".repeat(50));
console.log("⏳  Running pg_dump — this may take a moment…");

try {
  const sql = execSync(
    `pg_dump --no-password --clean --if-exists --format=plain "${DATABASE_URL}"`,
    { maxBuffer: 256 * 1024 * 1024 } // 256 MB max buffer
  );

  writeFileSync(outPath, sql);

  const sizeKB = Math.round(sql.length / 1024);
  console.log(`✅  Done!  Backup saved (${sizeKB} KB)`);
  console.log("");
  console.log("To RESTORE this backup on any PostgreSQL database:");
  console.log(`  psql <your-database-url> < ${filename}`);
  console.log("");
  console.log("To DOWNLOAD: right-click the file in the Replit file tree → Download");
} catch (err: any) {
  console.error("❌  pg_dump failed:");
  console.error(err?.message ?? err);
  process.exit(1);
}
