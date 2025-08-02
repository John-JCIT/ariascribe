import { string, type z } from "zod";
import { MIN_PASSWORD_LENGTH, MAX_PASSWORD_LENGTH } from "@/server/auth/client";

export const getPasswordSchema = (
  type: "password" | "confirmPassword" | "currentPassword" | "newPassword",
) =>
  string({ required_error: `${type} is required` })
    .min(
      MIN_PASSWORD_LENGTH,
      `${type} must be at least ${MIN_PASSWORD_LENGTH} characters`,
    )
    .max(
      MAX_PASSWORD_LENGTH,
      `${type} cannot exceed ${MAX_PASSWORD_LENGTH} characters`,
    );

export const getEmailSchema = (): z.ZodString =>
  string({ required_error: "Email is required" })
    .min(1, "Email is required")
    .email("Invalid email");

export const getNameSchema = (): z.ZodString =>
  string({ required_error: "Name is required" })
    .min(1, "Name is required")
    .max(50, "Name must be less than 50 characters");
