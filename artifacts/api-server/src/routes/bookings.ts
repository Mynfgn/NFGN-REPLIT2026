import { Router, type IRouter } from "express";
import { db, bookingsTable, professionalsTable, usersTable, messagesTable, walletsTable, walletTransactionsTable, bookingPayoutsTable } from "@workspace/db";
import { eq, and, desc, count, or, inArray } from "drizzle-orm";
import { requireAuth, requireAdmin } from "../lib/auth";
import { sendEmail, bookingConfirmationHtml } from "../lib/mailer";
import { createSquarePaymentLink } from "../lib/square";

const router: IRouter = Router();

function formatBooking(b: typeof bookingsTable.$inferSelect, userName: string, professionalName: string) {
  return {
    id: b.id,
    userId: b.userId,
    userName,
    professionalId: b.professionalId,
    professionalName,
    serviceType: b.serviceType,
    scheduledAt: b.scheduledAt.toISOString(),
    duration: b.duration,
    status: b.status,
    paymentMethod: b.paymentMethod,
    paymentStatus: b.paymentStatus,
    amount: parseFloat(b.amount),
    notes: b.notes ?? null,
    paymentLink: b.paymentLink ?? null,
    createdAt: b.createdAt.toISOString(),
  };
}

router.get("/bookings", requireAuth, async (req, res): Promise<void> => {
  const currentUser = (req as typeof req & { user: typeof usersTable.$inferSelect }).user;
  const isAdmin = ["super_admin", "admin", "store_admin"].includes(currentUser.role);
  const page = parseInt(String(req.query.page ?? "1"));
  const limit = parseInt(String(req.query.limit ?? "20"));
  const offset = (page - 1) * limit;

  const rows = await db.select({
    booking: bookingsTable,
    user: usersTable,
    pro: professionalsTable,
  }).from(bookingsTable)
    .leftJoin(usersTable, eq(bookingsTable.userId, usersTable.id))
    .leftJoin(professionalsTable, eq(bookingsTable.professionalId, professionalsTable.id))
    .where(!isAdmin ? eq(bookingsTable.userId, currentUser.id) : undefined)
    .orderBy(desc(bookingsTable.createdAt))
    .limit(limit)
    .offset(offset);

  const [{ value: total }] = await db.select({ value: count() }).from(bookingsTable).where(!isAdmin ? eq(bookingsTable.userId, currentUser.id) : undefined);

  res.json({
    bookings: rows.map(r => formatBooking(r.booking, r.user ? `${r.user.firstName} ${r.user.lastName}` : "Unknown", r.pro?.name ?? "Unknown")),
    total,
    page,
    totalPages: Math.ceil(total / limit),
  });
});

