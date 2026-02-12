// utils/scheduler.ts
import { updateSaleNotifications } from "./saleNotificationUtils";
import cron from "node-cron";

// Run every day at midnight
cron.schedule('0 0 * * *', async () => {
  console.log("Running daily sale notification update...");
  try {
    await updateSaleNotifications();
    console.log("Sale notifications updated successfully");
  } catch (error) {
    console.error("Failed to update sale notifications:", error);
  }
});