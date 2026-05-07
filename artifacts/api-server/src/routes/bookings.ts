import { Router, type IRouter } from "express";
import { db, bookingsTable, professionalsTable, usersTable, messagesTable, walletsTable, walletTransactionsTable, bookingPayoutsTable, professionalAvailabilityTable } from "@workspace/db";
import { eq, and, desc, count, or, inArray, gte, lte, not } from "drizzle-orm";
import { requireAuth, requireAdmin } from "../lib/auth";
import { sendEmail, bookingConfirmationHtml, booking8hrReminderHtml } from "../lib/mailer";
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
    referralUserId: b.referralUserId ?? null,
    serviceRenderedAt: b.serviceRenderedAt?.toISOString() ?? null,
    digitalSignature: b.digitalSignature ?? null,
    digitalSignedAt: b.digitalSignedAt?.toISOString() ?? null,
    paymentReleasedAt: b.paymentReleasedAt?.toISOString() ?? null,
    cancellationNote: b.cancellationNote ?? null,
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

  // ── Conflict check: block if time slot overlaps an existing booking ───────
  const reqStart = new Date(scheduledAt).getTime();
  const reqDuration = parseInt(String(duration ?? 60));
  const reqEnd = reqStart + reqDuration * 60 * 1000;

  const existingBookings = await db.select({
    scheduledAt: bookingsTable.scheduledAt,
    duration: bookingsTable.duration,
  }).from(bookingsTable).where(
    and(
      eq(bookingsTable.professionalId, professionalId),
      not(eq(bookingsTable.status, "cancelled")),
    )
  );

  const hasConflict = existingBookings.some(b => {
    const bStart = new Date(b.scheduledAt).getTime();
    const bEnd = bStart + b.duration * 60 * 1000;
    return reqStart < bEnd && reqEnd > bStart;
  });

  if (hasConflict) {
    res.status(409).json({ error: "This time slot is already booked. Please choose a different date or time." });
    return;
  }

  // ── Insert the booking first (no payment link yet) ───────────────────────
  // ── Find member's sponsor (referral user) ──────────────────────────────
  const [memberForReferral] = await db.select({ sponsorId: usersTable.sponsorId }).from(usersTable).where(eq(usersTable.id, userId));
  const referralUserId = memberForReferral?.sponsorId ?? null;

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
    referralUserId: referralUserId ?? undefined,
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

  // ── Book-A-Pro payout split (per-professional configurable) ──────────────
  try {
    const totalAmount = parseFloat(String(amount));
    const proPercent = (proRow?.proPayoutPercent ?? 80) / 100;
    const memberPercent = 1 - proPercent;
    const payoutAmount = totalAmount * proPercent;         // pro's configured % → professional
    const commissionPool = totalAmount * memberPercent;    // remainder → commissionable pool
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
    const memberEmail = member?.email ?? "";
    const memberPhone = member?.phone ?? undefined;
    const providerEmail = providerUser?.email ?? "";
    const providerPhone = providerUser?.phone ?? undefined;

    const sharedEmailOpts = {
      memberName, memberEmail, memberPhone,
      providerName, providerEmail, providerPhone,
      serviceType, scheduledAt: scheduledAtFormatted,
      duration: duration ?? 60, amount: bookingAmt,
      bookingId: booking.id, dashboardUrl,
    };

    const emailJobs: Promise<void>[] = [];

    if (memberEmail) {
      emailJobs.push(sendEmail({
        to: memberEmail,
        subject: `Congratulations! Booking Confirmed — ${serviceType} with ${providerName}`,
        html: bookingConfirmationHtml({ ...sharedEmailOpts, recipientName: memberName, role: "member" }),
      }));
    }

    if (providerEmail) {
      emailJobs.push(sendEmail({
        to: providerEmail,
        subject: `New Appointment Booked — ${serviceType} from ${memberName}`,
        html: bookingConfirmationHtml({ ...sharedEmailOpts, recipientName: providerName, role: "provider" }),
      }));
    }

    if (sponsorUser?.email) {
      emailJobs.push(sendEmail({
        to: sponsorUser.email,
        subject: `Congratulations! Your Downline ${memberName} Just Booked a Session`,
        html: bookingConfirmationHtml({ ...sharedEmailOpts, recipientName: `${sponsorUser.firstName} ${sponsorUser.lastName}`, role: "sponsor" }),
      }));
    }

    for (const admin of admins) {
      if (admin.email) {
        emailJobs.push(sendEmail({
          to: admin.email,
          subject: `[NFGN Admin] New Booking — ${memberName} booked ${serviceType}`,
          html: bookingConfirmationHtml({ ...sharedEmailOpts, recipientName: `${admin.firstName} ${admin.lastName}`, role: "admin" }),
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

function serializePro(p: typeof professionalsTable.$inferSelect) {
  return {
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
    cv: p.cv ?? 0,
    proPayoutPercent: p.proPayoutPercent ?? 80,
    services: p.services ?? [],
    createdAt: p.createdAt.toISOString(),
  };
}

router.get("/professionals", async (req, res): Promise<void> => {
  const professionals = await db.select().from(professionalsTable).orderBy(professionalsTable.name);
  res.json(professionals.map(serializePro));
});

router.post("/professionals", requireAdmin, async (req, res): Promise<void> => {
  const { userId, name, bio, specialty, avatar, hourlyRate, cv, proPayoutPercent, services, isAvailable } = req.body;
  const [pro] = await db.insert(professionalsTable).values({
    userId: userId ?? undefined,
    name, bio, specialty,
    avatar: avatar ?? undefined,
    hourlyRate: String(hourlyRate),
    cv: cv != null ? parseInt(String(cv)) : 0,
    proPayoutPercent: proPayoutPercent != null ? Math.min(95, Math.max(50, parseInt(String(proPayoutPercent)))) : 80,
    services: services ?? [],
    isAvailable: isAvailable ?? true,
  }).returning();

  res.status(201).json(serializePro(pro));
});

router.patch("/professionals/:id", requireAdmin, async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const { name, bio, specialty, avatar, hourlyRate, cv, proPayoutPercent, services, isAvailable } = req.body;
  const updates: Partial<typeof professionalsTable.$inferInsert> = {};
  if (name !== undefined) updates.name = name;
  if (bio !== undefined) updates.bio = bio;
  if (specialty !== undefined) updates.specialty = specialty;
  if (avatar !== undefined) updates.avatar = avatar || undefined;
  if (hourlyRate !== undefined) updates.hourlyRate = String(hourlyRate);
  if (cv !== undefined) updates.cv = parseInt(String(cv)) || 0;
  if (proPayoutPercent !== undefined) updates.proPayoutPercent = Math.min(95, Math.max(50, parseInt(String(proPayoutPercent)) || 80));
  if (services !== undefined) updates.services = services;
  if (isAvailable !== undefined) updates.isAvailable = isAvailable;

  const [pro] = await db.update(professionalsTable).set(updates).where(eq(professionalsTable.id, id)).returning();
  if (!pro) { res.status(404).json({ error: "Not found" }); return; }
  res.json(serializePro(pro));
});

router.get("/professionals/:id", async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id);
  const [pro] = await db.select().from(professionalsTable).where(eq(professionalsTable.id, id));
  if (!pro) { res.status(404).json({ error: "Not found" }); return; }
  res.json(serializePro(pro));
});

// ── Professional availability management ──────────────────────────────────

router.get("/professionals/my-availability", requireAuth, async (req, res): Promise<void> => {
  const currentUser = (req as typeof req & { user: typeof usersTable.$inferSelect }).user;
  if (!currentUser.isBookAProProvider) { res.status(403).json({ error: "Not a provider" }); return; }

  const [proRow] = await db.select().from(professionalsTable).where(eq(professionalsTable.userId, currentUser.id));
  if (!proRow) { res.status(404).json({ error: "Professional profile not found" }); return; }

  const slots = await db.select().from(professionalAvailabilityTable)
    .where(eq(professionalAvailabilityTable.professionalId, proRow.id))
    .orderBy(professionalAvailabilityTable.availableDate, professionalAvailabilityTable.startTime);

  const bookings = await db.select().from(bookingsTable)
    .where(eq(bookingsTable.professionalId, proRow.id));

  res.json({ slots, bookings: bookings.map(b => ({ id: b.id, scheduledAt: b.scheduledAt, duration: b.duration, status: b.status })) });
});

router.post("/professionals/my-availability", requireAuth, async (req, res): Promise<void> => {
  const currentUser = (req as typeof req & { user: typeof usersTable.$inferSelect }).user;
  if (!currentUser.isBookAProProvider) { res.status(403).json({ error: "Not a provider" }); return; }

  const [proRow] = await db.select().from(professionalsTable).where(eq(professionalsTable.userId, currentUser.id));
  if (!proRow) { res.status(404).json({ error: "Professional profile not found" }); return; }

  const { availableDate, startTime, endTime } = req.body;
  if (!availableDate || !startTime || !endTime) { res.status(400).json({ error: "availableDate, startTime, endTime required" }); return; }

  const [slot] = await db.insert(professionalAvailabilityTable).values({
    professionalId: proRow.id,
    availableDate,
    startTime,
    endTime,
  }).returning();

  res.status(201).json(slot);
});

router.delete("/professionals/my-availability/:id", requireAuth, async (req, res): Promise<void> => {
  const currentUser = (req as typeof req & { user: typeof usersTable.$inferSelect }).user;
  if (!currentUser.isBookAProProvider) { res.status(403).json({ error: "Not a provider" }); return; }

  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id);
  const [proRow] = await db.select().from(professionalsTable).where(eq(professionalsTable.userId, currentUser.id));
  if (!proRow) { res.status(404).json({ error: "Professional profile not found" }); return; }

  const [deleted] = await db.delete(professionalAvailabilityTable)
    .where(and(eq(professionalAvailabilityTable.id, id), eq(professionalAvailabilityTable.professionalId, proRow.id)))
    .returning();

  if (!deleted) { res.status(404).json({ error: "Slot not found" }); return; }
  res.json({ success: true });
});

router.get("/professionals/:id/availability", async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id);
  const slots = await db.select().from(professionalAvailabilityTable)
    .where(eq(professionalAvailabilityTable.professionalId, id))
    .orderBy(professionalAvailabilityTable.availableDate, professionalAvailabilityTable.startTime);

  const bookings = await db.select({
    id: bookingsTable.id,
    scheduledAt: bookingsTable.scheduledAt,
    duration: bookingsTable.duration,
    status: bookingsTable.status,
  }).from(bookingsTable)
    .where(and(eq(bookingsTable.professionalId, id)));

  res.json({ slots, bookings });
});

