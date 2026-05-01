import { db, ordersTable, orderItemsTable, usersTable } from "@workspace/db";
import { eq, and, isNull, lt, sql } from "drizzle-orm";
import { sendEmail, codReminderMemberHtml, codReminderCorporateHtml } from "./mailer";
import { logger } from "./logger";

const CORPORATE_EMAIL = process.env.CORPORATE_EMAIL ?? "Joemarcelino99@gmail.com";
const SITE_URL = process.env.FRONTEND_URL ?? "https://nfgn.replit.app";
const POLL_INTERVAL_MS = 5 * 60 * 1000; // check every 5 minutes
const REMINDER_DELAY_MS = 24 * 60 * 60 * 1000; // 24 hours

async function runCodReminderCheck() {
  try {
    const cutoff = new Date(Date.now() - REMINDER_DELAY_MS);

    const overdueOrders = await db
      .select()
      .from(ordersTable)
      .where(
        and(
          eq(ordersTable.paymentMethod, "cod"),
          eq(ordersTable.paymentStatus, "not_received"),
          isNull(ordersTable.codReminderSentAt),
          lt(ordersTable.createdAt, cutoff),
        ),
      );

    if (overdueOrders.length === 0) return;

    logger.info({ count: overdueOrders.length }, "COD reminder: processing overdue orders");

    for (const order of overdueOrders) {
      try {
        const [member] = await db
          .select()
          .from(usersTable)
          .where(eq(usersTable.id, order.userId));

        const items = await db
          .select()
          .from(orderItemsTable)
          .where(eq(orderItemsTable.orderId, order.id));

        if (!member) continue;

        const memberName = `${member.firstName} ${member.lastName}`;
        const itemsSummary = items
          .map((i) => `${i.productName} x${i.quantity}`)
          .join(", ") || "See order details";
        const total = parseFloat(String(order.total)).toFixed(2);
        const placedAt = new Date(order.createdAt).toLocaleString("en-US", {
          dateStyle: "medium",
          timeStyle: "short",
        });

        await sendEmail({
          to: member.email,
          subject: `Action Required: COD Payment for Order ${order.orderNumber}`,
          html: codReminderMemberHtml({
            memberName,
            orderNumber: order.orderNumber,
            orderId: order.id,
            total,
            items: itemsSummary,
            dashboardUrl: `${SITE_URL}/dashboard/orders`,
          }),
        });

        await sendEmail({
          to: CORPORATE_EMAIL,
          subject: `COD Order 24hr Reminder — ${order.orderNumber} (${memberName})`,
          html: codReminderCorporateHtml({
            memberName,
            memberEmail: member.email,
            orderNumber: order.orderNumber,
            orderId: order.id,
            total,
            items: itemsSummary,
            placedAt,
            adminUrl: `${SITE_URL}/admin/orders`,
          }),
        });

        await db
          .update(ordersTable)
          .set({ codReminderSentAt: new Date() })
          .where(eq(ordersTable.id, order.id));

        logger.info({ orderId: order.id, memberEmail: member.email }, "COD reminder sent");
      } catch (err) {
        logger.error({ err, orderId: order.id }, "COD reminder failed for order");
      }
    }
  } catch (err) {
    logger.error({ err }, "COD reminder check failed");
  }
}

export function startCodReminderJob() {
  runCodReminderCheck();
  setInterval(runCodReminderCheck, POLL_INTERVAL_MS);
  logger.info({ intervalMs: POLL_INTERVAL_MS }, "COD reminder job started");
}
