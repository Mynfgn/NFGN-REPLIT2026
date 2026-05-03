import { Router, type IRouter } from "express";
import { db, productsTable, categoriesTable, orderItemsTable } from "@workspace/db";
import { eq, like, and, sql, count, desc, ne } from "drizzle-orm";
import { requireAdmin } from "../lib/auth";

const router: IRouter = Router();

function formatProduct(p: typeof productsTable.$inferSelect, categoryName?: string | null) {
  return {
    id: p.id,
    name: p.name,
    slug: p.slug,
    description: p.description,
    price: parseFloat(p.price),
    comparePrice: p.comparePrice ? parseFloat(p.comparePrice) : null,
    image: p.image ?? null,
    categoryId: p.categoryId ?? null,
    categoryName: categoryName ?? null,
    stock: p.stock,
    featured: p.featured,
    isProPackage: p.isProPackage,
    status: p.status,
    commissionRate: parseFloat(p.commissionRate),
    cv: p.cv,
    dollarCreditEligible: p.dollarCreditEligible,
    refundPolicy: p.refundPolicy,
    proMemberDiscountEligible: p.proMemberDiscountEligible,
    proMemberDiscountPercent: parseFloat(p.proMemberDiscountPercent ?? "0"),
    shippingFee: parseFloat(p.shippingFee ?? "9.99"),
    handlingFee: parseFloat(p.handlingFee ?? "5.00"),
    isSports: p.isSports,
    isDownloadable: p.isDownloadable,
    downloadUrl: p.downloadUrl ?? null,
    downloadFileName: p.downloadFileName ?? null,
    downloadFileSize: p.downloadFileSize ?? null,
    createdAt: p.createdAt.toISOString(),
  };
}

router.get("/products", async (req, res): Promise<void> => {
  const page = parseInt(String(req.query.page ?? "1"));
  const limit = parseInt(String(req.query.limit ?? "20"));
  const offset = (page - 1) * limit;
  const category = req.query.category as string | undefined;
  const search = req.query.search as string | undefined;
  const featured = req.query.featured === "true" ? true : req.query.featured === "false" ? false : undefined;

  const products = await db.select({
    product: productsTable,
    categoryName: categoriesTable.name,
  }).from(productsTable)
    .leftJoin(categoriesTable, eq(productsTable.categoryId, categoriesTable.id))
    .where(and(
      eq(productsTable.status, "active"),
      category ? eq(categoriesTable.slug, category) : undefined,
      search ? like(productsTable.name, `%${search}%`) : undefined,
      featured !== undefined ? eq(productsTable.featured, featured) : undefined,
    ))
    .limit(limit)
    .offset(offset)
    .orderBy(desc(productsTable.featured), productsTable.name);

  const [{ value: total }] = await db.select({ value: count() }).from(productsTable).where(eq(productsTable.status, "active"));

  res.json({
    products: products.map(r => formatProduct(r.product, r.categoryName)),
    total,
    page,
    totalPages: Math.ceil(total / limit),
  });
});

router.get("/products/admin-all", requireAdmin, async (req, res): Promise<void> => {
  const rows = await db.select({
    product: productsTable,
    categoryName: categoriesTable.name,
  }).from(productsTable)
    .leftJoin(categoriesTable, eq(productsTable.categoryId, categoriesTable.id))
    .orderBy(desc(productsTable.createdAt));

  res.json({
    products: rows.map(r => ({ ...formatProduct(r.product, r.categoryName), status: r.product.status })),
    total: rows.length,
  });
});

router.post("/products", requireAdmin, async (req, res): Promise<void> => {
  const { name, slug, description, price, comparePrice, image, categoryId, stock, featured, isProPackage, commissionRate, cv, ingredients, benefits, dollarCreditEligible, refundPolicy, proMemberDiscountEligible, proMemberDiscountPercent, shippingFee, handlingFee, isSports, isDownloadable, downloadUrl, downloadFileName, downloadFileSize } = req.body;
  if (!name || !slug || !description || price == null) {
    res.status(400).json({ error: "Missing required fields" });
    return;
  }
  if (!refundPolicy || !["no_refund", "7_day_return"].includes(refundPolicy)) {
    res.status(400).json({ error: "Refund policy is required (no_refund or 7_day_return)" });
    return;
  }

  const [product] = await db.insert(productsTable).values({
    name, slug, description,
    price: String(price),
    comparePrice: comparePrice != null ? String(comparePrice) : undefined,
    image: image ?? undefined,
    categoryId: categoryId ?? undefined,
    stock: stock ?? 0,
    featured: featured ?? false,
    isProPackage: isProPackage ?? false,
    commissionRate: String(commissionRate ?? 10),
    cv: cv ?? 0,
    ingredients: ingredients ?? undefined,
    benefits: benefits ?? undefined,
    dollarCreditEligible: dollarCreditEligible ?? false,
    refundPolicy: refundPolicy ?? "no_refund",
    proMemberDiscountEligible: isProPackage ? false : (proMemberDiscountEligible ?? false),
    proMemberDiscountPercent: isProPackage ? "0" : String(proMemberDiscountPercent ?? 0),
    shippingFee: shippingFee != null ? String(shippingFee) : undefined,
    handlingFee: handlingFee != null ? String(handlingFee) : undefined,
    isSports: isSports ?? false,
    isDownloadable: isDownloadable ?? false,
    downloadUrl: downloadUrl ?? undefined,
    downloadFileName: downloadFileName ?? undefined,
    downloadFileSize: downloadFileSize ?? undefined,
    status: "active",
  }).returning();

  res.status(201).json(formatProduct(product));
});

