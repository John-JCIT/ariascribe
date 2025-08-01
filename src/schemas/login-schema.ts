import { object, type z } from "zod";
import { getEmailSchema, getPasswordSchema } from "./shared-schemas";

export const signInSchema = object({
  email: getEmailSchema(),
  password: getPasswordSchema("password"),
});

export type SignInSchemaType = z.infer<typeof signInSchema>;
