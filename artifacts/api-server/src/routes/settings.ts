import { Router, type IRouter } from "express";
import { db, appSettingsTable, promoCodesTable, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAdmin } from "../lib/auth";

const router: IRouter = Router();

function formatSettings(s: typeof appSettingsTable.$inferSelect) {
  return {
    companyName: s.companyName,
    companyLogo: s.companyLogo ?? null,
    contactEmail: s.contactEmail,
    contactPhone: s.contactPhone ?? null,
    taxRate: parseFloat(s.taxRate),
    shippingRate: parseFloat(s.shippingRate),
    freeShippingThreshold: parseFloat(s.freeShippingThreshold),
    paymentMethods: s.paymentMethods as string[],
    cashAppHandle: s.cashAppHandle ?? null,
    paypalEmail: s.paypalEmail ?? null,
    registrationPackagePrice: parseFloat(s.registrationPackagePrice),
    registrationPackageId: s.registrationPackageId ?? null,
    homePageBanner: s.homePageBanner ?? null,
    homePageBannerSubtitle: s.homePageBannerSubtitle ?? null,
    demoMode: s.demoMode,
  };
}

router.get("/settings", async (req, res): Promise<void> => {
  const [settings] = await db.select().from(appSettingsTable).limit(1);
  if (!settings) {
    const [created] = await db.insert(appSettingsTable).values({}).returning();
    res.json(formatSettings(created));
    return;
  }
  res.json(formatSettings(settings));
});

router.put("/settings", requireAdmin, async (req, res): Promise<void> => {
  const [existing] = await db.select().from(appSettingsTable).limit(1);
  const updates = {
    companyName: req.body.companyName ?? existing?.companyName,
    companyLogo: req.body.companyLogo ?? existing?.companyLogo,
    contactEmail: req.body.contactEmail ?? existing?.contactEmail,
    contactPhone: req.body.contactPhone ?? existing?.contactPhone,
    taxRate: req.body.taxRate != null ? String(req.body.taxRate) : existing?.taxRate,
    shippingRate: req.body.shippingRate != null ? String(req.body.shippingRate) : existing?.shippingRate,
    freeShippingThreshold: req.body.freeShippingThreshold != null ? String(req.body.freeShippingThreshold) : existing?.freeShippingThreshold,
    paymentMethods: req.body.paymentMethods ?? existing?.paymentMethods,
    cashAppHandle: req.body.cashAppHandle ?? existing?.cashAppHandle,
    paypalEmail: req.body.paypalEmail ?? existing?.paypalEmail,
    registrationPackagePrice: req.body.registrationPackagePrice != null ? String(req.body.registrationPackagePrice) : existing?.registrationPackagePrice,
    registrationPackageId: req.body.registrationPackageId ?? existing?.registrationPackageId,
    homePageBanner: req.body.homePageBanner ?? existing?.homePageBanner,
    homePageBannerSubtitle: req.body.homePageBannerSubtitle ?? existing?.homePageBannerSubtitle,
    demoMode: req.body.demoMode ?? existing?.demoMode,
  };

  let result;
  if (existing) {
    [result] = await db.update(appSettingsTable).set(updates).where(eq(appSettingsTable.id, existing.id)).returning();
  } else {
    [result] = await db.insert(appSettingsTable).values(updates).returning();
  }
  res.json(formatSettings(result!));
});

router.get("/promos", requireAdmin, async (req, res): Promise<void> => {
  const promos = await db.select().from(promoCodesTable);
  res.json(promos.map(p => ({
    id: p.id,
    code: p.code,
    discountType: p.discountType,
    discountValue: parseFloat(p.discountValue),
    minOrderAmount: parseFloat(p.minOrderAmount),
    maxUses: p.maxUses ?? null,
    usedCount: p.usedCount,
    expiresAt: p.expiresAt?.toISOString() ?? null,
    isActive: p.isActive,
    createdAt: p.createdAt.toISOString(),
  })));
});

