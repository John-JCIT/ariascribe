import { z } from "zod";
import { zFalse, zStringToBool, zTrue } from "./utils";

// GitHub Integration
export const githubServerSchema = z.object({
  GITHUB_CLIENT_ID: z.string().nonempty(),
  GITHUB_CLIENT_SECRET: z.string().nonempty(),
});

export const githubClientSchema = z.object({
  NEXT_PUBLIC_ENABLE_GITHUB_INTEGRATION: zStringToBool,
});

export const clientSchema = githubClientSchema;
export const serverSchema = z.intersection(
  githubClientSchema,
  z.union([
    z
      .object({ NEXT_PUBLIC_ENABLE_GITHUB_INTEGRATION: zTrue })
      .merge(githubServerSchema),
    z.object({ NEXT_PUBLIC_ENABLE_GITHUB_INTEGRATION: zFalse }),
  ]),
);
