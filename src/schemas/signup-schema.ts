import { object, type z } from "zod";
import {
  getEmailSchema,
  getNameSchema,
  getPasswordSchema,
} from "./shared-schemas";

export const signUpSchema = object({
  name: getNameSchema(),
  email: getEmailSchema(),
  password: getPasswordSchema("password"),
});

export type SignUpSchemaType = z.infer<typeof signUpSchema>;