router.get("/products/slug/:slug", async (req, res): Promise<void> => {
  const slug = Array.isArray(req.params.slug) ? req.params.slug[0] : req.params.slug;

  const [row] = await db.select({
    product: productsTable,
    categoryName: categoriesTable.name,
  }).from(productsTable)
    .leftJoin(categoriesTable, eq(productsTable.categoryId, categoriesTable.id))
    .where(eq(productsTable.slug, slug));

  if (!row) { res.status(404).json({ error: "Product not found" }); return; }

  const related = await db.select({
    product: productsTable,
    categoryName: categoriesTable.name,
  }).from(productsTable)
    .leftJoin(categoriesTable, eq(productsTable.categoryId, categoriesTable.id))
    .where(and(
      eq(productsTable.categoryId, row.product.categoryId ?? -1),
      eq(productsTable.status, "active"),
    )).limit(4);

  res.json({
    ...formatProduct(row.product, row.categoryName),
    images: row.product.images?.length ? row.product.images : (row.product.image ? [row.product.image] : []),
    ingredients: row.product.ingredients ?? null,
    benefits: row.product.benefits ?? null,
    relatedProducts: related.map(r => formatProduct(r.product, r.categoryName)),
  });
});

router.get("/products/:id", async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const [row] = await db.select({
    product: productsTable,
    categoryName: categoriesTable.name,
  }).from(productsTable)
    .leftJoin(categoriesTable, eq(productsTable.categoryId, categoriesTable.id))
    .where(eq(productsTable.id, id));

  if (!row) { res.status(404).json({ error: "Not found" }); return; }

  res.json({
    ...formatProduct(row.product, row.categoryName),
    images: row.product.images?.length ? row.product.images : (row.product.image ? [row.product.image] : []),
    ingredients: row.product.ingredients ?? null,
    benefits: row.product.benefits ?? null,
    relatedProducts: [],
  });
});

router.patch("/products/:id", requireAdmin, async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const updates: Partial<typeof productsTable.$inferInsert> = {};
  const { name, slug, description, price, comparePrice, image, categoryId, stock, featured, isProPackage, commissionRate, cv, ingredients, benefits, dollarCreditEligible, refundPolicy, proMemberDiscountEligible, proMemberDiscountPercent, shippingFee, handlingFee, isSports, isDownloadable, downloadUrl, downloadFileName, downloadFileSize } = req.body;
  if (name) updates.name = name;
  if (slug) updates.slug = slug;
  if (description) updates.description = description;
  if (price != null) updates.price = String(price);
  if (comparePrice !== undefined) updates.comparePrice = comparePrice != null ? String(comparePrice) : undefined;
  if (image !== undefined) updates.image = image;
  if (categoryId !== undefined) updates.categoryId = categoryId;
  if (stock != null) updates.stock = stock;
  if (featured !== undefined) updates.featured = featured;
  if (isProPackage !== undefined) {
    updates.isProPackage = isProPackage;
    if (isProPackage) {
      updates.proMemberDiscountEligible = false;
      updates.proMemberDiscountPercent = "0";
    }
  }
  if (commissionRate != null) updates.commissionRate = String(commissionRate);
  if (cv != null) updates.cv = cv;
  if (ingredients !== undefined) updates.ingredients = ingredients;
  if (benefits !== undefined) updates.benefits = benefits;
  if (dollarCreditEligible !== undefined) updates.dollarCreditEligible = dollarCreditEligible;
  if (refundPolicy !== undefined) updates.refundPolicy = refundPolicy;
  if (!isProPackage && proMemberDiscountEligible !== undefined) updates.proMemberDiscountEligible = proMemberDiscountEligible;
  if (!isProPackage && proMemberDiscountPercent != null) updates.proMemberDiscountPercent = String(proMemberDiscountPercent);
  if (shippingFee != null) updates.shippingFee = String(shippingFee);
  if (handlingFee != null) updates.handlingFee = String(handlingFee);
  if (isSports !== undefined) updates.isSports = isSports;
  if (isDownloadable !== undefined) updates.isDownloadable = isDownloadable;
  if (downloadUrl !== undefined) updates.downloadUrl = downloadUrl ?? undefined;
  if (downloadFileName !== undefined) updates.downloadFileName = downloadFileName ?? undefined;
  if (downloadFileSize !== undefined) updates.downloadFileSize = downloadFileSize ?? undefined;

  const [updated] = await db.update(productsTable).set(updates).where(eq(productsTable.id, id)).returning();
  if (!updated) { res.status(404).json({ error: "Not found" }); return; }

  res.json(formatProduct(updated));
});

router.delete("/products/:id", requireAdmin, async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  await db.update(productsTable).set({ status: "inactive" }).where(eq(productsTable.id, id));
  res.sendStatus(204);
});

export default router;
