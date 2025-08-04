import { z } from "zod";
import { publicProcedure } from "@/server/trpc";

export const MbsChangelogSchema = z.object({
  id: z.number().int(),
  item_number: z.number().int(),
  change_type: z.enum(["fee update", "description update", "notes update", "status change"]),
  summary: z.string(),
  change_date: z.string().date(),
});

export const getChangelog = publicProcedure
  .input(z.object({ since: z.string().optional() })) // YYYY-MM-DD
  .query(({ input }) => {
    // TODO: Return list of changes since input.since
    return [];
  });