import { Router, type IRouter } from "express";
import { db, ordersTable, orderItemsTable, cartItemsTable, productsTable, usersTable, appSettingsTable, promoCodesTable, dollarCreditsTable, walletsTable, walletTransactionsTable } from "@workspace/db";
import { eq, and, desc, count, sql, inArray, gte } from "drizzle-orm";
import { requireAuth, requireAdmin } from "../lib/auth";
import { processCommissions, type OrderItemForCommission } from "../lib/commissions";
import { sendEmail, giftNotificationHtml } from "../lib/mailer";

/**
 * Check and update a sponsor's APM status based on their active Level 1 Pro Members.
 * Called when a Pro Member is activated or deactivated in a sponsor's direct downline.
 * APM requires 9+ active Level 1 Pro Member subscriptions; reverts to RCB if below.
 */
async function evaluateApmStatus(sponsorId: number) {
  const [sponsor] = await db.select().from(usersTable).where(eq(usersTable.id, sponsorId));
  if (!sponsor) return;

  // Only evaluate retail-tier members (not existing Pro Members or admins)
  const retailTiers = ["retail_member", "referring_retail_member", "retail_community_builder", "associate_pro_member"];
  if (!retailTiers.includes(sponsor.memberTier ?? "retail_member")) return;

  // Count active Level 1 Pro Members in sponsor's direct downline
  const [{ activeProCount }] = await db
    .select({ activeProCount: sql<number>`count(*)` })
    .from(usersTable)
    .where(
      and(
        eq(usersTable.sponsorId, sponsorId),
        eq(usersTable.role, "pro_member"),
        eq(usersTable.proMemberStatus, "active"),
      ),
    );
  const count = Number(activeProCount ?? 0);

  const currentTier = sponsor.memberTier ?? "retail_member";

  if (count >= 9 && currentTier !== "associate_pro_member") {
    // Promote to APM
    await db.update(usersTable).set({ memberTier: "associate_pro_member" }).where(eq(usersTable.id, sponsorId));
  } else if (count < 9 && currentTier === "associate_pro_member") {
    // Revert APM → RCB (they still have their retail referral history)
    await db.update(usersTable).set({ memberTier: "retail_community_builder" }).where(eq(usersTable.id, sponsorId));
  }
}

/**
 * Calculate a user's Personal Commission Volume (PCV) in a rolling 30-day window.
 * Used to verify Pro Member maintenance requirement (150 PCV).
 */
async function getRolling30DayPcv(userId: number): Promise<number> {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const [{ total }] = await db
    .select({ total: sql<number>`coalesce(sum(${orderItemsTable.cvTotal}), 0)` })
    .from(orderItemsTable)
    .innerJoin(ordersTable, eq(orderItemsTable.orderId, ordersTable.id))
    .where(
      and(
        eq(ordersTable.userId, userId),
        gte(ordersTable.createdAt, thirtyDaysAgo),
        sql`${ordersTable.status} != 'refunded'`,
      ),
    );
  return Number(total ?? 0);
}

/**
 * Handle referral-based rewards when a member places an order:
 * 1. Auto-promote sponsor tier (RM → RRM → UPM) based on referred members who have placed orders
 * 2. Award $-Credits to sponsor (10% of eligible line totals) if tier is RRM or higher
 */
