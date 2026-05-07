import { Router } from "express";
import { db } from "@workspace/db";
import { nonprofitRequestsTable, productsTable, usersTable } from "@workspace/db/schema";
import { eq, desc } from "drizzle-orm";
import { requireAuth, requireAdmin } from "../lib/auth";

const router = Router();

function makeSlug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") + "-donation";
}

router.post("/nonprofit-requests", requireAuth, async (req, res): Promise<void> => {
  const user = (req as any).user;
  const { orgName, orgType, ein, website, description } = req.body;

  if (!orgName || typeof orgName !== "string" || orgName.trim().length < 2) {
    res.status(400).json({ error: "Organization name is required" });
    return;
  }

  const existing = await db
    .select()
    .from(nonprofitRequestsTable)
    .where(eq(nonprofitRequestsTable.userId, user.id))
    .limit(1);

  if (existing.length > 0 && existing[0].status === "pending") {
    res.status(409).json({ error: "You already have a pending nonprofit request" });
    return;
  }

  const [created] = await db
    .insert(nonprofitRequestsTable)
    .values({
      userId: user.id,
      orgName: orgName.trim(),
      orgType: orgType === "church" ? "church" : "nonprofit",
      ein: ein?.trim() || null,
      website: website?.trim() || null,
      description: description?.trim() || null,
      status: "pending",
    })
    .returning();

  res.status(201).json(created);
});

router.get("/nonprofit-requests/me", requireAuth, async (req, res): Promise<void> => {
  const user = (req as any).user;
  const requests = await db
    .select()
    .from(nonprofitRequestsTable)
    .where(eq(nonprofitRequestsTable.userId, user.id))
    .orderBy(desc(nonprofitRequestsTable.createdAt));
  res.json(requests);
});

router.get("/nonprofit-requests", requireAdmin, async (req, res): Promise<void> => {
  const rows = await db
    .select({
      id: nonprofitRequestsTable.id,
      userId: nonprofitRequestsTable.userId,
      orgName: nonprofitRequestsTable.orgName,
      orgType: nonprofitRequestsTable.orgType,
      ein: nonprofitRequestsTable.ein,
      website: nonprofitRequestsTable.website,
      description: nonprofitRequestsTable.description,
      status: nonprofitRequestsTable.status,
      adminNote: nonprofitRequestsTable.adminNote,
      donationProductId: nonprofitRequestsTable.donationProductId,
      createdAt: nonprofitRequestsTable.createdAt,
      userName: usersTable.firstName,
      userLastName: usersTable.lastName,
      userEmail: usersTable.email,
      userRole: usersTable.role,
    })
    .from(nonprofitRequestsTable)
    .leftJoin(usersTable, eq(nonprofitRequestsTable.userId, usersTable.id))
    .orderBy(desc(nonprofitRequestsTable.createdAt));

  res.json(rows);
});

router.patch("/nonprofit-requests/:id", requireAdmin, async (req, res): Promise<void> => {
  const id = parseInt(req.params.id as string);
  const { status, adminNote } = req.body;

  if (!["approved", "rejected"].includes(status)) {
    res.status(400).json({ error: "Status must be approved or rejected" });
    return;
  }

  const [request] = await db
    .select()
    .from(nonprofitRequestsTable)
    .where(eq(nonprofitRequestsTable.id, id))
    .limit(1);

  if (!request) {
    res.status(404).json({ error: "Request not found" });
    return;
  }

  let donationProductId = request.donationProductId;

  if (status === "approved" && !donationProductId) {
    const slug = makeSlug(request.orgName);
    const isChurch = request.orgType === "church";

    const [product] = await db
      .insert(productsTable)
      .values({
        name: request.orgName,
        slug,
        description: request.description || `Support ${request.orgName} through NFGN. Your gift makes a direct impact.`,
        price: "10.00",
        stock: 999999,
        isDonation: true,
        isChurchDonation: isChurch,
        isNonProfit: true,
        giftCharityPercent: "80.00",
        donationMinAmount: "10.00",
        donationRecipientName: isChurch ? null : request.orgName,
        churchName: isChurch ? request.orgName : null,
        status: "active",
      } as any)
      .returning({ id: productsTable.id });

    donationProductId = product.id;
  }

  const [updated] = await db
    .update(nonprofitRequestsTable)
    .set({
      status,
      adminNote: adminNote?.trim() || null,
      donationProductId,
      updatedAt: new Date(),
    })
    .where(eq(nonprofitRequestsTable.id, id))
    .returning();

  res.json(updated);
});

export default router;