router.post("/promos", requireAdmin, async (req, res): Promise<void> => {
  const { code, discountType, discountValue, minOrderAmount, maxUses, expiresAt } = req.body;
  const [promo] = await db.insert(promoCodesTable).values({
    code: code.toUpperCase(),
    discountType,
    discountValue: String(discountValue),
    minOrderAmount: String(minOrderAmount ?? 0),
    maxUses: maxUses ?? undefined,
    expiresAt: expiresAt ? new Date(expiresAt) : undefined,
  }).returning();

  res.status(201).json({
    id: promo.id,
    code: promo.code,
    discountType: promo.discountType,
    discountValue: parseFloat(promo.discountValue),
    minOrderAmount: parseFloat(promo.minOrderAmount),
    maxUses: promo.maxUses ?? null,
    usedCount: promo.usedCount,
    expiresAt: promo.expiresAt?.toISOString() ?? null,
    isActive: promo.isActive,
    createdAt: promo.createdAt.toISOString(),
  });
});

router.post("/promos/validate", async (req, res): Promise<void> => {
  const { code, orderAmount } = req.body;
  const [promo] = await db.select().from(promoCodesTable).where(eq(promoCodesTable.code, code.toUpperCase()));

  if (!promo || !promo.isActive) { res.status(404).json({ error: "Invalid or expired code" }); return; }
  if (promo.expiresAt && promo.expiresAt < new Date()) { res.status(404).json({ error: "Code expired" }); return; }
  if (promo.maxUses && promo.usedCount >= promo.maxUses) { res.status(404).json({ error: "Code usage limit reached" }); return; }
  if (parseFloat(String(orderAmount)) < parseFloat(promo.minOrderAmount)) {
    res.status(400).json({ error: `Minimum order amount is $${promo.minOrderAmount}` });
    return;
  }

  res.json({
    id: promo.id,
    code: promo.code,
    discountType: promo.discountType,
    discountValue: parseFloat(promo.discountValue),
    minOrderAmount: parseFloat(promo.minOrderAmount),
    maxUses: promo.maxUses ?? null,
    usedCount: promo.usedCount,
    expiresAt: promo.expiresAt?.toISOString() ?? null,
    isActive: promo.isActive,
    createdAt: promo.createdAt.toISOString(),
  });
});

router.put("/promos/:id", requireAdmin, async (req, res): Promise<void> => {
  const id = parseInt(req.params.id as string);
  const { code, discountType, discountValue, minOrderAmount, maxUses, expiresAt, isActive } = req.body;

  const [existing] = await db.select().from(promoCodesTable).where(eq(promoCodesTable.id, id));
  if (!existing) { res.status(404).json({ error: "Promo code not found" }); return; }

  const updates: Record<string, unknown> = {};
  if (code !== undefined) updates.code = String(code).toUpperCase().trim();
  if (discountType !== undefined) updates.discountType = discountType;
  if (discountValue !== undefined) updates.discountValue = String(discountValue);
  if (minOrderAmount !== undefined) updates.minOrderAmount = String(minOrderAmount);
  if (maxUses !== undefined) updates.maxUses = maxUses === null ? null : Number(maxUses);
  if (expiresAt !== undefined) updates.expiresAt = expiresAt ? new Date(expiresAt) : null;
  if (typeof isActive === "boolean") updates.isActive = isActive;

  const [updated] = await db.update(promoCodesTable).set(updates as any).where(eq(promoCodesTable.id, id)).returning();

  res.json({
    id: updated.id,
    code: updated.code,
    discountType: updated.discountType,
    discountValue: parseFloat(updated.discountValue),
    minOrderAmount: parseFloat(updated.minOrderAmount),
    maxUses: updated.maxUses ?? null,
    usedCount: updated.usedCount,
    expiresAt: updated.expiresAt?.toISOString() ?? null,
    isActive: updated.isActive,
    createdAt: updated.createdAt.toISOString(),
  });
});

router.delete("/promos/:id", requireAdmin, async (req, res): Promise<void> => {
  const id = parseInt(req.params.id as string);
  const [existing] = await db.select().from(promoCodesTable).where(eq(promoCodesTable.id, id));
  if (!existing) { res.status(404).json({ error: "Promo code not found" }); return; }
  await db.delete(promoCodesTable).where(eq(promoCodesTable.id, id));
  res.json({ success: true });
});

export default router;
