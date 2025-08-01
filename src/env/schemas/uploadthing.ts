import { z } from "zod";
import { zFalse, zStringToBool, zTrue } from "./utils";

const uploadthingServerSchemaBase = z.object({
  UPLOADTHING_TOKEN: z.string().optional(),
});

export const clientSchema = z.object({
  NEXT_PUBLIC_ENABLE_UPLOADTHING: zStringToBool.default("false"),
  NEXT_PUBLIC_UPLOADTHING_URL_ROOT: z.string().default("https://utfs.io/f/"),
});

export const serverSchema = z.intersection(
  clientSchema,
  z.union([
    z
      .object({ NEXT_PUBLIC_ENABLE_UPLOADTHING: zTrue })
      .merge(z.object({ UPLOADTHING_TOKEN: z.string().nonempty() })),
    z
      .object({ NEXT_PUBLIC_ENABLE_UPLOADTHING: zFalse })
      .merge(uploadthingServerSchemaBase),
  ]),
);
