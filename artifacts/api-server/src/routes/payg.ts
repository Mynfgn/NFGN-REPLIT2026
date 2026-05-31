import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import {
  paygServicesTable, paygAvailabilityTable, paygBookingsTable, usersTable,
} from "@workspace/db/schema";
import { eq, and, desc, asc, gte } from "drizzle-orm";
import { requireAuth, requireAdmin } from "../lib/auth";
import { sendEmail } from "../lib/mailer";
import { paygBookingConfirmationHtml } from "../lib/mailer";

const router: IRouter = Router();

// ─── helpers ─────────────────────────────────────────────────────────────────

function calcTotal(price: number, numHours: number): number {
  return parseFloat((price * numHours).toFixed(2));
}

function calcCv(totalPrice: number): number {
  return parseFloat((totalPrice * 0.10).toFixed(2));
}

function isAtLeast48HoursAhead(bookingDate: string, startTime: string): boolean {
  const dt = new Date(`${bookingDate}T${startTime}:00`);
  const diffMs = dt.getTime() - Date.now();
  return diffMs >= 48 * 60 * 60 * 1000;
}

// ─── PUBLIC: list PAYG providers ──────────────────────────────────────────────

router.get("/payg/providers", async (req, res): Promise<void> => {
  // Pro members who have at least one active PAYG service
  const rows = await db
    .selectDistinct({ userId: paygServicesTable.providerId })
    .from(paygServicesTable)
    .where(eq(paygServicesTable.isActive, true));

  if (!rows.length) { res.json({ providers: [] }); return; }

  const ids = rows.map(r => r.userId);
  const users = await db
    .select({
      id: usersTable.id,
      firstName: usersTable.firstName,
      lastName: usersTable.lastName,
      email: usersTable.email,
      city: usersTable.city,
      state: usersTable.state,
      country: usersTable.country,
      bookAProCategory: usersTable.bookAProCategory,
      bookAProBio: usersTable.bookAProBio,
      avatar: usersTable.avatar,
      role: usersTable.role,
    })
    .from(usersTable)
    .where(eq(usersTable.role, "pro_member"));

  const proUsers = users.filter(u => ids.includes(u.id));
  res.json({ providers: proUsers.map(u => ({
    ...u,
    profileImage: u.avatar,
    fullName: `${u.firstName} ${u.lastName}`.trim(),
    location: [u.city, u.state, u.country].filter(Boolean).join(", "),
  })) });
});

// ─── PUBLIC: provider's active services ───────────────────────────────────────

router.get("/payg/providers/:id/services", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id as string);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const services = await db
    .select()
    .from(paygServicesTable)
    .where(and(eq(paygServicesTable.providerId, id), eq(paygServicesTable.isActive, true)))
    .orderBy(asc(paygServicesTable.sortOrder));
  res.json({ services: services.map(s => ({ ...s, price: parseFloat(s.price), cv: parseFloat(s.cv) })) });
});

// ─── PUBLIC: provider's availability (future dates only) ──────────────────────

router.get("/payg/providers/:id/availability", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id as string);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const today = new Date().toISOString().split("T")[0];
  const slots = await db
    .select()
    .from(paygAvailabilityTable)
    .where(
      and(
        eq(paygAvailabilityTable.providerId, id),
        eq(paygAvailabilityTable.isBlocked, false),
        gte(paygAvailabilityTable.availableDate, today),
      )
    )
    .orderBy(asc(paygAvailabilityTable.availableDate), asc(paygAvailabilityTable.startTime));
  res.json({ slots });
});

// ─── AUTH: create a PAYG booking ─────────────────────────────────────────────

