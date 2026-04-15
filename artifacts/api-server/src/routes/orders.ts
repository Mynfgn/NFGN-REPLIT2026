import { Router, type IRouter } from "express";
import { db, ordersTable, orderItemsTable, cartItemsTable, productsTable, usersTable, appSettingsTable, promoCodesTable } from "@workspace/db";
import { eq, and, desc, count, sql } from "drizzle-orm";
import { requireAuth, requireAdmin } from "../lib/auth";
import { processCommissions } from "../lib/commissions";

const router: IRouter = Router();

function formatOrder(order: typeof ordersTable.$inferSelect, userName: string, items: typeof orderItemsTable.$inferSelect[]) {
  return {
    id: order.id,
    orderNumber: order.orderNumber,
    userId: order.userId,
    userName,
    status: order.status,
    paymentMethod: order.paymentMethod,
    paymentStatus: order.paymentStatus,
    subtotal: parseFloat(order.subtotal),
    tax: parseFloat(order.tax),
    shipping: parseFloat(order.shipping),
    total: parseFloat(order.total),
    discount: parseFloat(order.discount),
    shippingAddress: order.shippingAddress ?? null,
    promoCode: order.promoCode ?? null,
    notes: order.notes ?? null,
    createdAt: order.createdAt.toISOString(),
    items: items.map(i => ({
      id: i.id,
      productId: i.productId,
      productName: i.productName,
      productImage: i.productImage ?? null,
      price: parseFloat(i.price),
      quantity: i.quantity,
      total: parseFloat(i.total),
    })),
  };
}

router.get("/orders", requireAuth, async (req, res): Promise<void> => {
  const currentUser = (req as typeof req & { user: typeof usersTable.$inferSelect }).user;
  const page = parseInt(String(req.query.page ?? "1"));
  const limit = parseInt(String(req.query.limit ?? "20"));
  const offset = (page - 1) * limit;
  const status = req.query.status as string | undefined;
  const userId = req.query.userId ? parseInt(String(req.query.userId)) : undefined;

  const isAdmin = ["super_admin", "admin", "store_admin"].includes(currentUser.role);
  const targetUserId = isAdmin ? userId : currentUser.id;

  const orders = await db.select({
    order: ordersTable,
    user: usersTable,
  }).from(ordersTable)
    .leftJoin(usersTable, eq(ordersTable.userId, usersTable.id))
    .where(and(
      targetUserId ? eq(ordersTable.userId, targetUserId) : undefined,
      status ? eq(ordersTable.status, status) : undefined,
    ))
    .limit(limit)
    .offset(offset)
    .orderBy(desc(ordersTable.createdAt));

  const [{ value: total }] = await db.select({ value: count() }).from(ordersTable).where(
    and(
      targetUserId ? eq(ordersTable.userId, targetUserId) : undefined,
      status ? eq(ordersTable.status, status) : undefined,
    )
  );

  const result = [];
  for (const row of orders) {
    const items = await db.select().from(orderItemsTable).where(eq(orderItemsTable.orderId, row.order.id));
    const userName = row.user ? `${row.user.firstName} ${row.user.lastName}` : "Unknown";
    result.push(formatOrder(row.order, userName, items));
  }

  res.json({ orders: result, total, page, totalPages: Math.ceil(total / limit) });
});

