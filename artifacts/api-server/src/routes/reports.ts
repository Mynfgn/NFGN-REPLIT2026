import { Router } from "express";
import { db } from "@workspace/db";
import {
  ordersTable,
  orderItemsTable,
  commissionsTable,
  usersTable,
} from "@workspace/db/schema";
import { and, eq, gte, ne, sum, count, desc, sql, inArray } from "drizzle-orm";
import { requireAdmin } from "../lib/auth";

const router = Router();

// ── Helper: last 30 days date range ──────────────────────────────────────────
function last30Start(): Date {
  const d = new Date();
  d.setDate(d.getDate() - 29);
  d.setHours(0, 0, 0, 0);
  return d;
}

// ── GET /reports/sales ────────────────────────────────────────────────────────
router.get("/reports/sales", requireAdmin, async (_req, res): Promise<void> => {
  const since = last30Start();

  // All-time totals (non-cancelled / non-refunded)
  const validStatuses = ["pending", "processing", "completed"];

  const [totals] = await db
    .select({
      totalRevenue: sum(ordersTable.total),
      totalOrders: count(ordersTable.id),
    })
    .from(ordersTable)
    .where(inArray(ordersTable.status, validStatuses));

  const totalRevenue = parseFloat(totals.totalRevenue ?? "0");
  const totalOrders = Number(totals.totalOrders ?? 0);
  const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  // Daily sales for last 30 days — raw SQL for date truncation
  const dailyRows = await db.execute(sql`
    SELECT
      TO_CHAR(created_at AT TIME ZONE 'UTC', 'YYYY-MM-DD') AS date,
      COUNT(*)::int AS orders,
      COALESCE(SUM(total), 0)::float AS revenue
    FROM orders
    WHERE created_at >= ${since}
      AND status = ANY(ARRAY['pending','processing','completed'])
    GROUP BY date
    ORDER BY date ASC
  `);

  // Build a full 30-day calendar with 0-fills
  const dailyMap: Record<string, { orders: number; revenue: number }> = {};
  for (const row of dailyRows.rows as any[]) {
    dailyMap[row.date] = { orders: row.orders, revenue: row.revenue };
  }
  const data: { date: string; orders: number; revenue: number }[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().slice(0, 10);
    data.push({ date: dateStr, orders: dailyMap[dateStr]?.orders ?? 0, revenue: dailyMap[dateStr]?.revenue ?? 0 });
  }

  // Top products by revenue (all-time)
  const topProductRows = await db.execute(sql`
    SELECT
      oi.product_name AS name,
      SUM(oi.quantity)::int AS quantity,
      COALESCE(SUM(oi.total), 0)::float AS revenue
    FROM order_items oi
    JOIN orders o ON o.id = oi.order_id
    WHERE o.status = ANY(ARRAY['pending','processing','completed'])
    GROUP BY oi.product_name
    ORDER BY revenue DESC
    LIMIT 10
  `);

  const topProducts = (topProductRows.rows as any[]).map(r => ({
    name: r.name,
    quantity: r.quantity,
    revenue: r.revenue,
  }));

  res.json({ totalRevenue, totalOrders, averageOrderValue, data, topProducts });
});

// ── GET /reports/commissions ──────────────────────────────────────────────────
router.get("/reports/commissions", requireAdmin, async (_req, res): Promise<void> => {
  const since = last30Start();

  // All-time totals
  const [all] = await db
    .select({ total: sum(commissionsTable.commissionAmount) })
    .from(commissionsTable);

  const [pending] = await db
    .select({ total: sum(commissionsTable.commissionAmount) })
    .from(commissionsTable)
    .where(eq(commissionsTable.status, "pending"));

  const [paid] = await db
    .select({ total: sum(commissionsTable.commissionAmount) })
    .from(commissionsTable)
    .where(inArray(commissionsTable.status, ["paid", "approved"]));

  // Daily commissions for last 30 days
  const dailyRows = await db.execute(sql`
    SELECT
      TO_CHAR(created_at AT TIME ZONE 'UTC', 'YYYY-MM-DD') AS date,
      COUNT(*)::int AS count,
      COALESCE(SUM(commission_amount), 0)::float AS amount
    FROM commissions
    WHERE created_at >= ${since}
    GROUP BY date
    ORDER BY date ASC
  `);

  const dailyMap: Record<string, { count: number; amount: number }> = {};
  for (const row of dailyRows.rows as any[]) {
    dailyMap[row.date] = { count: row.count, amount: row.amount };
  }
  const data: { date: string; count: number; amount: number }[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().slice(0, 10);
    data.push({ date: dateStr, count: dailyMap[dateStr]?.count ?? 0, amount: dailyMap[dateStr]?.amount ?? 0 });
  }

  res.json({
    totalCommissions: parseFloat(all.total ?? "0"),
    pendingCommissions: parseFloat(pending.total ?? "0"),
    paidCommissions: parseFloat(paid.total ?? "0"),
    data,
  });
});

// ── GET /reports/top-affiliates ───────────────────────────────────────────────
router.get("/reports/top-affiliates", requireAdmin, async (_req, res): Promise<void> => {
  // Aggregated earnings per user from commissions
  const earningsRows = await db.execute(sql`
    SELECT
      u.id,
      u.first_name || ' ' || u.last_name AS name,
      u.email,
      u.is_pro_member,
      COALESCE(SUM(c.commission_amount), 0)::float AS total_earnings
    FROM users u
    LEFT JOIN commissions c ON c.user_id = u.id
    WHERE u.role IN ('pro_member', 'affiliate', 'admin', 'super_admin')
    GROUP BY u.id, u.first_name, u.last_name, u.email, u.is_pro_member
    HAVING COALESCE(SUM(c.commission_amount), 0) > 0
    ORDER BY total_earnings DESC
    LIMIT 20
  `);

  const affiliates = earningsRows.rows as any[];

  if (affiliates.length === 0) {
    res.json([]);
    return;
  }

  // Get team size (direct downline count) for each affiliate
  const userIds = affiliates.map((a: any) => a.id);
  const teamSizeRows = await db.execute(sql`
    SELECT sponsor_id, COUNT(*)::int AS team_size
    FROM users
    WHERE sponsor_id = ANY(${sql`ARRAY[${sql.join(userIds.map(id => sql`${id}`), sql`, `)}]::int[]`})
    GROUP BY sponsor_id
  `);

  const teamMap: Record<number, number> = {};
  for (const row of teamSizeRows.rows as any[]) {
    teamMap[row.sponsor_id] = row.team_size;
  }

  const result = affiliates.map((a: any, idx: number) => ({
    id: a.id,
    name: a.name,
    email: a.email,
    isProMember: a.is_pro_member,
    totalEarnings: a.total_earnings,
    teamSize: teamMap[a.id] ?? 0,
    rank: idx + 1,
  }));

  res.json(result);
});

export default router;