router.post("/payg/bookings", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as any).userId as number;
  const { providerId, serviceId, availabilityId, bookingDate, startTime, numHours, notes, paymentMethod } = req.body;

  if (!providerId || !serviceId || !bookingDate || !startTime || !numHours) {
    res.status(400).json({ error: "providerId, serviceId, bookingDate, startTime, numHours required" });
    return;
  }
  if (numHours < 2) {
    res.status(400).json({ error: "Minimum rental is 2 hours." });
    return;
  }
  if (numHours > 8) {
    res.status(400).json({ error: "Maximum rental is 8 hours (1 Block of Time) per day." });
    return;
  }
  if (!isAtLeast48HoursAhead(bookingDate, startTime)) {
    res.status(400).json({ error: "PAYG bookings must be made at least 48 hours in advance. Same-day bookings require corporate approval." });
    return;
  }

  // Load service
  const [service] = await db.select().from(paygServicesTable).where(
    and(eq(paygServicesTable.id, serviceId), eq(paygServicesTable.providerId, providerId))
  ).limit(1);
  if (!service || !service.isActive) { res.status(404).json({ error: "Service not found or inactive" }); return; }

  // Load provider
  const [provider] = await db.select().from(usersTable).where(eq(usersTable.id, providerId)).limit(1);
  if (!provider) { res.status(404).json({ error: "Provider not found" }); return; }

  // Load customer
  const [customer] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
  if (!customer) { res.status(404).json({ error: "Customer not found" }); return; }

  const unitPrice = parseFloat(service.price);
  const hours = parseFloat(String(numHours));
  const totalPrice = calcTotal(unitPrice, hours);
  const cvGenerated = calcCv(totalPrice);
  const providerName = `${provider.firstName} ${provider.lastName}`.trim();

  const [booking] = await db.insert(paygBookingsTable).values({
    customerId: userId,
    providerId,
    serviceId,
    availabilityId: availabilityId ?? null,
    bookingDate,
    startTime,
    numHours: String(hours),
    serviceName: service.name,
    providerName,
    unitPrice: String(unitPrice),
    totalPrice: String(totalPrice),
    cvGenerated: String(cvGenerated),
    status: "pending",
    paymentStatus: "pending",
    paymentMethod: paymentMethod ?? null,
    notes: notes ?? null,
  }).returning();

  // Send confirmation emails (fire-and-forget)
  const customerName = `${customer.firstName} ${customer.lastName}`.trim();
  const opts = {
    customerName,
    customerEmail: customer.email,
    providerName,
    providerEmail: provider.email,
    serviceName: service.name,
    bookingDate,
    startTime,
    numHours: hours,
    unitPrice,
    totalPrice,
    cvGenerated,
    bookingId: booking.id,
  };
  sendEmail({ to: customer.email, subject: "PAYG Booking Confirmed — NFGN", html: paygBookingConfirmationHtml({ ...opts, role: "customer" }) }).catch(() => {});
  sendEmail({ to: provider.email, subject: "New PAYG Booking Received — NFGN", html: paygBookingConfirmationHtml({ ...opts, role: "provider" }) }).catch(() => {});

  // Notify admin via email
  const adminEmails = ["Mynfgn@gmail.com"];
  sendEmail({ to: adminEmails, subject: `New PAYG Booking #${booking.id} — NFGN`, html: paygBookingConfirmationHtml({ ...opts, role: "admin" }) }).catch(() => {});

  res.status(201).json({ booking });
});

// ─── AUTH: customer's own PAYG bookings ───────────────────────────────────────

router.get("/payg/my-bookings", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as any).userId as number;
  const bookings = await db
    .select()
    .from(paygBookingsTable)
    .where(eq(paygBookingsTable.customerId, userId))
    .orderBy(desc(paygBookingsTable.createdAt));
  res.json({ bookings: bookings.map(b => ({ ...b, totalPrice: parseFloat(b.totalPrice), unitPrice: parseFloat(b.unitPrice), numHours: parseFloat(b.numHours), cvGenerated: parseFloat(b.cvGenerated) })) });
});

// ─── PROVIDER: my services ────────────────────────────────────────────────────

