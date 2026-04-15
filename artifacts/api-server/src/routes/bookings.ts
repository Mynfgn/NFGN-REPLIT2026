import { Router, type IRouter } from "express";
import { db, bookingsTable, professionalsTable, usersTable } from "@workspace/db";
import { eq, and, desc, count } from "drizzle-orm";
import { requireAuth, requireAdmin } from "../lib/auth";

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
  const userId = (req as typeof req & { user: typeof usersTable.$inferSelect }).user.id;
  const { professionalId, serviceType, scheduledAt, duration, paymentMethod, amount, notes } = req.body;

  const [booking] = await db.insert(bookingsTable).values({
    userId,
    professionalId,
    serviceType,
    scheduledAt: new Date(scheduledAt),
    duration: duration ?? 60,
    status: "pending",
    paymentMethod,
    paymentStatus: "pending",
    amount: String(amount),
    notes: notes ?? undefined,
  }).returning();

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
  const [pro] = await db.select().from(professionalsTable).where(eq(professionalsTable.id, professionalId));

  res.status(201).json(formatBooking(booking, user ? `${user.firstName} ${user.lastName}` : "Unknown", pro?.name ?? "Unknown"));
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