router.post("/bookings", requireAuth, async (req, res): Promise<void> => {
  const currentUser = (req as typeof req & { user: typeof usersTable.$inferSelect }).user;
  const userId = currentUser.id;
  const { professionalId, serviceType, scheduledAt, duration, paymentMethod, walletAmount, amount, notes } = req.body;

  const walletDeduction = parseFloat(String(walletAmount ?? 0));

  // ── Validate and deduct wallet credit if requested ──────────────────────
  if (walletDeduction > 0) {
    const [wallet] = await db.select().from(walletsTable).where(eq(walletsTable.userId, userId));
    if (!wallet) {
      res.status(400).json({ error: "Wallet not found." });
      return;
    }
    const currentBalance = parseFloat(wallet.balance);
    if (currentBalance < walletDeduction) {
      res.status(400).json({ error: `Insufficient wallet balance. Available: $${currentBalance.toFixed(2)}.` });
      return;
    }
    const newBalance = currentBalance - walletDeduction;
    // Deduct from wallet
    await db.update(walletsTable)
      .set({ balance: String(newBalance) })
      .where(eq(walletsTable.id, wallet.id));
    // Record the transaction
    await db.insert(walletTransactionsTable).values({
      walletId: wallet.id,
      type: "debit",
      amount: String(walletDeduction),
      balance: String(newBalance),
      description: `E-Wallet applied to Book-A-Pro booking (${serviceType})`,
    });
  }

  const bookingAmount = parseFloat(String(amount));
  const remainingAfterWallet = Math.max(0, bookingAmount - walletDeduction);
  const needsCardPayment = remainingAfterWallet > 0 && (paymentMethod === "card" || paymentMethod.includes("card"));

  // ── Insert the booking first (no payment link yet) ───────────────────────
  const [booking] = await db.insert(bookingsTable).values({
    userId,
    professionalId,
    serviceType,
    scheduledAt: new Date(scheduledAt),
    duration: duration ?? 60,
    status: "pending",
    paymentMethod,
    paymentStatus: walletDeduction >= parseFloat(String(amount)) ? "paid" : "pending",
    amount: String(amount),
    notes: notes ?? undefined,
  }).returning();

  // ── Generate Square payment link (card payments with remaining balance) ──
  if (needsCardPayment) {
    const squareLink = await createSquarePaymentLink({
      name: `NFGN Booking #${booking.id} — ${serviceType}`,
      amountCents: Math.round(remainingAfterWallet * 100),
      bookingId: booking.id,
    });
    if (squareLink) {
      await db.update(bookingsTable)
        .set({ paymentLink: squareLink })
        .where(eq(bookingsTable.id, booking.id));
      booking.paymentLink = squareLink;
    }
  }

  const [member] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
  const [proRow] = await db.select().from(professionalsTable).where(eq(professionalsTable.id, professionalId));

  // ── Book-A-Pro payout split (80/20) ──────────────────────────────────────
  try {
    const totalAmount = parseFloat(String(amount));
    const payoutAmount = totalAmount * 0.80;         // 80% → professional
    const commissionPool = totalAmount * 0.20;       // 20% → commissionable pool
    const productSalesCommission = commissionPool * 0.60; // 60% of pool
    const referralCommission = commissionPool * 0.25;     // 25% of pool
    const nfgnFees = commissionPool * 0.15;               // 15% of pool

    await db.insert(bookingPayoutsTable).values({
      bookingId: booking.id,
      professionalId,
      professionalUserId: proRow?.userId ?? null,
      professionalName: proRow?.name ?? "Unknown",
      memberName: member ? `${member.firstName} ${member.lastName}` : "Unknown",
      serviceType,
      bookingAmount: String(totalAmount),
      payoutAmount: String(payoutAmount),
      commissionPool: String(commissionPool),
      productSalesCommission: String(productSalesCommission),
      referralCommission: String(referralCommission),
      nfgnFees: String(nfgnFees),
      status: "pending",
    });

    // Credit professional's pending wallet balance (shown as "pending" until admin approves)
    if (proRow?.userId) {
      let [proWallet] = await db.select().from(walletsTable).where(eq(walletsTable.userId, proRow.userId));
      if (!proWallet) {
        [proWallet] = await db.insert(walletsTable).values({ userId: proRow.userId }).returning();
      }
      const newPending = parseFloat(proWallet.pendingBalance) + payoutAmount;
      await db.update(walletsTable)
        .set({ pendingBalance: String(newPending) })
        .where(eq(walletsTable.id, proWallet.id));
      await db.insert(walletTransactionsTable).values({
        walletId: proWallet.id,
        type: "booking_payout_pending",
        amount: String(payoutAmount),
        balance: String(parseFloat(proWallet.balance)),
        description: `Book-A-Pro pending payout — Booking #${booking.id} (${serviceType}) — awaiting admin approval`,
        reference: String(booking.id),
      });
    }
  } catch (err) {
    console.error("[BOOKINGS] Payout split error (non-blocking):", err);
  }

  // ── Post-booking notifications (non-blocking) ─────────────────────────────
  try {
    const dashboardUrl = process.env.APP_URL ? `${process.env.APP_URL}/dashboard` : "https://nfgn.com/dashboard";
    const memberName = member ? `${member.firstName} ${member.lastName}` : "Unknown Member";
    const providerName = proRow?.name ?? "Unknown Professional";
    const scheduledAtFormatted = new Date(scheduledAt).toLocaleString("en-US", { dateStyle: "full", timeStyle: "short" });
    const bookingAmt = parseFloat(String(amount));
    const walletNote = walletDeduction > 0
      ? `\nWallet Credit Applied: $${walletDeduction.toFixed(2)}\nRemaining Due: $${Math.max(0, bookingAmt - walletDeduction).toFixed(2)}`
      : "";

    // ── Find admin users ──
    const admins = await db.select().from(usersTable).where(
      or(eq(usersTable.role, "admin"), eq(usersTable.role, "super_admin"), eq(usersTable.role, "store_admin"))
    );

    // ── Find provider's linked user (if any) ──
    let providerUser: typeof usersTable.$inferSelect | null = null;
    if (proRow?.userId) {
      const [pu] = await db.select().from(usersTable).where(eq(usersTable.id, proRow.userId));
      providerUser = pu ?? null;
    }

    // ── Find member's upline sponsor (if any) ──
    let sponsorUser: typeof usersTable.$inferSelect | null = null;
    if (member?.sponsorId) {
      const [su] = await db.select().from(usersTable).where(eq(usersTable.id, member.sponsorId));
      sponsorUser = su ?? null;
    }

    const msgBody = (role: "member" | "provider" | "admin" | "sponsor") => {
      const base = `A Book-A-Pro booking has been placed.\n\nService: ${serviceType}\nProfessional: ${providerName}\nMember: ${memberName}\nDate & Time: ${scheduledAtFormatted}\nDuration: ${duration ?? 60} minutes\nAmount: $${bookingAmt.toFixed(2)}${walletNote}\nBooking #${booking.id}`;
      const sponsorNote = role === "sponsor"
        ? `\n\nThis booking was made by your downline member ${memberName}.`
        : "\n\nLog in to your back office to view full details.";
      return base + sponsorNote;
    };

    // ── Insert back-office messages ──
    const messageInserts: (typeof messagesTable.$inferInsert)[] = [];

    // To member
    messageInserts.push({
      fromUserId: null,
      toUserId: userId,
      subject: `✅ Booking Confirmed — ${serviceType} with ${providerName}`,
      body: msgBody("member"),
      isBroadcast: false,
    });

    // To provider (if linked user)
    if (providerUser) {
      messageInserts.push({
        fromUserId: null,
        toUserId: providerUser.id,
        subject: `📅 New Booking — ${serviceType} from ${memberName}`,
        body: msgBody("provider"),
        isBroadcast: false,
      });
    }

    // To upline sponsor
    if (sponsorUser) {
      messageInserts.push({
        fromUserId: null,
        toUserId: sponsorUser.id,
        subject: `🌟 Downline Activity — ${memberName} booked a session`,
        body: msgBody("sponsor"),
        isBroadcast: false,
      });
    }

    // To each admin
    for (const admin of admins) {
      messageInserts.push({
        fromUserId: null,
        toUserId: admin.id,
        subject: `📋 New Booking Alert — ${memberName} booked ${serviceType}`,
        body: msgBody("admin"),
        isBroadcast: false,
      });
    }

    if (messageInserts.length > 0) {
      await db.insert(messagesTable).values(messageInserts);
    }

    // ── Send emails ──
    const emailJobs: Promise<void>[] = [];

    if (member?.email) {
      emailJobs.push(sendEmail({
        to: member.email,
        subject: `Booking Confirmed — ${serviceType} with ${providerName}`,
        html: bookingConfirmationHtml({ recipientName: memberName, memberName, providerName, serviceType, scheduledAt: scheduledAtFormatted, duration: duration ?? 60, amount: bookingAmt, bookingId: booking.id, dashboardUrl, role: "member" }),
      }));
    }

    if (providerUser?.email) {
      emailJobs.push(sendEmail({
        to: providerUser.email,
        subject: `New Booking — ${serviceType} from ${memberName}`,
        html: bookingConfirmationHtml({ recipientName: providerName, memberName, providerName, serviceType, scheduledAt: scheduledAtFormatted, duration: duration ?? 60, amount: bookingAmt, bookingId: booking.id, dashboardUrl, role: "provider" }),
      }));
    }

    if (sponsorUser?.email) {
      emailJobs.push(sendEmail({
        to: sponsorUser.email,
        subject: `[NFGN] Your Downline Member ${memberName} Booked a Session`,
        html: bookingConfirmationHtml({ recipientName: `${sponsorUser.firstName} ${sponsorUser.lastName}`, memberName, providerName, serviceType, scheduledAt: scheduledAtFormatted, duration: duration ?? 60, amount: bookingAmt, bookingId: booking.id, dashboardUrl, role: "sponsor" }),
      }));
    }

    for (const admin of admins) {
      if (admin.email) {
        emailJobs.push(sendEmail({
          to: admin.email,
          subject: `[NFGN Admin] New Booking — ${memberName} booked ${serviceType}`,
          html: bookingConfirmationHtml({ recipientName: `${admin.firstName} ${admin.lastName}`, memberName, providerName, serviceType, scheduledAt: scheduledAtFormatted, duration: duration ?? 60, amount: bookingAmt, bookingId: booking.id, dashboardUrl, role: "admin" }),
        }));
      }
    }

    await Promise.allSettled(emailJobs);
  } catch (err) {
    console.error("[BOOKINGS] Notification error (non-blocking):", err);
  }

  res.status(201).json(formatBooking(booking, member ? `${member.firstName} ${member.lastName}` : "Unknown", proRow?.name ?? "Unknown"));
});

