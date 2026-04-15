import { Router, type IRouter } from "express";
import { db, usersTable, walletsTable, genealogyNodesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { hashPassword, verifyPassword, generateToken, generateReferralCode, requireAuth } from "../lib/auth";
import { LoginBody, RegisterBody } from "@workspace/api-zod";

const router: IRouter = Router();

function formatUser(user: typeof usersTable.$inferSelect) {
  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role,
    status: user.status,
    referralCode: user.referralCode,
    sponsorId: user.sponsorId,
    avatar: user.avatar,
    phone: user.phone,
    isProMember: user.isProMember,
    createdAt: user.createdAt.toISOString(),
  };
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
  }).returning();

  await db.insert(walletsTable).values({ userId: newUser.id });

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

  const token = generateToken(newUser.id, newUser.role);
  res.status(201).json({ token, user: formatUser(newUser) });
});

router.post("/auth/logout", async (_req, res): Promise<void> => {
  res.json({ success: true });
});

router.get("/auth/me", requireAuth, async (req, res): Promise<void> => {
  const user = (req as typeof req & { user: typeof usersTable.$inferSelect }).user;
  res.json(formatUser(user));
});

export default router;
