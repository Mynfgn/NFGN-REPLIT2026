import { Router, type IRouter } from "express";
import { db, cartItemsTable, productsTable, usersTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireAuth } from "../lib/auth";

const router: IRouter = Router();

async function buildCart(userId: number) {
  const items = await db.select({
    cart: cartItemsTable,
    product: productsTable,
  }).from(cartItemsTable)
    .leftJoin(productsTable, eq(cartItemsTable.productId, productsTable.id))
    .where(eq(cartItemsTable.userId, userId));

  let subtotal = 0;
  const cartItems = items.map(({ cart, product }) => {
    if (!product) return null;
    const price = parseFloat(product.price);
    const lineTotal = price * cart.quantity;
    subtotal += lineTotal;
    return {
      id: cart.id,
      productId: cart.productId,
      productName: product.name,
      productImage: product.image ?? null,
      price,
      quantity: cart.quantity,
      lineTotal,
    };
  }).filter(Boolean);

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
  const { productId, quantity } = req.body;

  if (!productId || !quantity) { res.status(400).json({ error: "productId and quantity required" }); return; }

  const [existing] = await db.select().from(cartItemsTable).where(and(
    eq(cartItemsTable.userId, userId),
    eq(cartItemsTable.productId, productId)
  ));

  if (existing) {
    await db.update(cartItemsTable).set({ quantity: existing.quantity + quantity }).where(eq(cartItemsTable.id, existing.id));
  } else {
    await db.insert(cartItemsTable).values({ userId, productId, quantity });
  }

  res.json(await buildCart(userId));
});

router.patch("/cart/items/:itemId", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as typeof req & { user: typeof usersTable.$inferSelect }).user.id;
  const itemId = parseInt(Array.isArray(req.params.itemId) ? req.params.itemId[0] : req.params.itemId);
  const { quantity } = req.body;

  if (!quantity || quantity < 1) {
    await db.delete(cartItemsTable).where(and(eq(cartItemsTable.id, itemId), eq(cartItemsTable.userId, userId)));
  } else {
    await db.update(cartItemsTable).set({ quantity }).where(and(eq(cartItemsTable.id, itemId), eq(cartItemsTable.userId, userId)));
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