router.get("/bookings/:id", requireAuth, async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id);
  const [row] = await db.select({
    booking: bookingsTable,
    user: usersTable,
    pro: professionalsTable,
  }).from(bookingsTable)
    .leftJoin(usersTable, eq(bookingsTable.userId, usersTable.id))
    .leftJoin(professionalsTable, eq(bookingsTable.professionalId, professionalsTable.id))
    .where(eq(bookingsTable.id, id));

  if (!row) { res.status(404).json({ error: "Not found" }); return; }
  res.json(formatBooking(row.booking, row.user ? `${row.user.firstName} ${row.user.lastName}` : "Unknown", row.pro?.name ?? "Unknown"));
});

router.patch("/bookings/:id", requireAuth, async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id);
  const { status, notes } = req.body;
  const updates: Partial<typeof bookingsTable.$inferInsert> = { status };
  if (notes !== undefined) updates.notes = notes;

  const [updated] = await db.update(bookingsTable).set(updates).where(eq(bookingsTable.id, id)).returning();
  if (!updated) { res.status(404).json({ error: "Not found" }); return; }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, updated.userId));
  const [pro] = await db.select().from(professionalsTable).where(eq(professionalsTable.id, updated.professionalId));
  res.json(formatBooking(updated, user ? `${user.firstName} ${user.lastName}` : "Unknown", pro?.name ?? "Unknown"));
});

