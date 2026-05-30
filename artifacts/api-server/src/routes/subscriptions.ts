import { Router } from "express";
import { db } from "@workspace/db";
import { subscriptionsTable, cartItemsTable, productsTable } from "@workspace/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { requireAuth } from "../lib/auth";

const router = Router();

function daysFromNow(days: number): Date {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d;
}

function freqDays(frequency: string): number {
  if (frequency === "bimonthly") return 60;
  if (frequency === "quarterly") return 90;
  return 30;
}

function freqLabel(frequency: string): string {
  if (frequency === "bimonthly") return "Every 2 Months";
  if (frequency === "quarterly") return "Quarterly";
  return "Monthly";
}

function formatSub(s: typeof subscriptionsTable.$inferSelect) {
  return {
    id: s.id,
    productId: s.productId,
    productName: s.productName,
    productImage: s.productImage,
    quantity: s.quantity,
    frequency: s.frequency,
    frequencyLabel: freqLabel(s.frequency),
    unitPrice: parseFloat(String(s.unitPrice)),
    discountPct: parseFloat(String(s.discountPct)),
    discountedPrice: parseFloat((parseFloat(String(s.unitPrice)) * (1 - parseFloat(String(s.discountPct)) / 100)).toFixed(2)),
    status: s.status,
    nextOrderAt: s.nextOrderAt.toISOString(),
    shippingAddress: s.shippingAddress,
    createdAt: s.createdAt.toISOString(),
  };
}

// ── GET /api/subscriptions ─────────────────────────────────────────────────────
router.get("/subscriptions", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as any).user.id;
  const rows = await db
    .select()
    .from(subscriptionsTable)
    .where(eq(subscriptionsTable.userId, userId))
    .orderBy(desc(subscriptionsTable.createdAt));
  res.json({ subscriptions: rows.map(formatSub) });
});

// ── POST /api/subscriptions ────────────────────────────────────────────────────
router.post("/subscriptions", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as any).user.id;
  const { productId, quantity = 1, frequency = "monthly", shippingAddress } = req.body as {
    productId: number; quantity?: number; frequency?: string; shippingAddress?: string;
  };

  if (!productId) { res.status(400).json({ error: "productId required" }); return; }

  const [product] = await db.select().from(productsTable).where(eq(productsTable.id, productId)).limit(1);
  if (!product) { res.status(404).json({ error: "Product not found" }); return; }
  if (!product.subscriptionEnabled) {
    res.status(400).json({ error: "This product is not available for subscription." });
    return;
  }

  const [existing] = await db
    .select()
    .from(subscriptionsTable)
    .where(and(
      eq(subscriptionsTable.userId, userId),
      eq(subscriptionsTable.productId, productId),
      eq(subscriptionsTable.status, "active"),
    ))
    .limit(1);

  if (existing) {
    res.status(409).json({ error: "You already have an active subscription for this product." });
    return;
  }

  const validFreqs = ["monthly", "bimonthly", "quarterly"];
  const freq = validFreqs.includes(frequency) ? frequency : "monthly";
  const discountPct = parseFloat(product.subscriptionDiscountPercent ?? "10") || 10;

  const [created] = await db.insert(subscriptionsTable).values({
    userId,
    productId,
    productName: product.name,
    productImage: product.image ?? null,
    quantity,
    frequency: freq,
    unitPrice: product.price,
    discountPct: String(discountPct),
    status: "active",
    nextOrderAt: daysFromNow(freqDays(freq)),
    shippingAddress: shippingAddress ?? null,
  }).returning();

  res.status(201).json({ subscription: formatSub(created) });
});

// ── PATCH /api/subscriptions/:id ──────────────────────────────────────────────
router.patch("/subscriptions/:id", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as any).user.id;
  const id = parseInt(req.params.id as string);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const [sub] = await db
    .select()
    .from(subscriptionsTable)
    .where(and(eq(subscriptionsTable.id, id), eq(subscriptionsTable.userId, userId)))
    .limit(1);
  if (!sub) { res.status(404).json({ error: "Subscription not found" }); return; }

  const { status, frequency, quantity } = req.body as { status?: string; frequency?: string; quantity?: number };

  const updates: Partial<typeof subscriptionsTable.$inferInsert> = {};

  if (status && ["active", "paused", "cancelled"].includes(status)) {
    updates.status = status;
    if (status === "active" && sub.status === "paused") {
      updates.nextOrderAt = daysFromNow(freqDays(sub.frequency));
    }
  }

  if (frequency && ["monthly", "bimonthly", "quarterly"].includes(frequency)) {
    updates.frequency = frequency;
    if (sub.status === "active") {
      updates.nextOrderAt = daysFromNow(freqDays(frequency));
    }
  }

  if (quantity && quantity > 0) updates.quantity = quantity;

  const [updated] = await db
    .update(subscriptionsTable)
    .set(updates)
    .where(and(eq(subscriptionsTable.id, id), eq(subscriptionsTable.userId, userId)))
    .returning();

  res.json({ subscription: formatSub(updated) });
});

// ── POST /api/subscriptions/:id/reorder ───────────────────────────────────────
// Adds the subscribed product to the user's cart at the discounted price
router.post("/subscriptions/:id/reorder", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as any).user.id;
  const id = parseInt(req.params.id as string);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const [sub] = await db
    .select()
    .from(subscriptionsTable)
    .where(and(eq(subscriptionsTable.id, id), eq(subscriptionsTable.userId, userId)))
    .limit(1);
  if (!sub) { res.status(404).json({ error: "Subscription not found" }); return; }
  if (sub.status === "cancelled") { res.status(400).json({ error: "Subscription is cancelled" }); return; }

  const discountedPrice = (
    parseFloat(String(sub.unitPrice)) * (1 - parseFloat(String(sub.discountPct)) / 100)
  ).toFixed(2);

  const [existing] = await db
    .select()
    .from(cartItemsTable)
    .where(and(eq(cartItemsTable.userId, userId), eq(cartItemsTable.productId, sub.productId)))
    .limit(1);

  if (existing) {
    await db
      .update(cartItemsTable)
      .set({ quantity: existing.quantity + sub.quantity, customPrice: discountedPrice })
      .where(eq(cartItemsTable.id, existing.id));
  } else {
    await db.insert(cartItemsTable).values({
      userId,
      productId: sub.productId,
      quantity: sub.quantity,
      customPrice: discountedPrice,
    });
  }

  // Advance the next order date
  await db
    .update(subscriptionsTable)
    .set({ nextOrderAt: daysFromNow(freqDays(sub.frequency)) })
    .where(eq(subscriptionsTable.id, id));

  res.json({ ok: true, message: `${sub.productName} added to cart at ${sub.discountPct}% off.` });
});

export default router;
