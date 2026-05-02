import { db, bookingsTable, professionalsTable, usersTable } from "@workspace/db";
import { eq, and, isNull, gte, lte, or } from "drizzle-orm";
import { sendEmail, booking8hrReminderHtml } from "./mailer";
import { logger } from "./logger";

const CORPORATE_EMAIL = process.env.CORPORATE_EMAIL ?? "Mynfgn@gmail.com";
const DASHBOARD_URL = process.env.APP_URL ? `${process.env.APP_URL}/dashboard/bookings` : "https://nfgn.com/dashboard/bookings";
const ADMIN_URL = process.env.APP_URL ? `${process.env.APP_URL}/admin/bookings` : "https://nfgn.com/admin/bookings";
const POLL_INTERVAL_MS = 5 * 60 * 1000;

async function runBookingReminderCheck() {
  try {
    const now = new Date();
    const windowStart = new Date(now.getTime() + 7.5 * 60 * 60 * 1000); // 7.5 hrs from now
    const windowEnd = new Date(now.getTime() + 8.5 * 60 * 60 * 1000);   // 8.5 hrs from now

    const upcoming = await db
      .select()
      .from(bookingsTable)
      .where(
        and(
          isNull(bookingsTable.reminder8hrSentAt),
          gte(bookingsTable.scheduledAt, windowStart),
          lte(bookingsTable.scheduledAt, windowEnd),
        ),
      );

    if (upcoming.length === 0) return;

    logger.info({ count: upcoming.length }, "Booking 8hr reminder: processing");

    for (const booking of upcoming) {
      try {
        const [member] = await db.select().from(usersTable).where(eq(usersTable.id, booking.userId));
        const [proRow] = await db.select().from(professionalsTable).where(eq(professionalsTable.id, booking.professionalId));

        let providerUser: typeof usersTable.$inferSelect | null = null;
        if (proRow?.userId) {
          const [pu] = await db.select().from(usersTable).where(eq(usersTable.id, proRow.userId));
          providerUser = pu ?? null;
        }

        let sponsorUser: typeof usersTable.$inferSelect | null = null;
        if (member?.sponsorId ?? booking.referralUserId) {
          const sponsorId = booking.referralUserId ?? member?.sponsorId;
          if (sponsorId) {
            const [su] = await db.select().from(usersTable).where(eq(usersTable.id, sponsorId));
            sponsorUser = su ?? null;
          }
        }

        const admins = await db.select().from(usersTable).where(
          or(eq(usersTable.role, "super_admin"), eq(usersTable.role, "admin")),
        );

        const memberName = member ? `${member.firstName} ${member.lastName}` : "Member";
        const providerName = proRow?.name ?? "Professional";
        const memberEmail = member?.email ?? "";
        const memberPhone = member?.phone ?? undefined;
        const providerEmail = providerUser?.email ?? "";
        const providerPhone = providerUser?.phone ?? undefined;
        const scheduledAt = new Date(booking.scheduledAt).toLocaleString("en-US", { dateStyle: "full", timeStyle: "short" });

        const sharedOpts = {
          memberName, memberEmail, memberPhone,
          providerName, providerEmail, providerPhone,
          serviceType: booking.serviceType,
          scheduledAt,
          duration: booking.duration,
          bookingId: booking.id,
          dashboardUrl: DASHBOARD_URL,
        };

        const emails: Promise<void>[] = [];

        if (memberEmail) {
          emails.push(sendEmail({
            to: memberEmail,
            subject: `Reminder: Your Appointment is in 8 Hours — ${booking.serviceType}`,
            html: booking8hrReminderHtml({ ...sharedOpts, recipientName: memberName, role: "member" }),
          }));
        }

        if (providerEmail) {
          emails.push(sendEmail({
            to: providerEmail,
            subject: `Reminder: Appointment in 8 Hours — ${memberName}`,
            html: booking8hrReminderHtml({ ...sharedOpts, recipientName: providerName, role: "provider", dashboardUrl: DASHBOARD_URL }),
          }));
        }

        if (sponsorUser?.email) {
          emails.push(sendEmail({
            to: sponsorUser.email,
            subject: `Downline Appointment Reminder — ${memberName} has a session in 8 hours`,
            html: booking8hrReminderHtml({ ...sharedOpts, recipientName: `${sponsorUser.firstName} ${sponsorUser.lastName}`, role: "sponsor" }),
          }));
        }

        for (const admin of admins) {
          if (admin.email) {
            emails.push(sendEmail({
              to: admin.email,
              subject: `[NFGN] 8hr Appointment Reminder — ${memberName} with ${providerName}`,
              html: booking8hrReminderHtml({ ...sharedOpts, recipientName: `${admin.firstName} ${admin.lastName}`, role: "admin", dashboardUrl: ADMIN_URL }),
            }));
          }
        }

        await Promise.allSettled(emails);

        await db
          .update(bookingsTable)
          .set({ reminder8hrSentAt: new Date() })
          .where(eq(bookingsTable.id, booking.id));

        logger.info({ bookingId: booking.id }, "8hr booking reminder sent");
      } catch (err) {
        logger.error({ err, bookingId: booking.id }, "8hr reminder failed for booking");
      }
    }
  } catch (err) {
    logger.error({ err }, "Booking reminder check failed");
  }
}

export function startBookingReminderJob() {
  runBookingReminderCheck();
  setInterval(runBookingReminderCheck, POLL_INTERVAL_MS);
  logger.info({ intervalMs: POLL_INTERVAL_MS }, "Booking 8hr reminder job started");
}