async function handleReferralRewards(
  orderId: number,
  orderNumber: string,
  buyerId: number,
  sponsorId: number,
  items: { cart: typeof cartItemsTable.$inferSelect; product: typeof productsTable.$inferSelect | null }[],
) {
  const [sponsor] = await db.select().from(usersTable).where(eq(usersTable.id, sponsorId));
  if (!sponsor) return;

  // Only applies to member-tier sponsors (not pro_member/admin roles — they use the commission engine)
  const isMemberSponsor = !["pro_member", "super_admin", "admin", "store_admin"].includes(sponsor.role);
  if (!isMemberSponsor) return;

  // Count distinct referred members (excluding admin/pro roles) who have at least one non-refunded order
  const referredBuyerRows = await db
    .selectDistinct({ userId: ordersTable.userId })
    .from(ordersTable)
    .innerJoin(usersTable, eq(ordersTable.userId, usersTable.id))
    .where(
      and(
        eq(usersTable.sponsorId, sponsorId),
        sql`${usersTable.role} NOT IN ('pro_member', 'super_admin', 'admin', 'store_admin')`,
        sql`${ordersTable.status} != 'refunded'`,
      ),
    );
  const referredBuyerCount = referredBuyerRows.length;

  // Tier promotion logic (Retail ladder: RM → RRM → RCB)
  // APM promotion is handled separately when a Pro Member is activated in L1
  const currentTier = sponsor.memberTier ?? "retail_member";
  let newTier = currentTier;

  if (currentTier === "retail_member" && referredBuyerCount >= 1) {
    newTier = "referring_retail_member";
  } else if (currentTier === "referring_retail_member" && referredBuyerCount >= 9) {
    newTier = "retail_community_builder";
  }

  if (newTier !== currentTier) {
    await db.update(usersTable).set({ memberTier: newTier }).where(eq(usersTable.id, sponsorId));
  }

  // Award $-Credits for eligible products if sponsor is RRM, RCB, or APM tier
  const earnsCredits = ["referring_retail_member", "retail_community_builder", "associate_pro_member"].includes(newTier);
  if (!earnsCredits) return;

  let creditAmount = 0;
  for (const { cart, product } of items) {
    if (!product || !product.dollarCreditEligible) continue;
    const lineTotal = parseFloat(product.price) * cart.quantity;
    creditAmount += lineTotal * 0.1; // 10% of eligible line total
  }

  if (creditAmount > 0) {
    const earnedAt = new Date();
    const availableAt = new Date(earnedAt.getTime() + 7 * 24 * 60 * 60 * 1000);   // +7 days hold
    const expiresAt = new Date(availableAt.getTime() + 30 * 24 * 60 * 60 * 1000); // +30 days window

    await db.insert(dollarCreditsTable).values({
      userId: sponsorId,
      amount: creditAmount.toFixed(2),
      remainingAmount: creditAmount.toFixed(2),
      status: "pending",
      earnedAt,
      availableAt,
      expiresAt,
      sourceOrderId: orderId,
      referredUserId: buyerId,
      notes: `Earned from referred member purchase — Order ${orderNumber}`,
    });
  }
}

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
    refundAmount: parseFloat(order.refundAmount ?? "0"),
    refundNote: order.refundNote ?? null,
    refundedAt: order.refundedAt?.toISOString() ?? null,
    shippingAddress: order.shippingAddress ?? null,
    promoCode: order.promoCode ?? null,
    notes: order.notes ?? null,
    createdAt: order.createdAt.toISOString(),
    isPickup: order.isPickup,
    handlingFee: parseFloat(order.handlingFee ?? "0"),
    digitalSignature: order.digitalSignature ?? null,
    digitalSignedAt: order.digitalSignedAt?.toISOString() ?? null,
    items: items.map(i => ({
      id: i.id,
      productId: i.productId,
      productName: i.productName,
      productImage: i.productImage ?? null,
      price: parseFloat(i.price),
      quantity: i.quantity,
      total: parseFloat(i.total),
      cvTotal: i.cvTotal ?? 0,
      isDownloadable: i.isDownloadable,
      downloadUrl: i.downloadUrl ?? null,
      downloadFileName: i.downloadFileName ?? null,
    })),
  };
}

/**
 * Member-facing: GET /orders
 * ALWAYS returns only the authenticated user's own orders.
 * Admins viewing their member dashboard are also scoped to their own orders here.
 * Admin panel must use GET /admin/orders to access all members' orders.
 */
