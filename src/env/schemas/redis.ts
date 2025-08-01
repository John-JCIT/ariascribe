import { z } from "zod";
import { zStringToBool, zTrue, zFalse } from "./utils";

const redisServerSchemaBase = z.object({
  REDIS_HOST: z.string().optional(),
  REDIS_PORT: z.coerce.number().optional(),
  REDIS_USERNAME: z.string().optional(),
  REDIS_PASSWORD: z.string().optional(),
  REDIS_TLS: zStringToBool.default("false"),
});

export const clientSchema = z.object({
  NEXT_PUBLIC_ENABLE_BACKGROUND_JOBS: zStringToBool.default("false"),
});

export const serverSchema = z.intersection(
  clientSchema,
  z.union([
    // Case 1: Background jobs ENABLED
    z.object({ NEXT_PUBLIC_ENABLE_BACKGROUND_JOBS: zTrue }).merge(
      z.object({
        // Require non-empty host and port
        REDIS_HOST: z
          .string()
          .nonempty("REDIS_HOST must be set when background jobs are enabled."),
        REDIS_PORT: z.coerce.number(),
        REDIS_USERNAME: z.string().optional(),
        REDIS_PASSWORD: z.string().optional(),
        REDIS_TLS: zStringToBool.default("false"),
      }),
    ),
    // Case 2: Background jobs DISABLED
    z
      .object({ NEXT_PUBLIC_ENABLE_BACKGROUND_JOBS: zFalse })
      .merge(redisServerSchemaBase),
  ]),
);