router.get("/payg/provider/services", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as any).userId as number;
  const services = await db
    .select()
    .from(paygServicesTable)
    .where(eq(paygServicesTable.providerId, userId))
    .orderBy(asc(paygServicesTable.sortOrder));
  res.json({ services: services.map(s => ({ ...s, price: parseFloat(s.price), cv: parseFloat(s.cv) })) });
});

router.post("/payg/provider/services", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as any).userId as number;
  const existing = await db.select({ id: paygServicesTable.id }).from(paygServicesTable).where(eq(paygServicesTable.providerId, userId));
  if (existing.length >= 4) {
    res.status(400).json({ error: "Maximum of 4 services allowed per provider." });
    return;
  }
  const { name, description, price, isActive } = req.body;
  if (!name || price == null) { res.status(400).json({ error: "name and price required" }); return; }
  const priceNum = parseFloat(String(price));
  const cvNum = parseFloat((priceNum * 0.10).toFixed(2));
  const [service] = await db.insert(paygServicesTable).values({
    providerId: userId,
    name,
    description: description ?? null,
    price: String(priceNum),
    cv: String(cvNum),
    isActive: isActive ?? true,
    sortOrder: existing.length,
  }).returning();
  res.status(201).json({ service: { ...service, price: parseFloat(service.price), cv: parseFloat(service.cv) } });
});

router.patch("/payg/provider/services/:id", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as any).userId as number;
  const id = parseInt(req.params.id as string);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const { name, description, price, isActive } = req.body;
  const updates: Partial<typeof paygServicesTable.$inferInsert> = {};
  if (name) updates.name = name;
  if (description !== undefined) updates.description = description;
  if (price != null) {
    const priceNum = parseFloat(String(price));
    updates.price = String(priceNum);
    updates.cv = String(parseFloat((priceNum * 0.10).toFixed(2)));
  }
  if (isActive !== undefined) updates.isActive = isActive;
  const [updated] = await db
    .update(paygServicesTable)
    .set(updates)
    .where(and(eq(paygServicesTable.id, id), eq(paygServicesTable.providerId, userId)))
    .returning();
  if (!updated) { res.status(404).json({ error: "Not found" }); return; }
  res.json({ service: { ...updated, price: parseFloat(updated.price), cv: parseFloat(updated.cv) } });
});

router.delete("/payg/provider/services/:id", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as any).userId as number;
  const id = parseInt(req.params.id as string);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  await db.delete(paygServicesTable).where(and(eq(paygServicesTable.id, id), eq(paygServicesTable.providerId, userId)));
  res.json({ ok: true });
});

// ─── PROVIDER: my availability ────────────────────────────────────────────────

router.get("/payg/provider/availability", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as any).userId as number;
  const today = new Date().toISOString().split("T")[0];
  const slots = await db
    .select()
    .from(paygAvailabilityTable)
    .where(and(eq(paygAvailabilityTable.providerId, userId), gte(paygAvailabilityTable.availableDate, today)))
    .orderBy(asc(paygAvailabilityTable.availableDate), asc(paygAvailabilityTable.startTime));
  res.json({ slots });
});

router.post("/payg/provider/availability", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as any).userId as number;
  const { availableDate, startTime, endTime, maxChairs, notes, isBlocked } = req.body;
  if (!availableDate || !startTime || !endTime) {
    res.status(400).json({ error: "availableDate, startTime, endTime required" });
    return;
  }
  const [slot] = await db.insert(paygAvailabilityTable).values({
    providerId: userId,
    availableDate,
    startTime,
    endTime,
    maxChairs: maxChairs ?? 1,
    notes: notes ?? null,
    isBlocked: isBlocked ?? false,
  }).returning();
  res.status(201).json({ slot });
});

