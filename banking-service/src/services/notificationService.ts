import { logger } from "../config/logger";

export function sendNotification(accountId: string, message: string) {
  // In a real implementation it'd be a notification
  logger.info("Sending notification", {
    message,
    accountId,
  });
}
