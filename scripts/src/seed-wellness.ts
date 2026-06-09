import { db } from "@workspace/db";
import { healthReferencesTable } from "@workspace/db/schema";
import { sql } from "drizzle-orm";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface WellnessEntry {
  type: string;
  name: string;
  botanicalName: string | null;
  category: string;
  description: string;
  cautions: string | null;
  commonForms: string | null;
  sourceUrl: string | null;
}

async function seedWellness() {
  const dataPath = path.join(__dirname, "wellness-seed-data.json");
  const data: WellnessEntry[] = JSON.parse(fs.readFileSync(dataPath, "utf8"));

  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(healthReferencesTable);

  if (count > 0) {
    console.log(`Wellness references already seeded: ${count} rows — skipping.`);
    return;
  }

  console.log(`Seeding ${data.length} wellness references…`);

  const BATCH = 50;
  let inserted = 0;
  for (let i = 0; i < data.length; i += BATCH) {
    const batch = data.slice(i, i + BATCH);
    await db.insert(healthReferencesTable).values(
      batch.map(r => ({
        type: r.type,
        name: r.name,
        botanicalName: r.botanicalName ?? null,
        category: r.category,
        description: r.description,
        cautions: r.cautions ?? null,
        commonForms: r.commonForms ?? null,
        sourceUrl: r.sourceUrl ?? null,
      }))
    );
    inserted += batch.length;
    process.stdout.write(`\r  ${inserted}/${data.length}`);
  }
  console.log(`\nDone — inserted ${inserted} wellness entries.`);
}

seedWellness().catch(e => { console.error(e); process.exit(1); });
