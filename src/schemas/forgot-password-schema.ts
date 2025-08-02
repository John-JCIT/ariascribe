import { object, type z } from "zod";
import { getEmailSchema } from "./shared-schemas";

export const forgotPasswordSchema = object({
  email: getEmailSchema(),
});

export type ForgotPasswordSchemaType = z.infer<typeof forgotPasswordSchema>;