router.get("/orders", requireAuth, async (req, res): Promise<void> => {
  // Disable caching so the browser never serves a stale all-orders response.
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.removeHeader("ETag");

  const currentUser = (req as typeof req & { user: typeof usersTable.$inferSelect }).user;
  const page = parseInt(String(req.query.page ?? "1"));
  const limit = parseInt(String(req.query.limit ?? "20"));
  const offset = (page - 1) * limit;
  const status = req.query.status as string | undefined;

  // Always scope to the current user — no cross-member visibility.
  const targetUserId = currentUser.id;

  const whereClause = and(
    eq(ordersTable.userId, targetUserId),
    status ? eq(ordersTable.status, status) : undefined,
  );

  const orders = await db.select({
    order: ordersTable,
    user: usersTable,
  }).from(ordersTable)
    .leftJoin(usersTable, eq(ordersTable.userId, usersTable.id))
    .where(whereClause)
    .limit(limit)
    .offset(offset)
    .orderBy(desc(ordersTable.createdAt));

  const [{ value: total }] = await db.select({ value: count() }).from(ordersTable).where(whereClause);

  const result = [];
  for (const row of orders) {
    const items = await db.select().from(orderItemsTable).where(eq(orderItemsTable.orderId, row.order.id));
    const userName = row.user ? `${row.user.firstName} ${row.user.lastName}` : "Unknown";
    result.push(formatOrder(row.order, userName, items));
  }

  res.json({ orders: result, total, page, totalPages: Math.ceil(total / limit) });
});

/**
 * Admin-only: GET /admin/orders
 * Returns all orders across all members, with optional filters.
 */
