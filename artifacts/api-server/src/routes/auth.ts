import { Router, type IRouter } from "express";
import { db, usersTable, walletsTable, genealogyNodesTable, notificationsTable, professionalsTable, ordersTable, orderItemsTable, productsTable, appSettingsTable } from "@workspace/db";
import { eq, count } from "drizzle-orm";
import { hashPassword, verifyPassword, generateToken, generateReferralCode, requireAuth } from "../lib/auth";
import { LoginBody, RegisterBody } from "@workspace/api-zod";
import { processCommissions, type OrderItemForCommission } from "../lib/commissions";

const router: IRouter = Router();

function formatUser(user: typeof usersTable.$inferSelect, sponsorName?: string) {
  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role,
    status: user.status,
    referralCode: user.referralCode,
    sponsorId: user.sponsorId,
    sponsorName: sponsorName ?? null,
    avatar: user.avatar,
    phone: user.phone,
    isProMember: user.isProMember,
    proMemberSince: user.proMemberSince?.toISOString() ?? null,
    proMemberStatus: user.proMemberStatus ?? null,
    createdAt: user.createdAt.toISOString(),
    gender: user.gender ?? null,
    dateOfBirth: user.dateOfBirth ?? null,
    registrationPackage: user.registrationPackage ?? "free",
    bankName: user.bankName ?? null,
    bankAccountNumber: user.bankAccountNumber ?? null,
    bankRoutingNumber: user.bankRoutingNumber ?? null,
    organizationName: user.organizationName ?? null,
    bankAccountType: user.bankAccountType ?? null,
    payoutMethod: user.payoutMethod ?? "bank",
    payoutPaypalEmail: user.payoutPaypalEmail ?? null,
    payoutCashAppHandle: user.payoutCashAppHandle ?? null,
    city: user.city ?? null,
    state: user.state ?? null,
    country: user.country ?? "United States",
    isBookAProProvider: user.isBookAProProvider ?? false,
    bookAProCategory: user.bookAProCategory ?? null,
    bookAProSubServices: (user.bookAProSubServices as string[] | null) ?? [],
    bookAProBio: user.bookAProBio ?? null,
    canAcceptCod: user.canAcceptCod ?? false,
  };
}

/** Walk up the sponsor chain up to maxLevels and collect upline user IDs */
async function getUplineIds(startSponsorId: number, maxLevels: number = 9): Promise<number[]> {
  const ids: number[] = [];
  let currentId: number | null = startSponsorId;
  for (let i = 0; i < maxLevels; i++) {
    if (!currentId) break;
    const [user] = await db.select({ id: usersTable.id, sponsorId: usersTable.sponsorId })
      .from(usersTable).where(eq(usersTable.id, currentId));
    if (!user) break;
    ids.push(user.id);
    currentId = user.sponsorId ?? null;
  }
  return ids;
}

router.post("/auth/login", async (req, res): Promise<void> => {
  const parsed = LoginBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.email, parsed.data.email.toLowerCase()));
  if (!user) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }

  const valid = await verifyPassword(parsed.data.password, user.passwordHash);
  if (!valid) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }

  if (user.status === "inactive") {
    res.status(401).json({ error: "Account is inactive" });
    return;
  }

  const token = generateToken(user.id, user.role);
  res.json({ token, user: formatUser(user) });
});

