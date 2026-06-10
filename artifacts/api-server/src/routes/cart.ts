import { Router, type IRouter } from "express";
import { db, cartItemsTable, productsTable, usersTable, booksTable } from "@workspace/db";
import { eq, and, isNotNull } from "drizzle-orm";
import { requireAuth } from "../lib/auth";

const router: IRouter = Router();

async function buildCart(userId: number) {
  // Physical product rows (productId is set)
  const productRows = await db.select({
    cart: cartItemsTable,
    product: productsTable,
  }).from(cartItemsTable)
    .leftJoin(productsTable, eq(cartItemsTable.productId, productsTable.id))
    .where(and(eq(cartItemsTable.userId, userId), isNotNull(cartItemsTable.productId)));

  // Digital book rows (bookId is set)
  const bookRows = await db.select({
    cart: cartItemsTable,
    book: booksTable,
  }).from(cartItemsTable)
    .innerJoin(booksTable, eq(cartItemsTable.bookId, booksTable.id))
    .where(and(eq(cartItemsTable.userId, userId), isNotNull(cartItemsTable.bookId)));

  let subtotal = 0;

  const productItems = productRows.map(({ cart, product }) => {
    if (!product) return null;
    const basePrice = parseFloat(product.price);
    const isDonation = product.isDonation || product.isChurchDonation;
    const price = (isDonation && cart.customPrice != null)
      ? parseFloat(cart.customPrice)
      : basePrice;
    const lineTotal = price * cart.quantity;
    subtotal += lineTotal;
    const cvPerUnit = product.cv ?? 0;
    return {
      id: cart.id,
      productId: cart.productId,
      bookId: null as number | null,
      productName: product.name,
      productImage: product.image ?? null,
      price,
      customPrice: cart.customPrice != null ? parseFloat(cart.customPrice) : null,
      quantity: cart.quantity,
      lineTotal,
      cvPerUnit,
      cvLineTotal: cvPerUnit * cart.quantity,
      isDonation: !!isDonation,
      donationMinAmount: product.donationMinAmount != null ? parseFloat(product.donationMinAmount) : null,
      isDigitalBook: false as boolean,
    };
  }).filter(Boolean);

  const bookItems = bookRows.map(({ cart, book }) => {
    const price = book.isFree ? 0 : parseFloat(book.price);
    subtotal += price;
    const cvPerUnit = Number(book.cv ?? 0);
    return {
      id: cart.id,
      productId: null as number | null,
      bookId: cart.bookId,
      productName: `${book.title} (Digital Book)`,
      productImage: book.coverImage ?? null,
      price,
      customPrice: null as number | null,
      quantity: 1,
      lineTotal: price,
      cvPerUnit,
      cvLineTotal: cvPerUnit,
      isDonation: false,
      donationMinAmount: null as number | null,
      isDigitalBook: true,
    };
  });

  const cartItems = [...productItems, ...bookItems].filter(Boolean);

  return {
    items: cartItems,
    subtotal,
    total: subtotal,
    itemCount: cartItems.reduce((sum, i) => sum + (i?.quantity ?? 0), 0),
  };
}

router.get("/cart", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as typeof req & { user: typeof usersTable.$inferSelect }).user.id;
  res.json(await buildCart(userId));
});

router.post("/cart/items", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as typeof req & { user: typeof usersTable.$inferSelect }).user.id;
  const { productId, quantity, customPrice } = req.body;

  if (!productId || !quantity) { res.status(400).json({ error: "productId and quantity required" }); return; }

  const [existing] = await db.select().from(cartItemsTable).where(and(
    eq(cartItemsTable.userId, userId),
    eq(cartItemsTable.productId, productId)
  ));

  const customPriceVal = customPrice != null ? String(customPrice) : undefined;

  if (existing) {
    await db.update(cartItemsTable)
      .set({ quantity: existing.quantity + quantity, ...(customPriceVal !== undefined ? { customPrice: customPriceVal } : {}) })
      .where(eq(cartItemsTable.id, existing.id));
  } else {
    await db.insert(cartItemsTable).values({ userId, productId, quantity, ...(customPriceVal !== undefined ? { customPrice: customPriceVal } : {}) });
  }

  res.json(await buildCart(userId));
});

router.patch("/cart/items/:itemId", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as typeof req & { user: typeof usersTable.$inferSelect }).user.id;
  const itemId = parseInt(Array.isArray(req.params.itemId) ? req.params.itemId[0] : req.params.itemId);
  const { quantity, customPrice } = req.body;

  if (!quantity || quantity < 1) {
    await db.delete(cartItemsTable).where(and(eq(cartItemsTable.id, itemId), eq(cartItemsTable.userId, userId)));
  } else {
    const updates: Record<string, unknown> = { quantity };
    if (customPrice != null) updates.customPrice = String(customPrice);
    await db.update(cartItemsTable).set(updates as any).where(and(eq(cartItemsTable.id, itemId), eq(cartItemsTable.userId, userId)));
  }

  res.json(await buildCart(userId));
});

router.delete("/cart/items/:itemId", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as typeof req & { user: typeof usersTable.$inferSelect }).user.id;
  const itemId = parseInt(Array.isArray(req.params.itemId) ? req.params.itemId[0] : req.params.itemId);

  await db.delete(cartItemsTable).where(and(eq(cartItemsTable.id, itemId), eq(cartItemsTable.userId, userId)));
  res.json(await buildCart(userId));
});

router.delete("/cart/clear", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as typeof req & { user: typeof usersTable.$inferSelect }).user.id;
  await db.delete(cartItemsTable).where(eq(cartItemsTable.userId, userId));
  res.json({ success: true });
});

export default router;
