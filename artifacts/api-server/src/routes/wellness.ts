import { Router } from "express";
import { db } from "@workspace/db";
import {
  healthReferencesTable,
  healthProfilesTable,
  weightLogsTable,
  waterLogsTable,
} from "@workspace/db/schema";
import { eq, and, ilike, or, desc, gte } from "drizzle-orm";
import { requireAuth } from "../lib/auth";
import { openai } from "@workspace/integrations-openai-ai-server";

const router = Router();

// ── GET /api/wellness/references ───────────────────────────────────────────────
// Public (no auth required) — searchable library
router.get("/wellness/references", async (req, res): Promise<void> => {
  const { search, type, category, limit = "50", offset = "0" } = req.query as Record<string, string>;

  const conditions: any[] = [];
  if (type && ["herb", "mineral", "vitamin"].includes(type)) {
    const { sql } = await import("drizzle-orm");
    conditions.push(eq(healthReferencesTable.type, type));
  }
  if (category) {
    conditions.push(ilike(healthReferencesTable.category, `%${category}%`));
  }
  if (search) {
    conditions.push(
      or(
        ilike(healthReferencesTable.name, `%${search}%`),
        ilike(healthReferencesTable.category, `%${search}%`),
        ilike(healthReferencesTable.description, `%${search}%`)
      )
    );
  }

  const query = db.select().from(healthReferencesTable);
  const rows = conditions.length > 0
    ? await query.where(and(...conditions)).limit(parseInt(limit)).offset(parseInt(offset))
    : await query.limit(parseInt(limit)).offset(parseInt(offset));

  const total = conditions.length > 0
    ? (await db.select().from(healthReferencesTable).where(and(...conditions))).length
    : (await db.select().from(healthReferencesTable)).length;

  res.json({ references: rows, total });
});

// ── GET /api/wellness/references/:id ──────────────────────────────────────────
router.get("/wellness/references/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id as string);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const [row] = await db.select().from(healthReferencesTable).where(eq(healthReferencesTable.id, id)).limit(1);
  if (!row) { res.status(404).json({ error: "Not found" }); return; }
  res.json({ reference: row });
});

// ── POST /api/wellness/references/:id/enrich ──────────────────────────────────
// Generates rich AI content for a herb/mineral/vitamin and caches it in the DB
router.post("/wellness/references/:id/enrich", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id as string);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const [row] = await db.select().from(healthReferencesTable).where(eq(healthReferencesTable.id, id)).limit(1);
  if (!row) { res.status(404).json({ error: "Not found" }); return; }

  // Return cached content if already enriched
  if (row.enrichedAt) {
    res.json({ reference: row });
    return;
  }

  const typeLabel = row.type === "herb" ? "herb or root" : row.type === "mineral" ? "mineral" : "vitamin or nutrient";
  const prompt = `You are a naturopathic health educator writing for a wellness platform. Write a comprehensive, educational profile for the following ${typeLabel}.

Name: ${row.name}
${row.botanicalName ? `Botanical name: ${row.botanicalName}` : ""}
Category: ${row.category}

Respond ONLY with a valid JSON object (no markdown, no explanation) using exactly these keys:
{
  "botanicalName": "scientific botanical name if herb/root, otherwise empty string",
  "origin": "2-3 sentences on geographic origin and where it grows or is found naturally",
  "culturalBackground": "3-4 sentences on historical and cultural uses across different civilizations or traditions",
  "detailedDescription": "4-5 sentences comprehensive educational description of what this is, how it works in the body, and its primary wellness role",
  "keyBenefits": "comma-separated list of 5-8 specific health benefits (e.g. 'Supports healthy blood sugar levels, Boosts metabolism, Rich in antioxidants')",
  "activeCompounds": "comma-separated list of the main active compounds or nutrients (e.g. 'EGCG, L-theanine, catechins' for herbs; 'calcium carbonate, calcium citrate' for minerals)",
  "howToUse": "3-4 sentences on how to use it holistically — forms available, preparation methods, timing, and any dosage guidance phrased educationally"
}

Write in a clear, educational, naturopathic tone. Avoid medical claims. Use phrases like 'traditionally used', 'may support', 'has been associated with'. Keep it informative and empowering.`;

  const completion = await openai.chat.completions.create({
    model: "gpt-5-mini",
    messages: [{ role: "user", content: prompt }],
  });

  const raw = completion.choices[0]?.message?.content ?? "{}";
  let parsed: Record<string, string> = {};
  try {
    const cleaned = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    parsed = JSON.parse(cleaned);
  } catch {
    res.status(500).json({ error: "Failed to parse AI response" });
    return;
  }

  const [updated] = await db
    .update(healthReferencesTable)
    .set({
      botanicalName: parsed.botanicalName || row.botanicalName || null,
      origin: parsed.origin || null,
      culturalBackground: parsed.culturalBackground || null,
      detailedDescription: parsed.detailedDescription || null,
      keyBenefits: parsed.keyBenefits || null,
      activeCompounds: parsed.activeCompounds || null,
      howToUse: parsed.howToUse || null,
      enrichedAt: new Date(),
    })
    .where(eq(healthReferencesTable.id, id))
    .returning();

  res.json({ reference: updated });
});

