import { clientSchema, clientEnvRaw } from "./schemas/index";
import { type z } from "zod";

const _clientEnv = clientSchema.safeParse(clientEnvRaw);

export const formatErrors = (
  errors: z.ZodFormattedError<Map<string, string>, string>,
) =>
  Object.entries(errors)
    .map(([name, value]) => {
      if (value && "_errors" in value) {
        return `${name}: ${value._errors.join(", ")}\n`;
      }
    })
    .filter(Boolean);

if (!_clientEnv.success) {
  const formatted = _clientEnv.error.format();
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

for (const key of Object.keys(_clientEnv.data)) {
  if (
    !key.startsWith("NEXT_PUBLIC_") &&
    key !== "NODE_ENV" &&
    key !== "NEXT_RUNTIME"
  ) {
    console.warn(
      `❌ Invalid public environment variable name: ${key}. It must begin with 'NEXT_PUBLIC_'`,
    );

    throw new Error("Invalid public environment variable name");
  }
}

export const clientEnv = _clientEnv.data;
