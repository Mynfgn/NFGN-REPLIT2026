import { Router } from "express";
import { db } from "@workspace/db";
import {
  booksTable, authorApplicationsTable, bookPurchasesTable,
  bookReadingProgressTable, bookRoyaltyOverridesTable,
} from "@workspace/db/schema";
import { eq, and, desc, ilike, or, sql, count } from "drizzle-orm";
import { requireAuth, requireAdmin } from "../lib/auth";

const router = Router();

function formatBook(b: typeof booksTable.$inferSelect, showFile = false) {
  return {
    id: b.id,
    title: b.title,
    subtitle: b.subtitle,
    slug: b.slug,
    authorName: b.authorName,
    authorUserId: b.authorUserId,
    description: b.description,
    shortDescription: b.shortDescription,
    category: b.category,
    type: b.type,
    coverImage: b.coverImage,
    fileUrl: showFile ? b.fileUrl : null,
    audioUrl: showFile ? b.audioUrl : null,
    price: parseFloat(String(b.price)),
    isFree: b.isFree,
    authorRoyaltyPct: parseFloat(String(b.authorRoyaltyPct)),
    platformFeePct: parseFloat(String(b.platformFeePct)),
    status: b.status,
    isFeatured: b.isFeatured,
    isBestSeller: b.isBestSeller,
    isStaffPick: b.isStaffPick,
    totalSales: b.totalSales,
    pageCount: b.pageCount,
    duration: b.duration,
    language: b.language,
    tags: b.tags,
    isbn: b.isbn,
    adminNote: b.adminNote,
    publishedAt: b.publishedAt?.toISOString() ?? null,
    createdAt: b.createdAt.toISOString(),
  };
}

function makeSlug(title: string) {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") + "-" + Date.now();
}

// ── ADMIN: Stats ───────────────────────────────────────────────────
router.get("/bookstore/admin/stats", requireAuth, requireAdmin, async (req, res): Promise<void> => {
  const [[totalBooks], [pendingBooks], [approvedBooks], [totalPurchases], [totalAuthors], [pendingAuthors], [totalRevenue], [monthlyRevenue]] = await Promise.all([
    db.select({ c: count() }).from(booksTable),
    db.select({ c: count() }).from(booksTable).where(eq(booksTable.status, "pending")),
    db.select({ c: count() }).from(booksTable).where(eq(booksTable.status, "approved")),
    db.select({ c: count() }).from(bookPurchasesTable),
    db.select({ c: count() }).from(authorApplicationsTable).where(eq(authorApplicationsTable.status, "approved")),
    db.select({ c: count() }).from(authorApplicationsTable).where(eq(authorApplicationsTable.status, "pending")),
    db.select({ t: sql<string>`COALESCE(SUM(price_paid), 0)` }).from(bookPurchasesTable),
    db.select({ t: sql<string>`COALESCE(SUM(price_paid), 0)` }).from(bookPurchasesTable).where(sql`created_at >= date_trunc('month', now())`),
  ]);
  res.json({
    totalBooks: totalBooks.c,
    pendingBooks: pendingBooks.c,
    approvedBooks: approvedBooks.c,
    totalPurchases: totalPurchases.c,
    totalAuthors: totalAuthors.c,
    pendingAuthors: pendingAuthors.c,
    totalRevenue: parseFloat(String(totalRevenue.t)),
    monthlyRevenue: parseFloat(String(monthlyRevenue.t)),
  });
});

// ── ADMIN: List all books ──────────────────────────────────────────
router.get("/bookstore/admin/books", requireAuth, requireAdmin, async (req, res): Promise<void> => {
  const { status, category, q } = req.query as Record<string, string>;
  const conds = [];
  if (status) conds.push(eq(booksTable.status, status));
  if (category) conds.push(eq(booksTable.category, category));
  if (q) conds.push(or(ilike(booksTable.title, `%${q}%`), ilike(booksTable.authorName, `%${q}%`))!);
  const rows = conds.length > 0
    ? await db.select().from(booksTable).where(and(...conds)).orderBy(desc(booksTable.createdAt))
    : await db.select().from(booksTable).orderBy(desc(booksTable.createdAt));
  res.json({ books: rows.map(b => formatBook(b, true)) });
});

