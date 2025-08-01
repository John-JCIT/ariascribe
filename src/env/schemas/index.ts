import { z } from "zod";
import * as authSchemas from "./auth";
import * as githubSchemas from "./github";
import * as emailSchema from "./email";
import * as generalSchemas from "./general";
import * as polarSchemas from "./polar";
import * as uploadThingSchemas from "./uploadthing";
import * as redisSchemas from "./redis";

export const clientSchema = z
  .object({})
  .merge(githubSchemas.clientSchema)
  .merge(authSchemas.clientSchema)
  .merge(redisSchemas.clientSchema)
  .merge(emailSchema.clientSchema)
  .merge(generalSchemas.clientSchema)
  .merge(polarSchemas.clientSchema)
  .merge(uploadThingSchemas.clientSchema);

export const clientEnvRaw: {
  [k in keyof z.infer<typeof clientSchema>]: string | undefined;
} = {
  NODE_ENV: process.env.NODE_ENV,
  NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME,
  NEXT_PUBLIC_APP_DESCRIPTION: process.env.NEXT_PUBLIC_APP_DESCRIPTION,
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  NEXT_PUBLIC_ENABLE_GITHUB_INTEGRATION:
    process.env.NEXT_PUBLIC_ENABLE_GITHUB_INTEGRATION,
  NEXT_PUBLIC_EMAIL_PROVIDER: process.env.NEXT_PUBLIC_EMAIL_PROVIDER,
  NEXT_PUBLIC_EMAIL_ENABLE_EMAIL_PREVIEW:
    process.env.NEXT_PUBLIC_EMAIL_ENABLE_EMAIL_PREVIEW,
  NEXT_PUBLIC_ENABLE_POLAR: process.env.NEXT_PUBLIC_ENABLE_POLAR,
  NEXT_PUBLIC_POLAR_ENV: process.env.NEXT_PUBLIC_POLAR_ENV,
  NEXT_PUBLIC_ENABLE_UPLOADTHING: process.env.NEXT_PUBLIC_ENABLE_UPLOADTHING,
  NEXT_PUBLIC_ENABLE_BACKGROUND_JOBS:
    process.env.NEXT_PUBLIC_ENABLE_BACKGROUND_JOBS,
  NEXT_PUBLIC_ENABLE_CRON: process.env.NEXT_PUBLIC_ENABLE_CRON,
  NEXT_PUBLIC_EMAIL_PREVIEW_OPEN_TAB:
    process.env.NEXT_PUBLIC_EMAIL_PREVIEW_OPEN_TAB,
  NEXT_PUBLIC_EMAIL_PREVIEW_OPEN_SIMULATOR:
    process.env.NEXT_PUBLIC_EMAIL_PREVIEW_OPEN_SIMULATOR,
  NEXT_PUBLIC_UPLOADTHING_URL_ROOT:
    process.env.NEXT_PUBLIC_UPLOADTHING_URL_ROOT,
  NEXT_PUBLIC_ENABLE_BLOG_PAGE: process.env.NEXT_PUBLIC_ENABLE_BLOG_PAGE,
  NEXT_PUBLIC_ENABLE_ABOUT_PAGE: process.env.NEXT_PUBLIC_ENABLE_ABOUT_PAGE,
  NEXT_PUBLIC_ENABLE_CHAT_PAGE: process.env.NEXT_PUBLIC_ENABLE_CHAT_PAGE,
  NEXT_PUBLIC_ENABLE_PRICING_PAGE: process.env.NEXT_PUBLIC_ENABLE_PRICING_PAGE,
  NEXT_PUBLIC_AUTH_ENABLE_EMAIL_VERIFICATION:
    process.env.NEXT_PUBLIC_AUTH_ENABLE_EMAIL_VERIFICATION,
  NEXT_PUBLIC_AUTH_ENABLE_EMAIL_PASSWORD_AUTHENTICATION:
    process.env.NEXT_PUBLIC_AUTH_ENABLE_EMAIL_PASSWORD_AUTHENTICATION,
};

