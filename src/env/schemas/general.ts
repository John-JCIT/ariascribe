import { z } from "zod";
import { zStringToBool } from "./utils";

export const clientSchema = z.object({
  NEXT_PUBLIC_APP_NAME: z.string().default("Money Printer"),
  NEXT_PUBLIC_APP_DESCRIPTION: z
    .string()
    .optional()
    .default("Your default app description"),
  NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  NEXT_PUBLIC_ENABLE_CRON: zStringToBool.default("false"),
  NEXT_PUBLIC_ENABLE_BLOG_PAGE: zStringToBool.default("true"),
  NEXT_PUBLIC_ENABLE_ABOUT_PAGE: zStringToBool.default("true"),
  NEXT_PUBLIC_ENABLE_CHAT_PAGE: zStringToBool.default("true"),
  NEXT_PUBLIC_ENABLE_PRICING_PAGE: zStringToBool.default("true"),
});

export const serverSchema = z.object({
  DATABASE_URL: z.string().url(),
  ENABLE_ARTIFICIAL_TRPC_DELAY: zStringToBool.default("true"),
});