router.get("/admin/orders", requireAdmin, async (req, res): Promise<void> => {
  const page = parseInt(String(req.query.page ?? "1"));
  const limit = parseInt(String(req.query.limit ?? "20"));
  const offset = (page - 1) * limit;
  const status = req.query.status as string | undefined;
  const userId = req.query.userId ? parseInt(String(req.query.userId)) : undefined;
  const paymentStatus = req.query.paymentStatus as string | undefined;
  const paymentMethod = req.query.paymentMethod as string | undefined;

  const paymentMethods = paymentMethod ? paymentMethod.split(",").map(s => s.trim()).filter(Boolean) : undefined;

  const whereClause = and(
    userId ? eq(ordersTable.userId, userId) : undefined,
    status ? eq(ordersTable.status, status) : undefined,
    paymentStatus ? eq(ordersTable.paymentStatus, paymentStatus) : undefined,
    paymentMethods && paymentMethods.length === 1
      ? eq(ordersTable.paymentMethod, paymentMethods[0])
      : paymentMethods && paymentMethods.length > 1
      ? sql`${ordersTable.paymentMethod} IN (${sql.join(paymentMethods.map(m => sql`${m}`), sql`, `)})`
      : undefined,
  );

  const orders = await db.select({
    order: ordersTable,
    user: usersTable,
  }).from(ordersTable)
    .leftJoin(usersTable, eq(ordersTable.userId, usersTable.id))
    .where(whereClause)
    .limit(limit)
    .offset(offset)
    .orderBy(desc(ordersTable.createdAt));

  const [{ value: total }] = await db.select({ value: count() }).from(ordersTable).where(whereClause);

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
  const { paymentMethod, shippingAddress, promoCode, notes, walletAmount, isPickup } = req.body;

  if (!paymentMethod) {
    res.status(400).json({ error: "paymentMethod required" });
    return;
  }
  if (!isPickup && !shippingAddress) {
    res.status(400).json({ error: "shippingAddress required for delivery orders" });
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
  let appliedPromoId: number | null = null;
  if (promoCode) {
    const [promo] = await db.select().from(promoCodesTable).where(eq(promoCodesTable.code, promoCode.toUpperCase().trim()));
    if (promo && promo.isActive) {
      if (promo.discountType === "percentage") {
        discount = subtotal * parseFloat(promo.discountValue) / 100;
      } else {
        discount = Math.min(parseFloat(promo.discountValue), subtotal);
      }
      appliedPromoId = promo.id;
    }
  }

  // ── Tax is calculated on (subtotal - promoDiscount), BEFORE wallet credit.
  // Wallet credit is a payment method, not a price reduction — it does NOT
  // reduce the taxable amount. This ensures tax compliance.
  const afterDiscount = subtotal - discount;
  const tax = afterDiscount * taxRate;

  // ── Per-product shipping (delivery) or handling (pickup) ──────────────────
  // Downloadable products have no physical fulfillment — no shipping or handling fee
  let shippingTotal = 0;
  let handlingTotal = 0;
  for (const { cart, product } of cartItems) {
    if (!product || product.isDownloadable) continue;
    if (isPickup) {
      handlingTotal += parseFloat(product.handlingFee ?? "5.00") * cart.quantity;
    } else {
      shippingTotal += parseFloat(product.shippingFee ?? "9.99") * cart.quantity;
    }
  }
  // Free shipping threshold still applies for delivery
  if (!isPickup && afterDiscount >= freeShippingThreshold) shippingTotal = 0;

  const shipping = shippingTotal;
  const total = afterDiscount + tax + shipping + handlingTotal;

  // ── Validate & clamp wallet credit (applied post-tax, never reduces taxable base) ──
  const requestedWallet = parseFloat(String(walletAmount ?? 0)) || 0;
  let walletDeduction = 0;
  let walletRecord: typeof walletsTable.$inferSelect | null = null;

  if (requestedWallet > 0) {
    const [w] = await db.select().from(walletsTable).where(eq(walletsTable.userId, currentUser.id));
    if (!w) {
      res.status(400).json({ error: "Wallet not found." });
      return;
    }
    const available = parseFloat(w.balance);
    if (requestedWallet > available) {
      res.status(400).json({ error: `Wallet balance too low. Available: $${available.toFixed(2)}.` });
      return;
    }
    // Clamp: can't apply more than the actual order total
    walletDeduction = Math.min(requestedWallet, total);
    walletRecord = w;
  }

  const walletCoversAll = walletDeduction >= total;

  const orderNumber = `NFGN-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

  // Determine payment status
  let paymentStatus: string;
  if (walletCoversAll) {
    paymentStatus = "paid";
  } else if (paymentMethod === "cod") {
    paymentStatus = "not_received";
  } else {
    paymentStatus = "demo_paid";
  }

  const [order] = await db.insert(ordersTable).values({
    orderNumber,
    userId: currentUser.id,
    status: "pending",
    paymentMethod,
    paymentStatus,
    subtotal: String(subtotal),
    tax: String(tax),
    shipping: String(shipping),
    handlingFee: String(handlingTotal),
    isPickup: !!isPickup,
    discount: String(discount),
    total: String(total),
    shippingAddress: shippingAddress ?? undefined,
    promoCode: promoCode ?? undefined,
    notes: notes ?? undefined,
  }).returning();

  // ── Deduct wallet credit and record transaction ──────────────────────────
  if (walletDeduction > 0 && walletRecord) {
    const newBalance = parseFloat(walletRecord.balance) - walletDeduction;
    await db.update(walletsTable)
      .set({ balance: String(newBalance) })
      .where(eq(walletsTable.id, walletRecord.id));
    await db.insert(walletTransactionsTable).values({
      walletId: walletRecord.id,
      type: "debit",
      amount: String(walletDeduction),
      balance: String(newBalance),
      description: `E-Wallet credit applied to order ${orderNumber}`,
    });
  }

  // Increment promo code usedCount
  if (appliedPromoId) {
    await db.update(promoCodesTable)
      .set({ usedCount: sql`${promoCodesTable.usedCount} + 1` })
      .where(eq(promoCodesTable.id, appliedPromoId));
  }

  let containsProPackage = false;
  const commissionItems: OrderItemForCommission[] = [];

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
      cvTotal: (product.cv ?? 0) * cart.quantity,
      isDownloadable: product.isDownloadable,
      downloadUrl: product.downloadUrl ?? undefined,
      downloadFileName: product.downloadFileName ?? undefined,
    });

    commissionItems.push({
      price: product.price,
      quantity: cart.quantity,
      commissionRate: product.commissionRate ?? "10",
      isDonationOrSponsorship: !!(product.isDonation || product.isChurchDonation || product.isSports),
      // Monetary gifts: pass the charity split % so the engine uses only the
      // member portion as the commissionable base.
      giftCharityPercent: (product.isDonation || product.isChurchDonation)
        ? parseFloat(product.giftCharityPercent ?? "80")
        : undefined,
    });

    // Downloadable products have unlimited stock — don't decrement
    if (!product.isDownloadable) {
      await db.update(productsTable).set({ stock: Math.max(0, product.stock - cart.quantity) }).where(eq(productsTable.id, product.id));
    }

    if (product.isProPackage) {
      containsProPackage = true;
      // Mark user as pending Pro Member — full upgrade happens when admin approves the order
      await db.update(usersTable).set({
        proMemberStatus: "pending_approval",
        role: "pro_member",
      }).where(eq(usersTable.id, currentUser.id));
    }
  }

  await db.delete(cartItemsTable).where(eq(cartItemsTable.userId, currentUser.id));

  // Only process commissions immediately for non-pro-package orders
  // Pro package orders: commissions are deferred until admin approval
  if (!containsProPackage) {
    await processCommissions(order.id, orderNumber, total, currentUser.id, false, commissionItems);
  }

  // Tier promotion + $-Credit award for referral sponsor (member-tier sponsors only)
  if (!containsProPackage && currentUser.sponsorId) {
    await handleReferralRewards(order.id, orderNumber, currentUser.id, currentUser.sponsorId, cartItems);
  }

  const items = await db.select().from(orderItemsTable).where(eq(orderItemsTable.orderId, order.id));
  const userName = `${currentUser.firstName} ${currentUser.lastName}`;

  // ── Gift / Donation notification emails ──────────────────────────────────
  // Sent for every monetary gift/donation item in the order.
  // Recipients: giver (member), direct sponsor (referral reward), admin.
  // Clear "GIFT" language throughout — not a payment, not taxable income.
  const dashUrl = process.env.APP_URL ?? "https://nfgn.com/dashboard";
  const adminEmail = process.env.ADMIN_EMAIL ?? "Mynfgn@gmail.com";

  const giftItems = cartItems.filter(({ product: p }) => p && (p.isDonation || p.isChurchDonation));
  if (giftItems.length > 0) {
    for (const { cart, product: giftProduct } of giftItems) {
      if (!giftProduct) continue;
      const giftAmount    = parseFloat(giftProduct.price) * cart.quantity;
      const charityPct    = parseFloat(giftProduct.giftCharityPercent ?? "80");
      const memberPct     = 100 - charityPct;
      const charityAmount = parseFloat((giftAmount * charityPct / 100).toFixed(2));
      const memberAmount  = parseFloat((giftAmount * memberPct  / 100).toFixed(2));
      const orgName       = giftProduct.churchName ?? giftProduct.donationRecipientName ?? giftProduct.donationRecipientType ?? "Organisation";

      const baseOpts = {
        giverName: userName,
        giverEmail: currentUser.email,
        productName: giftProduct.name,
        recipientOrgName: orgName,
        giftAmount,
        charityAmount,
        memberAmount,
        charityPercent: charityPct,
        memberPercent: memberPct,
        orderNumber,
        dashboardUrl: dashUrl,
      };

      // Email 1: giver
      await sendEmail({
        to: currentUser.email,
        subject: `Gift Confirmation — Thank you for your generosity! (Order ${orderNumber})`,
        html: giftNotificationHtml({ role: "giver", recipientName: currentUser.firstName, ...baseOpts }),
      });

      // Email 2: admin
      await sendEmail({
        to: adminEmail,
        subject: `New Gift Received — ${orgName} — Order ${orderNumber}`,
        html: giftNotificationHtml({ role: "admin", recipientName: "Admin", ...baseOpts }),
      });

      // Email 3: direct sponsor (if any) — they earn a referral reward
      if (currentUser.sponsorId) {
        const [sponsorUser] = await db.select().from(usersTable).where(eq(usersTable.id, currentUser.sponsorId));
        if (sponsorUser) {
          const [sponsorWallet] = await db.select().from(walletsTable).where(eq(walletsTable.userId, sponsorUser.id));
          const sponsorCommission = sponsorWallet
            ? parseFloat((memberAmount * 0.1).toFixed(2)) // approx 10% of member pool as indication
            : undefined;
          await sendEmail({
            to: sponsorUser.email,
            subject: `Gift Reward — Your member ${userName} just gave a gift! (Order ${orderNumber})`,
            html: giftNotificationHtml({
              role: "sponsor",
              recipientName: sponsorUser.firstName,
              sponsorCommission,
              ...baseOpts,
            }),
          });
        }
      }
    }
  }

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
  const updates: Partial<typeof ordersTable.$inferInsert> = {};
  if (status) updates.status = status;
  if (paymentStatus) updates.paymentStatus = paymentStatus;

  const [updated] = await db.update(ordersTable).set(updates).where(eq(ordersTable.id, id)).returning();
  if (!updated) { res.status(404).json({ error: "Not found" }); return; }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, updated.userId));
  const items = await db.select().from(orderItemsTable).where(eq(orderItemsTable.orderId, id));

  // When an order is approved, check if it contains a Pro Package and activate the member
  if (status === "approved" && user && user.proMemberStatus === "pending_approval") {
    const productIds = items.map(i => i.productId).filter(Boolean) as number[];
    if (productIds.length > 0) {
      const proProducts = await db.select({ id: productsTable.id, isProPackage: productsTable.isProPackage })
        .from(productsTable)
        .where(inArray(productsTable.id, productIds));
      const hasProPackage = proProducts.some(p => p.isProPackage);

      if (hasProPackage) {
        // Activate Pro Member status now that order is approved
        await db.update(usersTable).set({
          isProMember: true,
          proMemberStatus: "active",
          proMemberSince: new Date(),
        }).where(eq(usersTable.id, user.id));

        // Now process the deferred commissions for this order
        const commissionItems: import("../lib/commissions").OrderItemForCommission[] = items.map(i => ({
          price: i.price,
          quantity: i.quantity,
          commissionRate: "10",
        }));
        const orderTotal = parseFloat(updated.total);
        await processCommissions(updated.id, updated.orderNumber, orderTotal, user.id, true, commissionItems);

        // Evaluate sponsor's APM status — they may now qualify (9+ active L1 Pro Members)
        if (user.sponsorId) {
          await evaluateApmStatus(user.sponsorId);
        }
      }
    }
  }

  const userName = user ? `${user.firstName} ${user.lastName}` : "Unknown";
  res.json(formatOrder(updated, userName, items));
});

// ── Refund / Adjustment ──────────────────────────────────────────────────────
router.post("/orders/:id/refund", requireAdmin, async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const { amount, note, fullRefund } = req.body;

  const [order] = await db.select({
    order: ordersTable,
    user: usersTable,
  }).from(ordersTable)
    .leftJoin(usersTable, eq(ordersTable.userId, usersTable.id))
    .where(eq(ordersTable.id, id));

  if (!order) { res.status(404).json({ error: "Order not found" }); return; }

  const refundAmt = fullRefund ? parseFloat(order.order.total) : parseFloat(String(amount ?? 0));
  if (isNaN(refundAmt) || refundAmt <= 0) {
    res.status(400).json({ error: "Invalid refund amount" });
    return;
  }
  if (refundAmt > parseFloat(order.order.total)) {
    res.status(400).json({ error: "Refund amount exceeds order total" });
    return;
  }

  const [updated] = await db.update(ordersTable).set({
    refundAmount: String(refundAmt),
    refundNote: note ?? null,
    refundedAt: new Date(),
    status: fullRefund ? "refunded" : order.order.status,
    paymentStatus: fullRefund ? "refunded" : order.order.paymentStatus,
  }).where(eq(ordersTable.id, id)).returning();

  const items = await db.select().from(orderItemsTable).where(eq(orderItemsTable.orderId, id));
  const userName = order.user ? `${order.user.firstName} ${order.user.lastName}` : "Unknown";
  res.json(formatOrder(updated, userName, items));
});

// POST /api/orders/estimate — compute shipping + tax + final due without creating an order
router.post("/orders/estimate", requireAuth, async (req, res): Promise<void> => {
  const currentUser = (req as typeof req & { user: typeof usersTable.$inferSelect }).user;
  const { promoCode, walletAmount, isPickup } = req.body;

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
  const freeShippingThreshold = parseFloat(settings?.freeShippingThreshold ?? "75");

  let subtotal = 0;
  for (const { cart, product } of cartItems) {
    if (product) subtotal += parseFloat(product.price) * cart.quantity;
  }

  let discount = 0;
  if (promoCode) {
    const [promo] = await db.select().from(promoCodesTable).where(eq(promoCodesTable.code, promoCode.toUpperCase().trim()));
    if (promo && promo.isActive) {
      discount = promo.discountType === "percentage"
        ? subtotal * parseFloat(promo.discountValue) / 100
        : Math.min(parseFloat(promo.discountValue), subtotal);
    }
  }

  const afterDiscount = subtotal - discount;
  const tax = afterDiscount * taxRate;

  // Per-product shipping (delivery) or handling (pickup)
  // Downloadable products have no physical fulfillment — no shipping or handling fee
  let shippingTotal = 0;
  let handlingTotal = 0;
  for (const { cart, product } of cartItems) {
    if (!product || product.isDownloadable) continue;
    if (isPickup) {
      handlingTotal += parseFloat(product.handlingFee ?? "5.00") * cart.quantity;
    } else {
      shippingTotal += parseFloat(product.shippingFee ?? "9.99") * cart.quantity;
    }
  }
  const isFreeShipping = !isPickup && afterDiscount >= freeShippingThreshold;
  if (isFreeShipping) shippingTotal = 0;

  const total = afterDiscount + tax + shippingTotal + handlingTotal;

  const requestedWallet = parseFloat(String(walletAmount ?? 0)) || 0;
  let walletDeduction = 0;
  if (requestedWallet > 0) {
    const [w] = await db.select().from(walletsTable).where(eq(walletsTable.userId, currentUser.id));
    if (w) {
      walletDeduction = Math.min(requestedWallet, parseFloat(w.balance), total);
    }
  }

  const finalDue = Math.max(0, total - walletDeduction);

  res.json({
    subtotal,
    discount,
    afterDiscount,
    tax,
    shipping: shippingTotal,
    handlingFee: handlingTotal,
    total,
    walletDeduction,
    finalDue,
    isFreeShipping,
    isPickup: !!isPickup,
  });
});

// GET /api/orders/:orderId/download/:productId — secure download for paid downloadable items
router.get("/:orderId/download/:productId", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as any).user?.id;
  const orderId = parseInt(Array.isArray(req.params.orderId) ? req.params.orderId[0] : req.params.orderId);
  const productId = parseInt(Array.isArray(req.params.productId) ? req.params.productId[0] : req.params.productId);

  const [order] = await db.select().from(ordersTable).where(eq(ordersTable.id, orderId));
  if (!order) { res.status(404).json({ error: "Order not found" }); return; }
  if (order.userId !== userId) { res.status(403).json({ error: "Forbidden" }); return; }

  const isPaid = ["paid", "demo_paid", "completed"].includes(order.paymentStatus) || order.status === "completed";
  if (!isPaid) { res.status(402).json({ error: "Order not yet paid. Downloads are available after payment is confirmed." }); return; }

  const items = await db.select().from(orderItemsTable)
    .where(eq(orderItemsTable.orderId, orderId));

  const item = items.find(i => i.productId === productId);
  if (!item) { res.status(404).json({ error: "Item not found in this order" }); return; }
  if (!item.isDownloadable || !item.downloadUrl) {
    res.status(400).json({ error: "This item is not a downloadable product" }); return;
  }

  const storageUrl = item.downloadUrl.startsWith("/objects/")
    ? `/api/storage${item.downloadUrl}`
    : item.downloadUrl;

  res.redirect(302, storageUrl);
});

// POST /api/orders/:id/sign — member submits digital signature at time of purchase
router.post("/:id/sign", requireAuth, async (req, res) => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id);
  const userId = (req as any).user?.id;
  const { signature } = req.body as { signature?: string };

  if (!signature || typeof signature !== "string" || !signature.startsWith("data:image/")) {
    res.status(400).json({ error: "Valid signature image required" });
    return;
  }

  const [order] = await db.select().from(ordersTable).where(eq(ordersTable.id, id));
  if (!order) { res.status(404).json({ error: "Order not found" }); return; }
  if (order.userId !== userId) { res.status(403).json({ error: "Forbidden" }); return; }
  if (order.digitalSignature) { res.status(409).json({ error: "Already signed" }); return; }

  const [updated] = await db
    .update(ordersTable)
    .set({ digitalSignature: signature, digitalSignedAt: new Date() })
    .where(eq(ordersTable.id, id))
    .returning();

  res.json({ id: updated.id, digitalSignedAt: updated.digitalSignedAt?.toISOString() });
});

export default router;
