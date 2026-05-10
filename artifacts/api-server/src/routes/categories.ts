import { Router, type IRouter } from "express";
import { db, categoriesTable, productsTable } from "@workspace/db";
import { eq, count } from "drizzle-orm";
import { requireAdmin } from "../lib/auth";

const router: IRouter = Router();

function formatCat(cat: typeof categoriesTable.$inferSelect, productCount = 0) {
  return {
    id: cat.id,
    name: cat.name,
    slug: cat.slug,
    description: cat.description ?? null,
    image: cat.image ?? null,
    shopHeadline: cat.shopHeadline ?? null,
    shopTags: cat.shopTags ?? null,
    productCount,
  };
}

router.get("/categories", async (req, res): Promise<void> => {
  const cats = await db.select({
    cat: categoriesTable,
    productCount: count(productsTable.id),
  }).from(categoriesTable)
    .leftJoin(productsTable, eq(productsTable.categoryId, categoriesTable.id))
    .groupBy(categoriesTable.id)
    .orderBy(categoriesTable.name);

  res.json(cats.map(r => formatCat(r.cat, r.productCount)));
});

router.post("/categories", requireAdmin, async (req, res): Promise<void> => {
  const { name, slug, description, image, shopHeadline, shopTags } = req.body;
  if (!name || !slug) { res.status(400).json({ error: "name and slug required" }); return; }

  const [cat] = await db.insert(categoriesTable).values({
    name, slug,
    description: description ?? undefined,
    image: image ?? undefined,
    shopHeadline: shopHeadline ?? undefined,
    shopTags: shopTags ?? undefined,
  }).returning();
  res.status(201).json(formatCat(cat, 0));
});

router.patch("/categories/:id", requireAdmin, async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const { name, slug, description, image, shopHeadline, shopTags } = req.body;
  const [cat] = await db.update(categoriesTable).set({
    name, slug,
    description: description ?? undefined,
    image: image ?? undefined,
    shopHeadline: shopHeadline !== undefined ? (shopHeadline || null) : undefined,
    shopTags: shopTags !== undefined ? (shopTags || null) : undefined,
  }).where(eq(categoriesTable.id, id)).returning();
  if (!cat) { res.status(404).json({ error: "Not found" }); return; }

  res.json(formatCat(cat, 0));
});

// Return the list of products assigned to this category (pre-delete check)
router.get("/categories/:id/products", requireAdmin, async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const rows = await db
    .select({ id: productsTable.id, name: productsTable.name })
    .from(productsTable)
    .where(eq(productsTable.categoryId, id));

  res.json(rows);
});

router.delete("/categories/:id", requireAdmin, async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  // In a single transaction: null out categoryId on assigned products, then delete the category
  await db.transaction(async (tx) => {
    await tx.update(productsTable).set({ categoryId: null }).where(eq(productsTable.categoryId, id));
    await tx.delete(categoriesTable).where(eq(categoriesTable.id, id));
  });
  res.sendStatus(204);
});

export default router;
