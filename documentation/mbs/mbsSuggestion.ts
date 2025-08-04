import { z } from "zod";
import { protectedProcedure } from "@/server/trpc";

export const MbsSuggestionSchema = z.object({
  id: z.string().uuid(),
  consultation_id: z.string().uuid(),
  item_number: z.number().int(),
  suggested_by: z.string().uuid(),
  accepted: z.boolean().nullable(),
  created_at: z.string().datetime(),
});

export const getSuggestionsForConsult = protectedProcedure
  .input(z.object({ consultation_id: z.string().uuid() }))
  .query(({ input }) => {
    // TODO: Fetch suggestions by consultation_id
    return [];
  });