router.get("/professionals", async (req, res): Promise<void> => {
  const professionals = await db.select().from(professionalsTable).orderBy(professionalsTable.name);
  res.json(professionals.map(p => ({
    id: p.id,
    userId: p.userId ?? null,
    name: p.name,
    bio: p.bio,
    specialty: p.specialty,
    avatar: p.avatar ?? null,
    rating: parseFloat(p.rating),
    reviewCount: p.reviewCount,
    isAvailable: p.isAvailable,
    hourlyRate: parseFloat(p.hourlyRate),
    services: p.services ?? [],
    createdAt: p.createdAt.toISOString(),
  })));
});

router.post("/professionals", requireAdmin, async (req, res): Promise<void> => {
  const { userId, name, bio, specialty, avatar, hourlyRate, services, isAvailable } = req.body;
  const [pro] = await db.insert(professionalsTable).values({
    userId: userId ?? undefined,
    name, bio, specialty,
    avatar: avatar ?? undefined,
    hourlyRate: String(hourlyRate),
    services: services ?? [],
    isAvailable: isAvailable ?? true,
  }).returning();

  res.status(201).json({
    id: pro.id,
    userId: pro.userId ?? null,
    name: pro.name,
    bio: pro.bio,
    specialty: pro.specialty,
    avatar: pro.avatar ?? null,
    rating: parseFloat(pro.rating),
    reviewCount: pro.reviewCount,
    isAvailable: pro.isAvailable,
    hourlyRate: parseFloat(pro.hourlyRate),
    services: pro.services ?? [],
    createdAt: pro.createdAt.toISOString(),
  });
});

router.get("/professionals/:id", async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id);
  const [pro] = await db.select().from(professionalsTable).where(eq(professionalsTable.id, id));
  if (!pro) { res.status(404).json({ error: "Not found" }); return; }

  res.json({
    id: pro.id,
    userId: pro.userId ?? null,
    name: pro.name,
    bio: pro.bio,
    specialty: pro.specialty,
    avatar: pro.avatar ?? null,
    rating: parseFloat(pro.rating),
    reviewCount: pro.reviewCount,
    isAvailable: pro.isAvailable,
    hourlyRate: parseFloat(pro.hourlyRate),
    services: pro.services ?? [],
    createdAt: pro.createdAt.toISOString(),
  });
});

router.patch("/professionals/:id", requireAdmin, async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id);
  const { name, bio, specialty, avatar, hourlyRate, services, isAvailable } = req.body;
  const updates: Partial<typeof professionalsTable.$inferInsert> = {};
  if (name) updates.name = name;
  if (bio) updates.bio = bio;
  if (specialty) updates.specialty = specialty;
  if (avatar !== undefined) updates.avatar = avatar;
  if (hourlyRate) updates.hourlyRate = String(hourlyRate);
  if (services) updates.services = services;
  if (isAvailable !== undefined) updates.isAvailable = isAvailable;

  const [pro] = await db.update(professionalsTable).set(updates).where(eq(professionalsTable.id, id)).returning();
  if (!pro) { res.status(404).json({ error: "Not found" }); return; }

  res.json({
    id: pro.id,
    userId: pro.userId ?? null,
    name: pro.name,
    bio: pro.bio,
    specialty: pro.specialty,
    avatar: pro.avatar ?? null,
    rating: parseFloat(pro.rating),
    reviewCount: pro.reviewCount,
    isAvailable: pro.isAvailable,
    hourlyRate: parseFloat(pro.hourlyRate),
    services: pro.services ?? [],
    createdAt: pro.createdAt.toISOString(),
  });
});

export default router;
