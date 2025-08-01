import { z } from "zod";
import { zFalse, zStringToBool, zTrue } from "./utils";

// Common Polar server vars (always present if Polar is enabled)
const polarServerSchemaCommon = z.object({
  POLAR_CREATE_CUSTOMER_ON_SIGNUP: zStringToBool.default("true"),
  POLAR_ENABLE_CUSTOMER_PORTAL: zStringToBool.default("true"),
  POLAR_ENABLE_CHECKOUT: zStringToBool.default("true"),
});

// Sandbox specific Polar server vars (required if env is sandbox and Polar is enabled)
const polarServerSchemaSandbox = z.object({
  POLAR_ACCESS_TOKEN_SANDBOX: z.string().nonempty(),
  POLAR_WEBHOOK_SECRET_SANDBOX: z.string().optional(),
  POLAR_BENEFIT_PRO_ID_SANDBOX: z.string().nonempty(),
});

// Production specific Polar server vars (required if env is production and Polar is enabled)
const polarServerSchemaProd = z.object({
  POLAR_ACCESS_TOKEN_PROD: z.string().nonempty(),
  POLAR_WEBHOOK_SECRET_PROD: z.string().optional(),
  POLAR_BENEFIT_PRO_ID_PROD: z.string().nonempty(),
});

export const clientSchema = z.object({
  NEXT_PUBLIC_ENABLE_POLAR: zStringToBool.default("false"),
  NEXT_PUBLIC_POLAR_ENV: z.enum(["sandbox", "production"]).default("sandbox"),
});

// Server schema: Intersect client schema with conditional logic
export const serverSchema = z.intersection(
  clientSchema,
  z.union([
    z
      .object({ NEXT_PUBLIC_ENABLE_POLAR: zTrue })
      .merge(polarServerSchemaCommon)
      .and(
        z.union([
          z
            .object({ NEXT_PUBLIC_POLAR_ENV: z.literal("sandbox") })
            .merge(polarServerSchemaSandbox),
          z
            .object({ NEXT_PUBLIC_POLAR_ENV: z.literal("production") })
            .merge(polarServerSchemaProd),
        ]),
      ),
    z
      .object({
        NEXT_PUBLIC_ENABLE_POLAR: zFalse,
      })
      .merge(polarServerSchemaCommon),
  ]),
);
