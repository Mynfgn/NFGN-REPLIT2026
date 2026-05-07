import { db, bannerMessagesTable } from "@workspace/db";
import { logger } from "./logger";

const DEFAULT_BANNER_MESSAGES = [
  "Find out how you can \"GET PAID TO LOSE WEIGHT!\"",
  "Become A Member For FREE!",
  "SALE!! 1 Month Free Pro Membership with the purchase of IGNITE PRO XL.",
];

export async function seedBannerMessages(): Promise<void> {
  const existing = await db.select().from(bannerMessagesTable).limit(1);
  if (existing.length > 0) {
    return;
  }

  await db.insert(bannerMessagesTable).values(
    DEFAULT_BANNER_MESSAGES.map((message, index) => ({
      message,
      isActive: true,
      sortOrder: index,
    }))
  );

  logger.info({ count: DEFAULT_BANNER_MESSAGES.length }, "Seeded default banner messages");
}