// ── Mark service as rendered ──────────────────────────────────────────────

router.patch("/bookings/:id/service-rendered", requireAuth, async (req, res): Promise<void> => {
  const currentUser = (req as typeof req & { user: typeof usersTable.$inferSelect }).user;
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id);

  const [booking] = await db.select().from(bookingsTable).where(eq(bookingsTable.id, id));
  if (!booking) { res.status(404).json({ error: "Not found" }); return; }

  const isAdmin = ["super_admin", "admin", "store_admin"].includes(currentUser.role);
  const [proRow] = await db.select().from(professionalsTable).where(eq(professionalsTable.id, booking.professionalId));
  const isProvider = proRow?.userId === currentUser.id;

  if (!isAdmin && !isProvider) { res.status(403).json({ error: "Forbidden" }); return; }

  const [updated] = await db.update(bookingsTable)
    .set({ serviceRenderedAt: new Date(), status: "completed" })
    .where(eq(bookingsTable.id, id))
    .returning();

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, updated.userId));
  const [pro] = await db.select().from(professionalsTable).where(eq(professionalsTable.id, updated.professionalId));

  if (user?.email) {
    const dashUrl = process.env.APP_URL ? `${process.env.APP_URL}/dashboard/bookings` : "https://nfgn.com/dashboard/bookings";
    await sendEmail({
      to: user.email,
      subject: `Service Complete — Please Sign Your Receipt for Booking #${id}`,
      html: `<!DOCTYPE html><html><body style="font-family:sans-serif;padding:32px;background:#f9f9f9;">
        <div style="max-width:560px;margin:auto;background:#fff;border-radius:10px;padding:32px;box-shadow:0 2px 12px rgba(0,0,0,.08);">
          <h2 style="color:#C9A84C;">Service Completed!</h2>
          <p>Hi ${user.firstName}, your service "<strong>${updated.serviceType}</strong>" has been marked as completed by your professional <strong>${pro?.name ?? "your provider"}</strong>.</p>
          <p>Please log in to your back office to <strong>digitally sign your receipt</strong>, confirming you received and are satisfied with the service.</p>
          <a href="${dashUrl}" style="display:inline-block;margin-top:16px;background:#C9A84C;color:#000;text-decoration:none;padding:12px 28px;border-radius:6px;font-weight:700;">Sign My Receipt</a>
        </div>
      </body></html>`,
    });
  }

  res.json(formatBooking(updated, user ? `${user.firstName} ${user.lastName}` : "Unknown", pro?.name ?? "Unknown"));
});