// ── GET /api/wellness/profile ──────────────────────────────────────────────────
router.get("/wellness/profile", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as any).user.id;
  const [profile] = await db.select().from(healthProfilesTable).where(eq(healthProfilesTable.userId, userId)).limit(1);
  res.json({ profile: profile ?? null });
});

// ── POST /api/wellness/profile ─────────────────────────────────────────────────
router.post("/wellness/profile", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as any).user.id;
  const {
    age, weightLbs, heightIn, gender,
    bloodType, bodyType, gutBiome,
    primaryGoal, activityLevel, conditions,
    disclaimerAcknowledged,
  } = req.body as {
    age?: number; weightLbs?: number; heightIn?: number; gender?: string;
    bloodType?: string; bodyType?: string; gutBiome?: string;
    primaryGoal?: string; activityLevel?: string; conditions?: string;
    disclaimerAcknowledged?: boolean;
  };

  const [existing] = await db.select().from(healthProfilesTable).where(eq(healthProfilesTable.userId, userId)).limit(1);

  const values: Partial<typeof healthProfilesTable.$inferInsert> = {
    userId,
    ...(age !== undefined && { age }),
    ...(weightLbs !== undefined && { weightLbs: String(weightLbs) }),
    ...(heightIn !== undefined && { heightIn }),
    ...(gender !== undefined && { gender }),
    ...(bloodType !== undefined && { bloodType }),
    ...(bodyType !== undefined && { bodyType }),
    ...(gutBiome !== undefined && { gutBiome }),
    ...(primaryGoal !== undefined && { primaryGoal }),
    ...(activityLevel !== undefined && { activityLevel }),
    ...(conditions !== undefined && { conditions }),
    ...(disclaimerAcknowledged !== undefined && {
      disclaimerAcknowledged,
      disclaimerAcknowledgedAt: disclaimerAcknowledged ? new Date() : undefined,
    }),
  };

  if (existing) {
    const [updated] = await db
      .update(healthProfilesTable)
      .set(values)
      .where(eq(healthProfilesTable.userId, userId))
      .returning();
    res.json({ profile: updated });
  } else {
    const [created] = await db
      .insert(healthProfilesTable)
      .values(values as typeof healthProfilesTable.$inferInsert)
      .returning();
    res.status(201).json({ profile: created });
  }
});

// ── GET /api/wellness/trackers ─────────────────────────────────────────────────
router.get("/wellness/trackers", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as any).user.id;
  const { days = "30" } = req.query as Record<string, string>;
  const since = new Date();
  since.setDate(since.getDate() - parseInt(days));

  const [weightLogs, waterLogs] = await Promise.all([
    db.select().from(weightLogsTable)
      .where(and(eq(weightLogsTable.userId, userId), gte(weightLogsTable.loggedAt, since)))
      .orderBy(desc(weightLogsTable.loggedAt))
      .limit(90),
    db.select().from(waterLogsTable)
      .where(and(eq(waterLogsTable.userId, userId), gte(waterLogsTable.loggedAt, since)))
      .orderBy(desc(waterLogsTable.loggedAt))
      .limit(90),
  ]);

  res.json({
    weightLogs: weightLogs.map(w => ({
      id: w.id,
      weightLbs: parseFloat(String(w.weightLbs)),
      note: w.note,
      loggedAt: w.loggedAt.toISOString(),
    })),
    waterLogs: waterLogs.map(w => ({
      id: w.id,
      ozAmount: parseFloat(String(w.ozAmount)),
      loggedAt: w.loggedAt.toISOString(),
    })),
  });
});

// ── POST /api/wellness/trackers/weight ────────────────────────────────────────
router.post("/wellness/trackers/weight", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as any).user.id;
  const { weightLbs, note } = req.body as { weightLbs: number; note?: string };
  if (!weightLbs || weightLbs <= 0) { res.status(400).json({ error: "weightLbs required" }); return; }

  const [created] = await db.insert(weightLogsTable).values({
    userId,
    weightLbs: String(weightLbs),
    note: note ?? null,
  }).returning();

  res.status(201).json({
    log: { id: created.id, weightLbs: parseFloat(String(created.weightLbs)), note: created.note, loggedAt: created.loggedAt.toISOString() },
  });
});

// ── POST /api/wellness/trackers/water ─────────────────────────────────────────
router.post("/wellness/trackers/water", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as any).user.id;
  const { ozAmount } = req.body as { ozAmount: number };
  if (!ozAmount || ozAmount <= 0) { res.status(400).json({ error: "ozAmount required" }); return; }

  const [created] = await db.insert(waterLogsTable).values({
    userId,
    ozAmount: String(ozAmount),
  }).returning();

  res.status(201).json({
    log: { id: created.id, ozAmount: parseFloat(String(created.ozAmount)), loggedAt: created.loggedAt.toISOString() },
  });
});

export default router;
