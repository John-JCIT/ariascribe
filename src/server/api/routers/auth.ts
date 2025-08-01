import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { auth } from "@/server/auth";
import { db } from "@/server/db";
import { passwordChangeSchema } from "@/schemas/password-change-schema";

export const authRouter = createTRPCRouter({
  changePassword: protectedProcedure
    .input(passwordChangeSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      if (!userId) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      try {
        // Get user's account with credential provider
        const account = await db.account.findFirst({
          where: {
            userId,
            providerId: "credential",
          },
        });

        if (!account?.password) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "No password-based account found",
          });
        }

        // Get auth context for password operations
        const authCtx = await auth.$context;

        const passwordValid = await authCtx.password.verify({
          hash: account.password,
          password: input.currentPassword,
        });

        if (!passwordValid) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Current password is incorrect",
          });
        }

        // Hash the new password using Better Auth's built-in hashing
        const newPasswordHash = await authCtx.password.hash(input.newPassword);

        // Update password in database
        await db.account.update({
          where: {
            id: account.id,
          },
          data: {
            password: newPasswordHash,
          },
        });

        return { success: true };
      } catch (error: any) {
        if (error instanceof TRPCError) {
          throw error;
        }

        console.error("Error updating password:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update password",
        });
      }
    }),
});