// ── Digital signature ─────────────────────────────────────────────────────

router.post("/bookings/:id/sign", requireAuth, async (req, res): Promise<void> => {
  const currentUser = (req as typeof req & { user: typeof usersTable.$inferSelect }).user;
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id);

  const [booking] = await db.select().from(bookingsTable).where(eq(bookingsTable.id, id));
  if (!booking) { res.status(404).json({ error: "Not found" }); return; }
  if (booking.userId !== currentUser.id) { res.status(403).json({ error: "Forbidden" }); return; }
  if (booking.digitalSignature) { res.status(400).json({ error: "Already signed" }); return; }

  const { signature } = req.body;
  if (!signature || typeof signature !== "string") { res.status(400).json({ error: "signature required" }); return; }

  const [updated] = await db.update(bookingsTable)
    .set({ digitalSignature: signature, digitalSignedAt: new Date() })
    .where(eq(bookingsTable.id, id))
    .returning();

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, updated.userId));
  const [pro] = await db.select().from(professionalsTable).where(eq(professionalsTable.id, updated.professionalId));

  const admins = await db.select().from(usersTable).where(or(eq(usersTable.role, "admin"), eq(usersTable.role, "super_admin")));
  const signedAt = new Date().toLocaleString("en-US", { dateStyle: "full", timeStyle: "short" });
  const receiptHtml = `<!DOCTYPE html><html><body style="font-family:sans-serif;padding:32px;background:#f9f9f9;">
    <div style="max-width:560px;margin:auto;background:#fff;border-radius:10px;padding:32px;box-shadow:0 2px 12px rgba(0,0,0,.08);">
      <h2 style="color:#C9A84C;">Signed Receipt — Booking #${id}</h2>
      <p><strong>Service:</strong> ${updated.serviceType}</p>
      <p><strong>Member:</strong> ${user ? `${user.firstName} ${user.lastName}` : "Unknown"}</p>
      <p><strong>Professional:</strong> ${pro?.name ?? "Unknown"}</p>
      <p><strong>Signed At:</strong> ${signedAt}</p>
      <p><strong>Digital Signature:</strong></p>
      <div style="border:1px solid #ccc;border-radius:6px;padding:8px;background:#fafafa;">
        <img src="${signature}" alt="Signature" style="max-width:100%;height:auto;" />
      </div>
      <p style="margin-top:16px;color:#2D6A4F;font-weight:700;">The member has confirmed they received and are satisfied with this service.</p>
    </div>
  </body></html>`;

  const proUser = pro?.userId ? (await db.select().from(usersTable).where(eq(usersTable.id, pro.userId)))[0] : null;

  const notifyJobs: Promise<void>[] = [];
  if (user?.email) {
    notifyJobs.push(sendEmail({ to: user.email, subject: `Receipt Signed — Booking #${id}`, html: receiptHtml }));
  }
  if (proUser?.email) {
    notifyJobs.push(sendEmail({ to: proUser.email, subject: `[NFGN] Member Signed Receipt — Booking #${id}`, html: receiptHtml }));
  }
  for (const admin of admins) {
    if (admin.email) {
      notifyJobs.push(sendEmail({ to: admin.email, subject: `[NFGN] Receipt Signed by ${user?.firstName ?? "Member"} — Booking #${id}`, html: receiptHtml }));
    }
  }
  await Promise.allSettled(notifyJobs);

  res.json(formatBooking(updated, user ? `${user.firstName} ${user.lastName}` : "Unknown", pro?.name ?? "Unknown"));
});

