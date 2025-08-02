import { logEnvConfigStatus } from "@/server/instrumentation/envLogger";

/**
 * This won't work unless you host this as an actual server,
 * which is highly recommended.
 */
export async function register() {
  const { serverEnv } = await import("@/env");
  await import("@/env/client");

  if (process.env.NEXT_RUNTIME === "nodejs") {
    const serverTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    console.log("🗓️ Date:", new Date());
    console.log("🕛 Server Timezone:", serverTimezone);

    logEnvConfigStatus();

    if (serverEnv.NEXT_PUBLIC_ENABLE_CRON === true) {
      const { startMainCron } =
        await require("./src/server/instrumentation/cron/scripts/main-cron");
      startMainCron();
    }

    if (serverEnv.NEXT_PUBLIC_ENABLE_BACKGROUND_JOBS) {
      const { startWorker } =
        await require("./src/server/instrumentation/bull/worker");
      console.log("🔄 Redis worker starting...");
      startWorker();
    }
  }
}
