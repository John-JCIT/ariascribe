import { z } from "zod";

export const zStringToBool = z
  .enum(["true", "false"])
  .transform((val) => val === "true")
  .default("false");

export const zTrue = z.literal("true").transform(() => true as const);
export const zFalse = z
  .literal("false")
  .optional()
  .transform(() => false as const);
