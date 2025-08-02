import { object, type z } from "zod";
import { getPasswordSchema } from "./shared-schemas";

export const passwordChangeSchema = object({
  currentPassword: getPasswordSchema("currentPassword"),
  newPassword: getPasswordSchema("newPassword"),
  confirmPassword: getPasswordSchema("confirmPassword"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export type PasswordChangeSchemaType = z.infer<typeof passwordChangeSchema>;
