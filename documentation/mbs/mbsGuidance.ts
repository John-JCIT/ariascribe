import { z } from "zod";
import { publicProcedure } from "@/server/trpc";

export const MbsGuidanceSchema = z.object({
  id: z.string().uuid(),
  item_number: z.number().int(),
  source_url: z.string().url(),
  summary: z.string(),
  published_date: z.string().date(),
});

export const getGuidanceForItem = publicProcedure
  .input(z.object({ item_number: z.number() }))
  .query(({ input }) => {
    // TODO: Fetch guidance for the specified item
    return [];
  });