router.post("/auth/register", async (req, res): Promise<void> => {
  const parsed = RegisterBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { email, password, firstName, lastName, phone, referralCode, role } = parsed.data;
  // Accept optional fields (not in RegisterBody schema, so pull from req.body directly)
  const city: string | undefined = req.body.city ?? undefined;
  const state: string | undefined = req.body.state ?? undefined;
  const country: string | undefined = req.body.country ?? "United States";
  const organizationName: string | undefined = req.body.organizationName ?? undefined;
  const isBookAProProvider: boolean = req.body.isBookAProProvider === true || req.body.isBookAProProvider === "true";
  const bookAProCategory: string | undefined = req.body.bookAProCategory ?? undefined;
  const bookAProSubServices: string[] = Array.isArray(req.body.bookAProSubServices) ? req.body.bookAProSubServices : [];
  const bookAProBio: string | undefined = req.body.bookAProBio ?? undefined;

  const [existing] = await db.select().from(usersTable).where(eq(usersTable.email, email.toLowerCase()));
  if (existing) {
    res.status(400).json({ error: "Email already in use" });
    return;
  }

  let sponsorId: number | undefined;
  if (referralCode) {
    const [sponsor] = await db.select().from(usersTable).where(eq(usersTable.referralCode, referralCode));
    if (sponsor) sponsorId = sponsor.id;
  }

  const passwordHash = await hashPassword(password);
  const userReferralCode = generateReferralCode(firstName, lastName);
  const assignedRole = role && ["customer", "affiliate"].includes(role) ? role : "customer";

  const [newUser] = await db.insert(usersTable).values({
    email: email.toLowerCase(),
    passwordHash,
    firstName,
    lastName,
    phone: phone ?? undefined,
    role: assignedRole,
    referralCode: userReferralCode,
    sponsorId: sponsorId ?? undefined,
    isProMember: false,
    status: "active",
    city: city ?? null,
    state: state ?? null,
    country: country ?? "United States",
    organizationName: organizationName ?? null,
    isBookAProProvider: isBookAProProvider,
    bookAProCategory: isBookAProProvider && bookAProCategory ? bookAProCategory : null,
    bookAProSubServices: isBookAProProvider && bookAProSubServices.length > 0 ? bookAProSubServices : [],
    bookAProBio: isBookAProProvider && bookAProBio ? bookAProBio : null,
  }).returning();

  await db.insert(walletsTable).values({ userId: newUser.id });

  // 📋 Auto-create professional record if registering as Book-A-Pro provider
  if (isBookAProProvider && bookAProCategory) {
    try {
      await db.insert(professionalsTable).values({
        userId: newUser.id,
        name: `${firstName} ${lastName}`,
        bio: bookAProBio ?? `${bookAProCategory} professional on NFGN Book-A-Pro.`,
        specialty: bookAProCategory,
        hourlyRate: "0",
        services: bookAProSubServices,
        isAvailable: true,
      });
    } catch { /* Non-blocking */ }
  }

  // Add to genealogy
  if (sponsorId) {
    const [parentNode] = await db.select().from(genealogyNodesTable).where(eq(genealogyNodesTable.userId, sponsorId));
    if (parentNode) {
      await db.insert(genealogyNodesTable).values({
        userId: newUser.id,
        parentId: parentNode.id,
        generation: parentNode.generation + 1,
        path: `${parentNode.path}/${parentNode.id}`,
      });
    }
  } else {
    await db.insert(genealogyNodesTable).values({
      userId: newUser.id,
      parentId: undefined,
      generation: 1,
      path: "",
    });
  }

  // 🎉 Trigger congratulations notifications up the upline chain (up to 9 levels)
  if (sponsorId) {
    try {
      const uplineIds = await getUplineIds(sponsorId, 9);
      const joinName = `${firstName} ${lastName}`;
      if (uplineIds.length > 0) {
        await db.insert(notificationsTable).values(
          uplineIds.map(uid => ({
            userId: uid,
            type: "join",
            message: `🎉 Congratulations!! ${joinName} joined your NFGN community!`,
            relatedUserId: newUser.id,
            isRead: false,
          }))
        );
      }
    } catch {
      // Non-blocking — don't fail registration if notifications error
    }
  }

  const token = generateToken(newUser.id, newUser.role);
  res.status(201).json({ token, user: formatUser(newUser) });
});

