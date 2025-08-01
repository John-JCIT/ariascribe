import cron from "node-cron";

export const startMainCron = () => {
  // Schedule a task to run every minute
  cron.schedule("* * * * *", () => {
    console.log("⏰ Cron job running every minute");
  });

  console.log("🕰️ Main cron job scheduler started.");
};