// ── ADMIN: Create book ─────────────────────────────────────────────
router.post("/bookstore/admin/books", requireAuth, requireAdmin, async (req, res): Promise<void> => {
  const { title, subtitle, authorName, description, shortDescription, category, type, coverImage, fileUrl, audioUrl, price, isFree, pageCount, duration, language, tags, isbn, isFeatured, isStaffPick, authorRoyaltyPct, platformFeePct } = req.body;
  if (!title || !authorName) { res.status(400).json({ error: "title and authorName are required" }); return; }
  const [book] = await db.insert(booksTable).values({
    title, subtitle, slug: makeSlug(title), authorName, description, shortDescription,
    category: category ?? "general", type: type ?? "ebook",
    coverImage, fileUrl, audioUrl,
    price: String(price ?? 0), isFree: isFree ?? false,
    authorRoyaltyPct: String(authorRoyaltyPct ?? 70), platformFeePct: String(platformFeePct ?? 30),
    status: "approved", isFeatured: isFeatured ?? false, isStaffPick: isStaffPick ?? false,
    pageCount: pageCount ?? null, duration: duration ?? null,
    language: language ?? "English", tags: tags ?? null, isbn: isbn ?? null,
    publishedAt: new Date(),
  }).returning();
  res.json({ book: formatBook(book, true) });
});

// ── ADMIN: Update book status / flags ──────────────────────────────
router.patch("/bookstore/admin/books/:id/status", requireAuth, requireAdmin, async (req, res): Promise<void> => {
  const id = parseInt(String(req.params.id));
  const { status, adminNote, isFeatured, isBestSeller, isStaffPick } = req.body;
  const upd: Record<string, unknown> = {};
  if (status !== undefined) { upd.status = status; if (status === "approved") upd.publishedAt = new Date(); }
  if (adminNote !== undefined) upd.adminNote = adminNote;
  if (isFeatured !== undefined) upd.isFeatured = isFeatured;
  if (isBestSeller !== undefined) upd.isBestSeller = isBestSeller;
  if (isStaffPick !== undefined) upd.isStaffPick = isStaffPick;
  const [updated] = await db.update(booksTable).set(upd).where(eq(booksTable.id, id)).returning();
  if (!updated) { res.status(404).json({ error: "Not found" }); return; }
  res.json({ book: formatBook(updated, true) });
});

// ── ADMIN: Update book details ────────────────────────────────────
router.patch("/bookstore/admin/books/:id", requireAuth, requireAdmin, async (req, res): Promise<void> => {
  const id = parseInt(String(req.params.id));
  const { title, subtitle, authorName, description, shortDescription, category, type, coverImage, fileUrl, audioUrl, price, isFree, pageCount, duration, language, tags, isbn, authorRoyaltyPct, platformFeePct } = req.body;
  const upd: Record<string, unknown> = {};
  if (title) upd.title = title;
  if (subtitle !== undefined) upd.subtitle = subtitle;
  if (authorName) upd.authorName = authorName;
  if (description !== undefined) upd.description = description;
  if (shortDescription !== undefined) upd.shortDescription = shortDescription;
  if (category) upd.category = category;
  if (type) upd.type = type;
  if (coverImage !== undefined) upd.coverImage = coverImage;
  if (fileUrl !== undefined) upd.fileUrl = fileUrl;
  if (audioUrl !== undefined) upd.audioUrl = audioUrl;
  if (price !== undefined) upd.price = String(price);
  if (isFree !== undefined) upd.isFree = isFree;
  if (pageCount !== undefined) upd.pageCount = pageCount;
  if (duration !== undefined) upd.duration = duration;
  if (language) upd.language = language;
  if (tags !== undefined) upd.tags = tags;
  if (isbn !== undefined) upd.isbn = isbn;
  if (authorRoyaltyPct !== undefined) upd.authorRoyaltyPct = String(authorRoyaltyPct);
  if (platformFeePct !== undefined) upd.platformFeePct = String(platformFeePct);
  const [updated] = await db.update(booksTable).set(upd).where(eq(booksTable.id, id)).returning();
  if (!updated) { res.status(404).json({ error: "Not found" }); return; }
  res.json({ book: formatBook(updated, true) });
});

