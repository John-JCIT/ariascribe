import { z } from "zod";
import { zStringToBool } from "./utils";

export const authClientSchema = z.object({
  NEXT_PUBLIC_AUTH_ENABLE_EMAIL_PASSWORD_AUTHENTICATION:
    zStringToBool.default("true"),
  NEXT_PUBLIC_AUTH_ENABLE_EMAIL_VERIFICATION: zStringToBool.default("true"),
});

export const authServerSchema = z.object({
  BETTER_AUTH_SECRET: z.string().optional(),
  AUTH_ENABLE_CHANGE_EMAIL: zStringToBool.default("false"),
  AUTH_AUTO_SIGN_IN_AFTER_VERIFICATION: zStringToBool.default("true"),
});

export const clientSchema = authClientSchema;
export const serverSchema = authServerSchema;
