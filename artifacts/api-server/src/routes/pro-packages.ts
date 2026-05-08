import { Router, type IRouter } from "express";
import { db, proPackagesTable, productsTable } from "@workspace/db";
import { eq, asc } from "drizzle-orm";
import { requireAdmin } from "../lib/auth";

const router: IRouter = Router();

function serializePackage(
  p: typeof proPackagesTable.$inferSelect,
  product?: { name: string; slug: string } | null,
) {
  return {
    id: p.id,
    name: p.name,
    price: parseFloat(p.price),
    originalPrice: parseFloat(p.originalPrice),
    badge: p.badge,
    badgeColor: p.badgeColor,
    perks: p.perks,
    sortOrder: p.sortOrder,
    cv: p.cv ?? 0,
    productId: p.productId ?? null,
    productName: product?.name ?? null,
    productSlug: product?.slug ?? null,
  };
}

router.get("/pro-packages", async (req, res): Promise<void> => {
  const rows = await db
    .select({
      pkg: proPackagesTable,
      productName: productsTable.name,
      productSlug: productsTable.slug,
    })
    .from(proPackagesTable)
    .leftJoin(productsTable, eq(proPackagesTable.productId, productsTable.id))
    .orderBy(asc(proPackagesTable.sortOrder), asc(proPackagesTable.id));

  res.json(
    rows.map((r) =>
      serializePackage(r.pkg, r.productName && r.productSlug ? { name: r.productName, slug: r.productSlug } : null)
    )
  );
});

router.post("/pro-packages", requireAdmin, async (req, res): Promise<void> => {
  const { name, price, originalPrice, badge, badgeColor, perks, sortOrder, cv, productId } = req.body;

  if (!name || price == null || originalPrice == null) {
    res.status(400).json({ error: "name, price, and originalPrice are required" });
    return;
  }

  const [pkg] = await db
    .insert(proPackagesTable)
    .values({
      name,
      price: String(price),
      originalPrice: String(originalPrice),
      badge: badge ?? "",
      badgeColor: badgeColor ?? "#C9A84C",
      perks: perks ?? [],
      sortOrder: sortOrder ?? 0,
      cv: cv != null ? parseInt(String(cv)) : 0,
      productId: productId != null ? Number(productId) : null,
    })
    .returning();

  res.status(201).json(serializePackage(pkg));
});

router.put("/pro-packages/reorder", requireAdmin, async (req, res): Promise<void> => {
  const { order } = req.body as { order: unknown };

  if (!Array.isArray(order) || order.length === 0) {
    res.status(400).json({ error: "order must be a non-empty array" });
    return;
  }

  for (const item of order) {
    const entry = item as Record<string, unknown>;
    if (
      typeof item !== "object" ||
      item === null ||
      typeof entry.id !== "number" ||
      !Number.isInteger(entry.id) ||
      (entry.id as number) <= 0 ||
      typeof entry.sortOrder !== "number" ||
      !Number.isInteger(entry.sortOrder)
    ) {
      res.status(400).json({ error: "each item must have a positive integer id and an integer sortOrder" });
      return;
    }
  }

  const validOrder = order as { id: number; sortOrder: number }[];

  await db.transaction(async (tx) => {
    await Promise.all(
      validOrder.map(({ id, sortOrder }) =>
        tx
          .update(proPackagesTable)
          .set({ sortOrder })
          .where(eq(proPackagesTable.id, id))
      )
    );
  });

  res.sendStatus(204);
});

router.put("/pro-packages/:id", requireAdmin, async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const { name, price, originalPrice, badge, badgeColor, perks, sortOrder, cv, productId } = req.body;

  const [pkg] = await db
    .update(proPackagesTable)
    .set({
      ...(name !== undefined && { name }),
      ...(price !== undefined && { price: String(price) }),
      ...(originalPrice !== undefined && { originalPrice: String(originalPrice) }),
      ...(badge !== undefined && { badge }),
      ...(badgeColor !== undefined && { badgeColor }),
      ...(perks !== undefined && { perks }),
      ...(sortOrder !== undefined && { sortOrder }),
      ...(cv !== undefined && { cv: parseInt(String(cv)) || 0 }),
      ...("productId" in req.body && { productId: productId != null ? Number(productId) : null }),
    })
    .where(eq(proPackagesTable.id, id))
    .returning();

  if (!pkg) { res.status(404).json({ error: "Not found" }); return; }

  let product: { name: string; slug: string } | null = null;
  if (pkg.productId != null) {
    const [row] = await db
      .select({ name: productsTable.name, slug: productsTable.slug })
      .from(productsTable)
      .where(eq(productsTable.id, pkg.productId))
      .limit(1);
    product = row ?? null;
  }

  res.json(serializePackage(pkg, product));
});

router.delete("/pro-packages/:id", requireAdmin, async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  await db.delete(proPackagesTable).where(eq(proPackagesTable.id, id));
  res.sendStatus(204);
});

export default router;
