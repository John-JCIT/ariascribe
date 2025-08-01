import { serverEnv } from "@/env";

const getEnabledDisabledStatus = (isEnabled: boolean) =>
  isEnabled ? "enabled" : "disabled";

const logVariable = (envFlag: boolean, description: string, indent = "") => {
  const statusIcon = envFlag ? "🟢" : "⚪️";
  const statusText = getEnabledDisabledStatus(envFlag);
  console.log(`${indent}${statusIcon} ${description} ${statusText}`);
};

const logBooleanSetting = (
  envFlag: boolean,
  description: string,
  indent = "|   ",
) => {
  const statusIcon = envFlag ? "✅" : "❌";
  console.log(`${indent}${statusIcon} ${description}`);
};

const logSetting = (
  value: string,
  description: string,
  indent = "|   ",
  icon = "➡️",
) => {
  console.log(`${indent}${icon} ${description}: ${value}`);
};

export function logEnvConfigStatus() {
  console.log("\n🔧 Environment Configuration Status:");

  // --- General ---
  console.log("\n⚙️ General");
  logBooleanSetting(
    serverEnv.ENABLE_ARTIFICIAL_TRPC_DELAY,
    "Artificial tRPC delay",
    "|_  ",
  );

  // --- Auth ---
  console.log("\n🔑 Auth");
  logBooleanSetting(
    serverEnv.NEXT_PUBLIC_AUTH_ENABLE_EMAIL_PASSWORD_AUTHENTICATION,
    "Email/Password auth",
    "|_  ",
  );
  logBooleanSetting(
    serverEnv.AUTH_AUTO_SIGN_IN_AFTER_VERIFICATION,
    "Auto sign-in after verification",
    "|_  ",
  );
  logBooleanSetting(
    serverEnv.NEXT_PUBLIC_AUTH_ENABLE_EMAIL_VERIFICATION,
    "Email verification required",
    "|_  ",
  );
  // Note: AUTH_AUTO_SIGN_IN_AFTER_VERIFICATION logged above
  logBooleanSetting(
    serverEnv.AUTH_ENABLE_CHANGE_EMAIL,
    "Enable email change",
    "|_  ",
  );
  // --- Email ---
  console.log("\n📧 Email");
  logSetting(
    serverEnv.NEXT_PUBLIC_EMAIL_PROVIDER,
    "Provider",
    "|_  ",
    serverEnv.NEXT_PUBLIC_EMAIL_PROVIDER === "none" ? "❌" : "➡️",
  );
  logBooleanSetting(
    serverEnv.NEXT_PUBLIC_EMAIL_ENABLE_EMAIL_PREVIEW,
    "Enable email preview",
    "|_  ",
  );
  if (serverEnv.NEXT_PUBLIC_EMAIL_ENABLE_EMAIL_PREVIEW) {
    logBooleanSetting(
      serverEnv.NEXT_PUBLIC_EMAIL_PREVIEW_OPEN_TAB,
      "Open preview in new tab",
      "|   |_  ",
    );
    logBooleanSetting(
      serverEnv.NEXT_PUBLIC_EMAIL_PREVIEW_OPEN_SIMULATOR,
      "Open simulator",
      "|   |_  ",
    );
  }

  // --- Integrations ---
  console.log("\n🔌 Integrations");
  const integrationIndent = "  ";
  logVariable(
    serverEnv.NEXT_PUBLIC_ENABLE_POLAR,
    "Polar payments",
    integrationIndent,
  );
  if (serverEnv.NEXT_PUBLIC_ENABLE_POLAR) {
    logBooleanSetting(
      serverEnv.POLAR_CREATE_CUSTOMER_ON_SIGNUP,
      "Create customer on signup",
      `${integrationIndent}|_  `,
    );
    logBooleanSetting(
      serverEnv.POLAR_ENABLE_CUSTOMER_PORTAL,
      "Customer portal",
      `${integrationIndent}|_  `,
    );
    logBooleanSetting(
      serverEnv.POLAR_ENABLE_CHECKOUT,
      "Checkout",
      `${integrationIndent}|_  `,
    );

    // Log environment (sandbox/prod) just before environment-specific settings
    logSetting(
      serverEnv.NEXT_PUBLIC_POLAR_ENV,
      "Environment",
      `${integrationIndent}|_  `,
      "🌐",
    );

    const webhooksEnabled =
      serverEnv.NEXT_PUBLIC_POLAR_ENV === "sandbox"
        ? !!serverEnv.POLAR_WEBHOOK_SECRET_SANDBOX
        : !!serverEnv.POLAR_WEBHOOK_SECRET_PROD;
    const webhookStatusIcon = webhooksEnabled ? "🟡" : "⚪️";
    console.log(
      `${integrationIndent}|_  ${webhookStatusIcon} Webhooks configured (optional)`,
    );
  }

  logVariable(
    serverEnv.NEXT_PUBLIC_ENABLE_BACKGROUND_JOBS,
    "Background jobs",
    integrationIndent,
  );
  logVariable(
    serverEnv.NEXT_PUBLIC_ENABLE_GITHUB_INTEGRATION,
    "GitHub integration",
    integrationIndent,
  );
  logVariable(
    serverEnv.NEXT_PUBLIC_ENABLE_UPLOADTHING,
    "UploadThing",
    integrationIndent,
  );
  logVariable(
    serverEnv.NEXT_PUBLIC_ENABLE_CRON,
    "Cron jobs",
    integrationIndent,
  );

  // --- Pages ---
  console.log("\n📄 Enabled Pages");
  const pageIndent = "  ";
  logVariable(serverEnv.NEXT_PUBLIC_ENABLE_BLOG_PAGE, "Blog Page", pageIndent);
  logVariable(
    serverEnv.NEXT_PUBLIC_ENABLE_ABOUT_PAGE,
    "About Page",
    pageIndent,
  );
  logVariable(serverEnv.NEXT_PUBLIC_ENABLE_CHAT_PAGE, "Chat Page", pageIndent);
  logVariable(
    serverEnv.NEXT_PUBLIC_ENABLE_PRICING_PAGE,
    "Pricing Page",
    pageIndent,
  );
}
