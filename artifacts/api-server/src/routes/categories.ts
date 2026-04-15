import { Router, type IRouter } from "express";
import { db, categoriesTable, productsTable } from "@workspace/db";
import { eq, count } from "drizzle-orm";
import { requireAdmin } from "../lib/auth";

const router: IRouter = Router();

router.get("/categories", async (req, res): Promise<void> => {
  const cats = await db.select({
    cat: categoriesTable,
    productCount: count(productsTable.id),
  }).from(categoriesTable)
    .leftJoin(productsTable, eq(productsTable.categoryId, categoriesTable.id))
    .groupBy(categoriesTable.id)
    .orderBy(categoriesTable.name);

  res.json(cats.map(r => ({
    id: r.cat.id,
    name: r.cat.name,
    slug: r.cat.slug,
    description: r.cat.description ?? null,
    image: r.cat.image ?? null,
    productCount: r.productCount,
  })));
});

router.post("/categories", requireAdmin, async (req, res): Promise<void> => {
  const { name, slug, description, image } = req.body;
  if (!name || !slug) { res.status(400).json({ error: "name and slug required" }); return; }

  const [cat] = await db.insert(categoriesTable).values({ name, slug, description: description ?? undefined, image: image ?? undefined }).returning();
  res.status(201).json({ id: cat.id, name: cat.name, slug: cat.slug, description: cat.description ?? null, image: cat.image ?? null, productCount: 0 });
});

router.patch("/categories/:id", requireAdmin, async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const { name, slug, description, image } = req.body;
  const [cat] = await db.update(categoriesTable).set({ name, slug, description: description ?? undefined, image: image ?? undefined }).where(eq(categoriesTable.id, id)).returning();
  if (!cat) { res.status(404).json({ error: "Not found" }); return; }

  res.json({ id: cat.id, name: cat.name, slug: cat.slug, description: cat.description ?? null, image: cat.image ?? null, productCount: 0 });
});

router.delete("/categories/:id", requireAdmin, async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  await db.delete(categoriesTable).where(eq(categoriesTable.id, id));
  res.sendStatus(204);
});

export default router;
