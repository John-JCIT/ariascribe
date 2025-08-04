import { z } from "zod";
import { publicProcedure } from "@/server/trpc";

export const MbsItemSchema = z.object({
  item_number: z.number().int(),
  group_code: z.string().optional(),
  subgroup_code: z.string().optional(),
  description: z.string(),
  notes: z.string().optional(),
  fee: z.number(),
  valid_from: z.string().optional(), // format: YYYY-MM-DD
  valid_to: z.string().optional(),   // format: YYYY-MM-DD
});

export const getMbsItem = publicProcedure
  .input(z.object({ item_number: z.number() }))
  .query(({ input }) => {
    // TODO: Fetch from DB using Prisma
    return { item_number: input.item_number };
  });