// PATCH /api/bookings/:id/release-payment — admin releases payment to professional; requires digital signature
router.patch("/bookings/:id/release-payment", requireAuth, async (req, res): Promise<void> => {
  const currentUser = (req as typeof req & { user: typeof usersTable.$inferSelect }).user;
  const isAdmin = ["super_admin", "admin", "store_admin"].includes(currentUser.role);
  if (!isAdmin) { res.status(403).json({ error: "Admins only" }); return; }

  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id);
  const [row] = await db.select({ booking: bookingsTable, user: usersTable, pro: professionalsTable })
    .from(bookingsTable)
    .leftJoin(usersTable, eq(bookingsTable.userId, usersTable.id))
    .leftJoin(professionalsTable, eq(bookingsTable.professionalId, professionalsTable.id))
    .where(eq(bookingsTable.id, id));
  if (!row) { res.status(404).json({ error: "Booking not found" }); return; }

  if (!row.booking.digitalSignature) {
    res.status(400).json({ error: "Cannot release payment: member has not yet signed the digital receipt." });
    return;
  }
  if (row.booking.paymentReleasedAt) {
    res.status(400).json({ error: "Payment has already been released for this booking." });
    return;
  }

  const [updated] = await db.update(bookingsTable)
    .set({ paymentReleasedAt: new Date(), paymentStatus: "released" })
    .where(eq(bookingsTable.id, id))
    .returning();

  const member = row.user;
  const pro = row.pro;
  const proUser = pro?.userId ? (await db.select().from(usersTable).where(eq(usersTable.id, pro.userId)))[0] : null;
  const admins = await db.select().from(usersTable).where(or(eq(usersTable.role, "admin"), eq(usersTable.role, "super_admin")));
  const releasedAt = new Date().toLocaleString("en-US", { dateStyle: "full", timeStyle: "short" });

  const releaseHtml = `<!DOCTYPE html><html><body style="font-family:sans-serif;padding:32px;background:#f9f9f9;">
    <div style="max-width:560px;margin:auto;background:#fff;border-radius:10px;padding:32px;box-shadow:0 2px 12px rgba(0,0,0,.08);">
      <h2 style="color:#2D6A4F;">Payment Released — Booking #${id}</h2>
      <p>The member's digital receipt has been verified and payment has been released to the professional.</p>
      <p><strong>Service:</strong> ${updated.serviceType}</p>
      <p><strong>Member:</strong> ${member ? `${member.firstName} ${member.lastName}` : "Unknown"}</p>
      <p><strong>Professional:</strong> ${pro?.name ?? "Unknown"}</p>
      <p><strong>Amount:</strong> $${parseFloat(updated.amount).toFixed(2)}</p>
      <p><strong>Released At:</strong> ${releasedAt}</p>
      <p style="margin-top:16px;color:#C9A84C;font-weight:700;">Thank you for using New Face Global Network!</p>
    </div>
  </body></html>`;

  const notifyJobs: Promise<void>[] = [];
  if (member?.email) notifyJobs.push(sendEmail({ to: member.email, subject: `Payment Released — Booking #${id}`, html: releaseHtml }));
  if (proUser?.email) notifyJobs.push(sendEmail({ to: proUser.email, subject: `[NFGN] Your Payment Has Been Released — Booking #${id}`, html: releaseHtml }));
  for (const admin of admins) {
    if (admin.email) notifyJobs.push(sendEmail({ to: admin.email, subject: `[NFGN] Payment Released — Booking #${id}`, html: releaseHtml }));
  }
  await Promise.allSettled(notifyJobs);

  res.json(formatBooking(updated, member ? `${member.firstName} ${member.lastName}` : "Unknown", pro?.name ?? "Unknown"));
});

// PATCH /api/bookings/:id/cancellation-note — admin/pro records a cancellation statement on the receipt
router.patch("/bookings/:id/cancellation-note", requireAuth, async (req, res): Promise<void> => {
  const currentUser = (req as typeof req & { user: typeof usersTable.$inferSelect }).user;
  const isAdmin = ["super_admin", "admin", "store_admin"].includes(currentUser.role);
  if (!isAdmin) { res.status(403).json({ error: "Admins only" }); return; }

  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id);
  const { cancellationNote } = req.body as { cancellationNote: string };
  if (!cancellationNote?.trim()) { res.status(400).json({ error: "cancellationNote is required" }); return; }

  const [updated] = await db.update(bookingsTable)
    .set({ cancellationNote: cancellationNote.trim() })
    .where(eq(bookingsTable.id, id))
    .returning();
  if (!updated) { res.status(404).json({ error: "Booking not found" }); return; }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, updated.userId));
  const [pro] = await db.select().from(professionalsTable).where(eq(professionalsTable.id, updated.professionalId));
  res.json(formatBooking(updated, user ? `${user.firstName} ${user.lastName}` : "Unknown", pro?.name ?? "Unknown"));
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