// ── ADMIN: Author applications ─────────────────────────────────────
router.get("/bookstore/admin/author-applications", requireAuth, requireAdmin, async (req, res): Promise<void> => {
  const apps = await db.select().from(authorApplicationsTable).orderBy(desc(authorApplicationsTable.createdAt));
  res.json({ applications: apps });
});

router.patch("/bookstore/admin/author-applications/:id/status", requireAuth, requireAdmin, async (req, res): Promise<void> => {
  const id = parseInt(String(req.params.id));
  const { status, adminNote } = req.body;
  const admin = (req as any).user;
  const [updated] = await db.update(authorApplicationsTable)
    .set({ status, adminNote, reviewedAt: new Date(), reviewedBy: admin.id })
    .where(eq(authorApplicationsTable.id, id)).returning();
  if (!updated) { res.status(404).json({ error: "Not found" }); return; }
  res.json({ application: updated });
});

// ── ADMIN: Royalty overrides ───────────────────────────────────────
router.get("/bookstore/admin/royalty-overrides", requireAuth, requireAdmin, async (req, res): Promise<void> => {
  const rows = await db.select().from(bookRoyaltyOverridesTable).orderBy(desc(bookRoyaltyOverridesTable.createdAt));
  res.json({ overrides: rows });
});

router.post("/bookstore/admin/royalty-overrides", requireAuth, requireAdmin, async (req, res): Promise<void> => {
  const { bookId, authorUserId, category, authorRoyaltyPct, platformFeePct, notes } = req.body;
  const [row] = await db.insert(bookRoyaltyOverridesTable).values({
    bookId: bookId ?? null, authorUserId: authorUserId ?? null, category: category ?? null,
    authorRoyaltyPct: String(authorRoyaltyPct), platformFeePct: String(platformFeePct), notes,
  }).returning();
  res.json({ override: row });
});

router.delete("/bookstore/admin/royalty-overrides/:id", requireAuth, requireAdmin, async (req, res): Promise<void> => {
  await db.delete(bookRoyaltyOverridesTable).where(eq(bookRoyaltyOverridesTable.id, parseInt(String(req.params.id))));
  res.json({ success: true });
});

// ── MEMBER: List approved books ────────────────────────────────────
router.get("/bookstore/books", requireAuth, async (req, res): Promise<void> => {
  const { category, type, q, featured, bestseller } = req.query as Record<string, string>;
  const userId = (req as any).user?.id;
  const conds: ReturnType<typeof eq>[] = [eq(booksTable.status, "approved")];
  if (category && category !== "all") conds.push(eq(booksTable.category, category));
  if (type) conds.push(eq(booksTable.type, type));
  if (featured === "1") conds.push(eq(booksTable.isFeatured, true));
  if (bestseller === "1") conds.push(eq(booksTable.isBestSeller, true));

  let rows = await db.select().from(booksTable).where(and(...conds)).orderBy(desc(booksTable.publishedAt));
  if (q) {
    const lq = q.toLowerCase();
    rows = rows.filter(b => b.title.toLowerCase().includes(lq) || b.authorName.toLowerCase().includes(lq) || (b.description ?? "").toLowerCase().includes(lq));
  }

  const purchasedIds = new Set<number>();
  if (userId) {
    const ps = await db.select({ bookId: bookPurchasesTable.bookId }).from(bookPurchasesTable).where(eq(bookPurchasesTable.userId, userId));
    ps.forEach(p => purchasedIds.add(p.bookId));
  }
  res.json({ books: rows.map(b => ({ ...formatBook(b, purchasedIds.has(b.id)), purchased: purchasedIds.has(b.id) })) });
});

// ── MEMBER: Book detail ────────────────────────────────────────────
router.get("/bookstore/books/:id", requireAuth, async (req, res): Promise<void> => {
  const id = parseInt(String(req.params.id));
  const userId = (req as any).user?.id;
  const [book] = await db.select().from(booksTable).where(and(eq(booksTable.id, id), eq(booksTable.status, "approved")));
  if (!book) { res.status(404).json({ error: "Not found" }); return; }
  let purchased = false;
  if (userId) {
    const [p] = await db.select().from(bookPurchasesTable).where(and(eq(bookPurchasesTable.userId, userId), eq(bookPurchasesTable.bookId, id)));
    purchased = !!p;
  }
  res.json({ book: { ...formatBook(book, purchased), purchased } });
});

