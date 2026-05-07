import app from "./app";
import { logger } from "./lib/logger";
import { startCodReminderJob } from "./lib/codReminder";
import { startBookingReminderJob } from "./lib/bookingReminder";
import { seedBannerMessages } from "./lib/seedBanners";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

app.listen(port, (err) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }

  logger.info({ port }, "Server listening");
  startCodReminderJob();
  startBookingReminderJob();
  seedBannerMessages().catch((seedErr) =>
    logger.error({ err: seedErr }, "Failed to seed banner messages")
  );
});
