import { createTRPCRouter, adminProcedure } from "@/server/api/trpc";

const OTHER_ENV_KEYS = [
  "COOLIFY_FQDN",
  "COOLIFY_URL",
  "COOLIFY_BRANCH",
  "COOLIFY_RESOURCE_UUID",
  "COOLIFY_CONTAINER_NAME",
  "SOURCE_COMMIT",
  "PORT",
  "HOST",
  // Additional deployment env vars
  "VERCEL_URL",
  "RAILWAY_PUBLIC_DOMAIN",
  "RENDER_EXTERNAL_URL",
] as const;

type OtherKeys = (typeof OTHER_ENV_KEYS)[number];

export const adminRouter = createTRPCRouter({
  getEnvVars: adminProcedure.query(() => {
    // Collect Coolify related vars directly from process.env
    const serverEnvs: Record<OtherKeys, string | undefined> =
      OTHER_ENV_KEYS.reduce(
        (acc, key) => {
          acc[key] = process.env[key];
          return acc;
        },
        {} as Record<OtherKeys, string | undefined>,
      );

    return serverEnvs;
  }),
});