router.post("/orders", requireAuth, async (req, res): Promise<void> => {
  const currentUser = (req as typeof req & { user: typeof usersTable.$inferSelect }).user;
  const { paymentMethod, shippingAddress, promoCode, notes } = req.body;

  if (!paymentMethod || !shippingAddress) {
    res.status(400).json({ error: "paymentMethod and shippingAddress required" });
    return;
  }

  const cartItems = await db.select({
    cart: cartItemsTable,
    product: productsTable,
  }).from(cartItemsTable)
    .leftJoin(productsTable, eq(cartItemsTable.productId, productsTable.id))
    .where(eq(cartItemsTable.userId, currentUser.id));

  if (!cartItems.length) {
    res.status(400).json({ error: "Cart is empty" });
    return;
  }

  const [settings] = await db.select().from(appSettingsTable).limit(1);
  const taxRate = parseFloat(settings?.taxRate ?? "8.5") / 100;
  const shippingRate = parseFloat(settings?.shippingRate ?? "9.99");
  const freeShippingThreshold = parseFloat(settings?.freeShippingThreshold ?? "75");

  let subtotal = 0;
  for (const { cart, product } of cartItems) {
    if (product) subtotal += parseFloat(product.price) * cart.quantity;
  }

  let discount = 0;
  if (promoCode) {
    const [promo] = await db.select().from(promoCodesTable).where(eq(promoCodesTable.code, promoCode));
    if (promo && promo.isActive) {
      if (promo.discountType === "percentage") {
        discount = subtotal * parseFloat(promo.discountValue) / 100;
      } else {
        discount = parseFloat(promo.discountValue);
      }
    }
  }

  const afterDiscount = subtotal - discount;
  const tax = afterDiscount * taxRate;
  const shipping = afterDiscount >= freeShippingThreshold ? 0 : shippingRate;
  const total = afterDiscount + tax + shipping;

  const orderNumber = `NFGN-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

  const [order] = await db.insert(ordersTable).values({
    orderNumber,
    userId: currentUser.id,
    status: "pending",
    paymentMethod,
    paymentStatus: paymentMethod === "cod" ? "pending" : "demo_paid",
    subtotal: String(subtotal),
    tax: String(tax),
    shipping: String(shipping),
    discount: String(discount),
    total: String(total),
    shippingAddress,
    promoCode: promoCode ?? undefined,
    notes: notes ?? undefined,
  }).returning();

  let containsProPackage = false;

  for (const { cart, product } of cartItems) {
    if (!product) continue;
    const lineTotal = parseFloat(product.price) * cart.quantity;
    await db.insert(orderItemsTable).values({
      orderId: order.id,
      productId: product.id,
      productName: product.name,
      productImage: product.image ?? undefined,
      price: product.price,
      quantity: cart.quantity,
      total: String(lineTotal),
    });

    await db.update(productsTable).set({ stock: Math.max(0, product.stock - cart.quantity) }).where(eq(productsTable.id, product.id));

    if (product.isProPackage) {
      containsProPackage = true;
      await db.update(usersTable).set({
        isProMember: true,
        role: "pro_member",
        proMemberSince: new Date(),
      }).where(eq(usersTable.id, currentUser.id));
    }
  }

  await db.delete(cartItemsTable).where(eq(cartItemsTable.userId, currentUser.id));

  await processCommissions(order.id, orderNumber, total, currentUser.id, containsProPackage);

  const items = await db.select().from(orderItemsTable).where(eq(orderItemsTable.orderId, order.id));
  const userName = `${currentUser.firstName} ${currentUser.lastName}`;
  res.status(201).json(formatOrder(order, userName, items));
});

router.get("/orders/:id", requireAuth, async (req, res): Promise<void> => {
  const currentUser = (req as typeof req & { user: typeof usersTable.$inferSelect }).user;
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const [row] = await db.select({
    order: ordersTable,
    user: usersTable,
  }).from(ordersTable)
    .leftJoin(usersTable, eq(ordersTable.userId, usersTable.id))
    .where(eq(ordersTable.id, id));

  if (!row) { res.status(404).json({ error: "Not found" }); return; }

  const isAdmin = ["super_admin", "admin", "store_admin"].includes(currentUser.role);
  if (!isAdmin && row.order.userId !== currentUser.id) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  const items = await db.select().from(orderItemsTable).where(eq(orderItemsTable.orderId, id));
  const userName = row.user ? `${row.user.firstName} ${row.user.lastName}` : "Unknown";
  res.json(formatOrder(row.order, userName, items));
});

router.patch("/orders/:id", requireAdmin, async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const { status, paymentStatus } = req.body;
  const updates: Partial<typeof ordersTable.$inferInsert> = { status };
  if (paymentStatus) updates.paymentStatus = paymentStatus;

  const [updated] = await db.update(ordersTable).set(updates).where(eq(ordersTable.id, id)).returning();
  if (!updated) { res.status(404).json({ error: "Not found" }); return; }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, updated.userId));
  const items = await db.select().from(orderItemsTable).where(eq(orderItemsTable.orderId, id));
  const userName = user ? `${user.firstName} ${user.lastName}` : "Unknown";
  res.json(formatOrder(updated, userName, items));
});

export default router;