router.patch("/payg/provider/availability/:id", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as any).userId as number;
  const id = parseInt(req.params.id as string);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const { startTime, endTime, maxChairs, notes, isBlocked } = req.body;
  const updates: Partial<typeof paygAvailabilityTable.$inferInsert> = {};
  if (startTime) updates.startTime = startTime;
  if (endTime) updates.endTime = endTime;
  if (maxChairs != null) updates.maxChairs = maxChairs;
  if (notes !== undefined) updates.notes = notes;
  if (isBlocked !== undefined) updates.isBlocked = isBlocked;
  const [updated] = await db
    .update(paygAvailabilityTable)
    .set(updates)
    .where(and(eq(paygAvailabilityTable.id, id), eq(paygAvailabilityTable.providerId, userId)))
    .returning();
  if (!updated) { res.status(404).json({ error: "Not found" }); return; }
  res.json({ slot: updated });
});

router.delete("/payg/provider/availability/:id", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as any).userId as number;
  const id = parseInt(req.params.id as string);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  await db.delete(paygAvailabilityTable).where(and(eq(paygAvailabilityTable.id, id), eq(paygAvailabilityTable.providerId, userId)));
  res.json({ ok: true });
});

// ─── PROVIDER: received bookings ─────────────────────────────────────────────

router.get("/payg/provider/bookings", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as any).userId as number;
  const bookings = await db
    .select()
    .from(paygBookingsTable)
    .where(eq(paygBookingsTable.providerId, userId))
    .orderBy(desc(paygBookingsTable.createdAt));
  res.json({ bookings: bookings.map(b => ({ ...b, totalPrice: parseFloat(b.totalPrice), unitPrice: parseFloat(b.unitPrice), numHours: parseFloat(b.numHours), cvGenerated: parseFloat(b.cvGenerated) })) });
});

router.patch("/payg/provider/bookings/:id", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as any).userId as number;
  const id = parseInt(req.params.id as string);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const { status, adminNote } = req.body;
  const updates: Partial<typeof paygBookingsTable.$inferInsert> = {};
  if (status) updates.status = status;
  if (adminNote !== undefined) updates.adminNote = adminNote;
  if (status === "completed") updates.completedAt = new Date();
  if (status === "cancelled") updates.cancelledAt = new Date();
  const [updated] = await db
    .update(paygBookingsTable)
    .set(updates)
    .where(and(eq(paygBookingsTable.id, id), eq(paygBookingsTable.providerId, userId)))
    .returning();
  if (!updated) { res.status(404).json({ error: "Not found" }); return; }
  res.json({ booking: updated });
});

// ─── ADMIN: all PAYG bookings ─────────────────────────────────────────────────

router.get("/admin/payg/bookings", requireAdmin, async (req, res): Promise<void> => {
  const bookings = await db
    .select()
    .from(paygBookingsTable)
    .orderBy(desc(paygBookingsTable.createdAt));
  res.json({ bookings: bookings.map(b => ({ ...b, totalPrice: parseFloat(b.totalPrice), unitPrice: parseFloat(b.unitPrice), numHours: parseFloat(b.numHours), cvGenerated: parseFloat(b.cvGenerated) })) });
});

router.patch("/admin/payg/bookings/:id", requireAdmin, async (req, res): Promise<void> => {
  const id = parseInt(req.params.id as string);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const { status, adminNote, paymentStatus } = req.body;
  const updates: Partial<typeof paygBookingsTable.$inferInsert> = {};
  if (status) updates.status = status;
  if (adminNote !== undefined) updates.adminNote = adminNote;
  if (paymentStatus) updates.paymentStatus = paymentStatus;
  if (status === "completed") updates.completedAt = new Date();
  if (status === "cancelled") updates.cancelledAt = new Date();
  const [updated] = await db
    .update(paygBookingsTable)
    .set(updates)
    .where(eq(paygBookingsTable.id, id))
    .returning();
  if (!updated) { res.status(404).json({ error: "Not found" }); return; }
  res.json({ booking: updated });
});

export default router;