export const serverSchema = clientSchema
  .merge(generalSchemas.serverSchema)
  .and(emailSchema.serverSchema)
  .and(githubSchemas.serverSchema)
  .and(authSchemas.serverSchema)
  .and(polarSchemas.serverSchema)
  .and(uploadThingSchemas.serverSchema)
  .and(redisSchemas.serverSchema)
  // 1a. Email Verification Check (Production)
  .refine(
    (env) => {
      if (
        process.env.NODE_ENV !== "production" ||
        !env.NEXT_PUBLIC_AUTH_ENABLE_EMAIL_VERIFICATION
      ) {
        return true;
      }
      return env.NEXT_PUBLIC_EMAIL_PROVIDER !== "none";
    },
    {
      message:
        "Error: Email verification is enabled (NEXT_PUBLIC_AUTH_ENABLE_EMAIL_VERIFICATION), but no email provider is configured (NEXT_PUBLIC_EMAIL_PROVIDER='none').",
    },
  )
  // 1b. Email Verification Check (Development)
  .refine(
    (env) => {
      if (
        process.env.NODE_ENV !== "development" ||
        !env.NEXT_PUBLIC_AUTH_ENABLE_EMAIL_VERIFICATION
      ) {
        return true;
      }
      return (
        env.NEXT_PUBLIC_EMAIL_PROVIDER !== "none" ||
        env.NEXT_PUBLIC_EMAIL_ENABLE_EMAIL_PREVIEW
      );
    },
    {
      message:
        "Error: Email verification is enabled (NEXT_PUBLIC_AUTH_ENABLE_EMAIL_VERIFICATION), but no email provider is configured (NEXT_PUBLIC_EMAIL_PROVIDER='none') and email preview is disabled (NEXT_PUBLIC_EMAIL_ENABLE_EMAIL_PREVIEW=false).",
    },
  )
  // 2. Check if there's at least one sign-up method (Prod)
  .refine(
    (env) => {
      if (process.env.NODE_ENV !== "production") {
        return true;
      }
      const hasGithub = env.NEXT_PUBLIC_ENABLE_GITHUB_INTEGRATION;
      const hasEmailPassword =
        env.NEXT_PUBLIC_AUTH_ENABLE_EMAIL_PASSWORD_AUTHENTICATION &&
        env.NEXT_PUBLIC_EMAIL_PROVIDER !== "none";

      if (!hasGithub && !hasEmailPassword) {
        return false;
      }
      return true;
    },
    {
      message:
        "Production mode requires at least one sign-up method: enable GitHub integration (NEXT_PUBLIC_ENABLE_GITHUB_INTEGRATION) or Email/Password authentication (NEXT_PUBLIC_AUTH_ENABLE_EMAIL_PASSWORD_AUTHENTICATION)",
    },
  )
  // 3. Check if there's at least one sign-up method (Dev)
  .refine(
    (env) => {
      if (process.env.NODE_ENV !== "development") {
        return true;
      }
      const hasGithub = env.NEXT_PUBLIC_ENABLE_GITHUB_INTEGRATION;
      const hasEmailPassword =
        env.NEXT_PUBLIC_AUTH_ENABLE_EMAIL_PASSWORD_AUTHENTICATION &&
        (env.NEXT_PUBLIC_EMAIL_PROVIDER !== "none" ||
          env.NEXT_PUBLIC_EMAIL_ENABLE_EMAIL_PREVIEW);

      if (!hasGithub && !hasEmailPassword) {
        return false;
      }
      return true;
    },
    {
      message:
        "Development mode requires at least one sign-up method: enable GitHub integration (NEXT_PUBLIC_ENABLE_GITHUB_INTEGRATION) or Email/Password authentication (NEXT_PUBLIC_AUTH_ENABLE_EMAIL_PASSWORD_AUTHENTICATION)",
    },
  );