// ── MEMBER: Purchase a book ────────────────────────────────────────
router.post("/bookstore/books/:id/purchase", requireAuth, async (req, res): Promise<void> => {
  const bookId = parseInt(String(req.params.id));
  const userId = (req as any).user.id;
  const { licenseAgreed, paymentMethod } = req.body;
  if (!licenseAgreed) { res.status(400).json({ error: "You must agree to the digital license terms" }); return; }
  const [book] = await db.select().from(booksTable).where(and(eq(booksTable.id, bookId), eq(booksTable.status, "approved")));
  if (!book) { res.status(404).json({ error: "Book not found" }); return; }
  const [existing] = await db.select().from(bookPurchasesTable).where(and(eq(bookPurchasesTable.userId, userId), eq(bookPurchasesTable.bookId, bookId)));
  if (existing) { res.json({ success: true, message: "Already in your library" }); return; }
  const price = parseFloat(String(book.price));
  const royaltyPct = parseFloat(String(book.authorRoyaltyPct)) / 100;
  const platformPct = parseFloat(String(book.platformFeePct)) / 100;
  await db.insert(bookPurchasesTable).values({
    userId, bookId,
    pricePaid: String(price),
    royaltyAmount: String((price * royaltyPct).toFixed(2)),
    platformAmount: String((price * platformPct).toFixed(2)),
    licenseAgreed: true,
    paymentMethod: paymentMethod ?? "platform",
  });
  await db.update(booksTable).set({ totalSales: book.totalSales + 1 }).where(eq(booksTable.id, bookId));
  res.json({ success: true, message: book.isFree ? "Added to your library!" : "Purchase successful! Book added to your library." });
});

// ── MEMBER: My library ─────────────────────────────────────────────
router.get("/bookstore/library", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as any).user.id;
  const rows = await db.select({ p: bookPurchasesTable, b: booksTable })
    .from(bookPurchasesTable)
    .innerJoin(booksTable, eq(bookPurchasesTable.bookId, booksTable.id))
    .where(eq(bookPurchasesTable.userId, userId))
    .orderBy(desc(bookPurchasesTable.createdAt));
  const progress = await db.select().from(bookReadingProgressTable).where(eq(bookReadingProgressTable.userId, userId));
  const progMap = new Map(progress.map(p => [p.bookId, p]));
  res.json({
    library: rows.map(({ p, b }) => {
      const prog = progMap.get(b.id);
      return {
        ...formatBook(b, true), purchased: true,
        purchasedAt: p.createdAt.toISOString(),
        pricePaid: parseFloat(String(p.pricePaid)),
        readingProgress: prog ? { currentPage: prog.currentPage, totalPages: prog.totalPages, pct: parseFloat(String(prog.pct)), lastReadAt: prog.lastReadAt.toISOString() } : null,
      };
    }),
  });
});

// ── MEMBER: Reading progress ───────────────────────────────────────
router.get("/bookstore/reading-progress/:bookId", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as any).user.id;
  const bookId = parseInt(String(req.params.bookId));
  const [prog] = await db.select().from(bookReadingProgressTable).where(and(eq(bookReadingProgressTable.userId, userId), eq(bookReadingProgressTable.bookId, bookId)));
  res.json({ progress: prog ? { currentPage: prog.currentPage, totalPages: prog.totalPages, pct: parseFloat(String(prog.pct)), lastReadAt: prog.lastReadAt.toISOString() } : null });
});