router.post("/auth/register-pro", async (req, res): Promise<void> => {
  const { email, password, firstName, lastName, phone, referralCode, selectedProductId, paymentMethod, shippingAddress } = req.body;

  if (!email || !password || !firstName || !lastName || !referralCode || !selectedProductId || !paymentMethod || !shippingAddress) {
    res.status(400).json({ error: "All fields are required including sponsor referral code, selected package, payment method, and shipping address." });
    return;
  }
  if (password.length < 8) {
    res.status(400).json({ error: "Password must be at least 8 characters." });
    return;
  }

  const organizationName: string | undefined = req.body.organizationName ?? undefined;
  const isBookAProProvider: boolean = req.body.isBookAProProvider === true || req.body.isBookAProProvider === "true";
  const bookAProCategory: string | undefined = req.body.bookAProCategory ?? undefined;
  const bookAProSubServices: string[] = Array.isArray(req.body.bookAProSubServices) ? req.body.bookAProSubServices : [];
  const bookAProBio: string | undefined = req.body.bookAProBio ?? undefined;

  const [existing] = await db.select().from(usersTable).where(eq(usersTable.email, email.toLowerCase()));
  if (existing) {
    res.status(400).json({ error: "An account with this email already exists." });
    return;
  }

  let sponsorId: number | undefined;
  if (referralCode) {
    const [sponsor] = await db.select().from(usersTable).where(eq(usersTable.referralCode, referralCode));
    if (!sponsor) {
      res.status(400).json({ error: "Sponsor referral code not found. Please check with your sponsor." });
      return;
    }
    sponsorId = sponsor.id;
  }

  const [product] = await db.select().from(productsTable).where(eq(productsTable.id, parseInt(selectedProductId)));
  if (!product || !product.isProPackage) {
    res.status(400).json({ error: "Selected product is not a valid Pro Registration Package." });
    return;
  }

  const passwordHash = await hashPassword(password);
  const userReferralCode = generateReferralCode(firstName, lastName);

  const [newUser] = await db.insert(usersTable).values({
    email: email.toLowerCase(),
    passwordHash,
    firstName,
    lastName,
    phone: phone ?? undefined,
    role: "customer",
    referralCode: userReferralCode,
    sponsorId: sponsorId ?? undefined,
    isProMember: false,
    status: "active",
    country: "United States",
    organizationName: organizationName ?? null,
    isBookAProProvider,
    bookAProCategory: isBookAProProvider && bookAProCategory ? bookAProCategory : null,
    bookAProSubServices: isBookAProProvider && bookAProSubServices.length > 0 ? bookAProSubServices : [],
    bookAProBio: isBookAProProvider && bookAProBio ? bookAProBio : null,
  }).returning();

  await db.insert(walletsTable).values({ userId: newUser.id });

  if (isBookAProProvider && bookAProCategory) {
    try {
      await db.insert(professionalsTable).values({
        userId: newUser.id,
        name: `${firstName} ${lastName}`,
        bio: bookAProBio ?? `${bookAProCategory} professional on NFGN Book-A-Pro.`,
        specialty: bookAProCategory,
        hourlyRate: "0",
        services: bookAProSubServices,
        isAvailable: true,
      });
    } catch { /* Non-blocking */ }
  }

  if (sponsorId) {
    const [parentNode] = await db.select().from(genealogyNodesTable).where(eq(genealogyNodesTable.userId, sponsorId));
    if (parentNode) {
      await db.insert(genealogyNodesTable).values({
        userId: newUser.id,
        parentId: parentNode.id,
        generation: parentNode.generation + 1,
        path: `${parentNode.path}/${parentNode.id}`,
      });
    }
  } else {
    await db.insert(genealogyNodesTable).values({ userId: newUser.id, parentId: undefined, generation: 1, path: "" });
  }

  if (sponsorId) {
    try {
      const uplineIds = await getUplineIds(sponsorId, 9);
      const joinName = `${firstName} ${lastName}`;
      if (uplineIds.length > 0) {
        await db.insert(notificationsTable).values(
          uplineIds.map(uid => ({
            userId: uid, type: "join",
            message: `🎉 ${joinName} joined your NFGN community as a new Pro Member!`,
            relatedUserId: newUser.id, isRead: false,
          }))
        );
      }
    } catch { /* Non-blocking */ }
  }

  // Create the pro package order directly
  const [settings] = await db.select().from(appSettingsTable).limit(1);
  const taxRate = parseFloat(settings?.taxRate ?? "8.5") / 100;
  const shippingRate = parseFloat(settings?.shippingRate ?? "9.99");
  const freeShippingThreshold = parseFloat(settings?.freeShippingThreshold ?? "75");
  const productPrice = parseFloat(product.price);
  const tax = productPrice * taxRate;
  const shipping = productPrice >= freeShippingThreshold ? 0 : shippingRate;
  const total = productPrice + tax + shipping;
  const orderNumber = `NFGN-PRO-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

  const [order] = await db.insert(ordersTable).values({
    orderNumber,
    userId: newUser.id,
    status: "pending",
    paymentMethod,
    paymentStatus: paymentMethod === "cod" ? "pending" : "demo_paid",
    subtotal: String(productPrice),
    tax: String(tax),
    shipping: String(shipping),
    discount: "0",
    total: String(total),
    shippingAddress,
    notes: "Pro Member Registration Order",
  }).returning();

  await db.insert(orderItemsTable).values({
    orderId: order.id,
    productId: product.id,
    productName: product.name,
    productImage: product.image ?? undefined,
    price: product.price,
    quantity: 1,
    total: String(productPrice),
    cvTotal: product.cv ?? 0,
  });

  // Mark user as pending Pro Member — full activation happens when admin approves the order
  await db.update(usersTable).set({
    isProMember: false,
    role: "pro_member",
    proMemberStatus: "pending_approval",
  }).where(eq(usersTable.id, newUser.id));

  // Commissions are deferred until admin approves the order
  // await processCommissions(...);

  const [updatedUser] = await db.select().from(usersTable).where(eq(usersTable.id, newUser.id));
  const token = generateToken(updatedUser.id, updatedUser.role);
  res.status(201).json({ token, user: formatUser(updatedUser), orderNumber });
});

router.post("/auth/change-password", requireAuth, async (req, res): Promise<void> => {
  const user = (req as typeof req & { user: typeof usersTable.$inferSelect }).user;
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    res.status(400).json({ error: "currentPassword and newPassword are required." });
    return;
  }
  if (newPassword.length < 8) {
    res.status(400).json({ error: "New password must be at least 8 characters." });
    return;
  }

  const valid = await verifyPassword(currentPassword, user.passwordHash);
  if (!valid) {
    res.status(401).json({ error: "Current password is incorrect." });
    return;
  }

  const newHash = await hashPassword(newPassword);
  await db.update(usersTable).set({ passwordHash: newHash }).where(eq(usersTable.id, user.id));
  res.json({ success: true });
});

router.post("/auth/logout", async (_req, res): Promise<void> => {
  res.json({ success: true });
});

router.get("/auth/sponsor-lookup", async (req, res): Promise<void> => {
  const { ref } = req.query as { ref?: string };
  if (!ref) { res.status(400).json({ error: "ref is required" }); return; }
  const [sponsor] = await db.select().from(usersTable).where(eq(usersTable.referralCode, ref));
  if (!sponsor) { res.status(404).json({ error: "Sponsor not found" }); return; }
  const [{ value: directCount }] = await db.select({ value: count() }).from(usersTable).where(eq(usersTable.sponsorId, sponsor.id));
  let label: string;
  if (sponsor.isProMember) {
    label = "Pro Member";
  } else if (directCount > 0) {
    label = "Community Builder";
  } else {
    label = "NFGN Community Member";
  }
  res.json({ name: `${sponsor.firstName} ${sponsor.lastName}`, label });
});

router.get("/auth/me", requireAuth, async (req, res): Promise<void> => {
  const user = (req as typeof req & { user: typeof usersTable.$inferSelect }).user;
  let sponsorName: string | undefined;
  if (user.sponsorId) {
    const [sponsor] = await db.select().from(usersTable).where(eq(usersTable.id, user.sponsorId));
    if (sponsor) sponsorName = `${sponsor.firstName} ${sponsor.lastName}`;
  }
  res.json(formatUser(user, sponsorName));
});

export default router;
