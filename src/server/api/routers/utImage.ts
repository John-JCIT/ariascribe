import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { db } from "@/server/db";
import { TRPCError } from "@trpc/server";
import { utapi } from "@/server/uploadthing/server";

export const utImageRouter = createTRPCRouter({
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const { id } = input;

      // Find the image record
      const image = await db.uTImage.findUnique({
        where: { id },
      });

      if (!image) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Image not found." });
      }

      // Check ownership
      if (image.userId !== userId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have permission to delete this image.",
        });
      }

      // Delete from UploadThing
      try {
        await utapi.deleteFiles(image.key);
      } catch (error) {
        console.error(
          `Failed to delete image key ${image.key} from UploadThing:`,
          error,
        );
        // Decide if you want to proceed with DB deletion or throw an error.
        // Throwing might be safer to avoid orphaned DB records if UT deletion fails.
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to delete image from storage provider.",
          cause: error,
        });
      }

      // Delete from Database
      // We can now rely on Prisma's onDelete: SetNull to handle avatar/cover image relations
      await db.uTImage.delete({
        where: { id },
      });

      return { success: true };
    }),
});
