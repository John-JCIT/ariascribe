import { clientEnv, formatErrors } from "./client";
import {
  clientEnvRaw,
  serverSchema as coreServerSchema,
} from "./schemas/index";
import { serverSchema as emailServerSchema } from "./schemas/email";
import { serverSchema as authServerSchema } from "./schemas/auth";
import { z } from "zod";

const mergedServerSchema = z.intersection(
  coreServerSchema,
  z.intersection(emailServerSchema, authServerSchema),
);

const _serverEnv = mergedServerSchema.safeParse({
  ...clientEnvRaw,
  ...process.env,
});

if (!_serverEnv.success) {
  const formatted = _serverEnv.error.format();
  console.error(
    "❌ Invalid environment variables:\n",
    ...formatErrors(formatted),
  );

  if (formatted._errors) {
    console.log(...formatted._errors);
  }

  console.log("");

  throw new Error("Invalid environment variables");
}

// for (let key of Object.keys(_serverEnv.data)) {
//   if (key.startsWith("NEXT_PUBLIC_")) {
//     console.warn("❌ You are exposing a server-side env-variable:", key);
//
//     throw new Error("You are exposing a server-side env-variable");
//   }
// }

export const serverEnv = { ...clientEnv, ..._serverEnv.data };