router.post("/bookstore/reading-progress/:bookId", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as any).user.id;
  const bookId = parseInt(String(req.params.bookId));
  const { currentPage, totalPages } = req.body;
  const pct = totalPages > 0 ? Math.min(100, Math.round((currentPage / totalPages) * 100)) : 0;
  const [ex] = await db.select().from(bookReadingProgressTable).where(and(eq(bookReadingProgressTable.userId, userId), eq(bookReadingProgressTable.bookId, bookId)));
  if (ex) {
    await db.update(bookReadingProgressTable).set({ currentPage, totalPages, pct: String(pct), lastReadAt: new Date() }).where(eq(bookReadingProgressTable.id, ex.id));
  } else {
    await db.insert(bookReadingProgressTable).values({ userId, bookId, currentPage, totalPages, pct: String(pct) });
  }
  res.json({ success: true });
});

// ── MEMBER: Author application status ─────────────────────────────
router.get("/bookstore/author/status", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as any).user.id;
  const [app] = await db.select().from(authorApplicationsTable).where(eq(authorApplicationsTable.userId, userId)).orderBy(desc(authorApplicationsTable.createdAt));
  res.json({ application: app ?? null });
});

router.post("/bookstore/author/apply", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as any).user.id;
  const { name, bio, website, socialLinks, writingExperience, categories, agreedToTerms } = req.body;
  if (!name || !agreedToTerms) { res.status(400).json({ error: "Name and agreement to terms are required" }); return; }
  const [existing] = await db.select().from(authorApplicationsTable).where(eq(authorApplicationsTable.userId, userId));
  if (existing && existing.status === "pending") { res.status(400).json({ error: "Your application is already pending review" }); return; }
  const [app] = await db.insert(authorApplicationsTable).values({
    userId, name, bio: bio ?? null, website: website ?? null,
    socialLinks: socialLinks ? JSON.stringify(socialLinks) : null,
    writingExperience: writingExperience ?? null, categories: categories ?? null,
    agreedToTerms: true, status: "pending",
  }).returning();
  res.json({ application: app });
});

// ── AUTHOR: My books ───────────────────────────────────────────────
router.get("/bookstore/author/books", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as any).user.id;
  const books = await db.select().from(booksTable).where(eq(booksTable.authorUserId, userId)).orderBy(desc(booksTable.createdAt));
  res.json({ books: books.map(b => formatBook(b, true)) });
});

router.post("/bookstore/author/books", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as any).user.id;
  const [approved] = await db.select().from(authorApplicationsTable).where(and(eq(authorApplicationsTable.userId, userId), eq(authorApplicationsTable.status, "approved")));
  if (!approved) { res.status(403).json({ error: "Author approval required to submit books" }); return; }
  const { title, subtitle, description, shortDescription, category, type, coverImage, fileUrl, audioUrl, price, isFree, pageCount, duration, language, tags, isbn } = req.body;
  if (!title) { res.status(400).json({ error: "Title is required" }); return; }
  const user = (req as any).user;
  const [book] = await db.insert(booksTable).values({
    title, subtitle: subtitle ?? null, slug: makeSlug(title),
    authorName: `${user.firstName} ${user.lastName}`, authorUserId: userId,
    description: description ?? null, shortDescription: shortDescription ?? null,
    category: category ?? "general", type: type ?? "ebook",
    coverImage: coverImage ?? null, fileUrl: fileUrl ?? null, audioUrl: audioUrl ?? null,
    price: String(price ?? 0), isFree: isFree ?? false, status: "pending",
    pageCount: pageCount ?? null, duration: duration ?? null,
    language: language ?? "English", tags: tags ?? null, isbn: isbn ?? null,
  }).returning();
  res.json({ book: formatBook(book, true) });
});

router.get("/bookstore/author/sales", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as any).user.id;
  const myBooks = await db.select({ id: booksTable.id, title: booksTable.title }).from(booksTable).where(eq(booksTable.authorUserId, userId));
  if (myBooks.length === 0) { res.json({ sales: [], totalEarned: 0, totalSales: 0 }); return; }
  const ids = myBooks.map(b => b.id);
  const purchases = await db.select().from(bookPurchasesTable).where(sql`book_id = ANY(${ids})`).orderBy(desc(bookPurchasesTable.createdAt));
  const totalEarned = purchases.reduce((s, p) => s + parseFloat(String(p.royaltyAmount)), 0);
  res.json({ sales: purchases, totalEarned, totalSales: purchases.length, books: myBooks });
});

export default router;
