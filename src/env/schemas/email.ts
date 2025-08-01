import { z } from "zod";
import { zStringToBool } from "./utils";

export const emailClientSchema = z.object({
  NEXT_PUBLIC_EMAIL_PROVIDER: z
    .enum(["nodemailer-app", "plunk", "resend", "smtp", "none"])
    .optional()
    .default("none"),
  NEXT_PUBLIC_EMAIL_ENABLE_EMAIL_PREVIEW: zStringToBool.default("true"),
  NEXT_PUBLIC_EMAIL_PREVIEW_OPEN_TAB: zStringToBool.default("true"),
  NEXT_PUBLIC_EMAIL_PREVIEW_OPEN_SIMULATOR: zStringToBool.default("false"),
});

const emailCommonSchema = z.object({
  EMAIL_FROM: z.string().optional().nullish().default("noreply@example.com"),
});

const resendSchema = z.object({
  NEXT_PUBLIC_EMAIL_PROVIDER: z.literal("resend"),
  RESEND_API_KEY: z.string(),
});
const plunkSchema = z.object({
  NEXT_PUBLIC_EMAIL_PROVIDER: z.literal("plunk"),
  PLUNK_SECRET_KEY: z.string(),
});
const smtpSchema = z.object({
  NEXT_PUBLIC_EMAIL_PROVIDER: z.literal("smtp"),
  SMTP_HOST: z.string(),
  SMTP_PORT: z.coerce.number(),
  SMTP_USER: z.string(),
  SMTP_PASS: z.string(),
  SMTP_SECURE: zStringToBool,
});

const nodemailerLocalSchema = z.object({
  NEXT_PUBLIC_EMAIL_PROVIDER: z.literal("nodemailer-app"),
  NODEMAILER_LOCAL_USER: z.string(),
  NODEMAILER_LOCAL_PASS: z.string(),
  NODEMAILER_LOCAL_PORT: z.coerce.number().default(1025),
});

export const serverSchema = z.intersection(
  emailCommonSchema,
  z.discriminatedUnion("NEXT_PUBLIC_EMAIL_PROVIDER", [
    z.object({
      NEXT_PUBLIC_EMAIL_PROVIDER: z.literal("none").default("none"),
    }),
    resendSchema,
    plunkSchema,
    smtpSchema,
    nodemailerLocalSchema,
  ]),
);

export const clientSchema = emailClientSchema;
