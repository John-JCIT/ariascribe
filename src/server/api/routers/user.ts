import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import {
  getSinglePreferenceSchema,
  updatePreferenceSchema,
  userPreferencesSchema,
  type PreferenceKey,
} from "@/types/user-preferences";
import { UpdateProfileInput } from "@/types/user";
import {
  getEnhancedUser,
  getUploadThingImageConnectDisconnectArgs,
} from "@/server/db/utils";

export const userRouter = createTRPCRouter({
  getCurrentUser: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;
    if (!userId) {
      throw new TRPCError({ code: "UNAUTHORIZED" });
    }

    const user = await ctx.db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        username: true,
        role: true, // Needed for isAdmin computed by extension
        avatarImageUrl: true, // Needed for getEnhancedUser
        coverImageUrl: true, // Needed for getEnhancedUser
        avatarImage: { select: { key: true } }, // Needed for getEnhancedUser
        coverImage: { select: { key: true } }, // Needed for getEnhancedUser
        onboarded: true, // Include the onboarding status
      },
    });

    if (!user) {
      throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
    }

    const enhancedUser = getEnhancedUser(user);

    return enhancedUser;
  }),

  getPreferences: protectedProcedure.query(async ({ ctx }) => {
    const user = await ctx.db.user.findUnique({
      where: { id: ctx.session.user.id },
      select: { preferences: true },
    });

    if (!user) {
      throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
    }

    return userPreferencesSchema.parse(user.preferences || {});
  }),

  getSinglePreference: protectedProcedure
    .input(getSinglePreferenceSchema)
    .query(async ({ ctx, input }) => {
      const user = await ctx.db.user.findUnique({
        where: { id: ctx.session.user.id },
        select: { preferences: true },
      });

      if (!user) {
        throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
      }

      const preferences = userPreferencesSchema.parse(user.preferences || {});
      const key = input.key as PreferenceKey;

      return {
        value:
          preferences[key] !== undefined
            ? preferences[key]
            : input.defaultValue !== undefined
              ? input.defaultValue
              : userPreferencesSchema.shape[key].parse(undefined),
      };
    }),

  updatePreference: protectedProcedure
    .input(updatePreferenceSchema)
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.db.user.findUnique({
        where: { id: ctx.session.user.id },
        select: { preferences: true },
      });

      if (!user) {
        throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
      }

      const currentPreferences = userPreferencesSchema
        .partial()
        .parse(user.preferences || {});
      const key = input.key as PreferenceKey;

      const updatedPreferences = { ...currentPreferences, [key]: input.value };

      await ctx.db.user.update({
        where: { id: ctx.session.user.id },
        data: { preferences: updatedPreferences },
      });

      return userPreferencesSchema.parse(updatedPreferences);
    }),

  getUserForEditingProfile: protectedProcedure.query(async ({ ctx }) => {
    const user = await ctx.db.user.findUnique({
      where: { id: ctx.session.user.id },
      select: {
        id: true,
        name: true,
        username: true,
        bio: true,
        timezone: true,
        avatarImageUrl: true,
        coverImageUrl: true,
        avatarImage: {
          select: { id: true, key: true },
        },
        coverImage: {
          select: { id: true, key: true },
        },
      },
    });

    if (!user) {
      throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
    }

    return {
      ...user,
      name: user.name ?? "",
      username: user.username ?? "",
      bio: user.bio ?? "",
      timezone: user.timezone ?? "",
      avatarImage: user.avatarImage,
      coverImage: user.coverImage,
      avatarImageUrl: user.avatarImageUrl,
      coverImageUrl: user.coverImageUrl,
    };
  }),

  updateProfile: protectedProcedure
    .input(UpdateProfileInput)
    .mutation(async ({ ctx, input }) => {
      // Check if the username is already taken by another user
      if (input.username) {
        console.log("input.username", input.username);
        const existingUser = await ctx.db.user.findFirst({
          where: {
            AND: [
              { username: input.username },
              { id: { not: ctx.session.user.id } },
            ],
          },
          select: { id: true }, // Only need to know if one exists
        });

        console.log("existingUser", existingUser);

        if (existingUser) {
          console.log("Username is already taken. Please choose another one.");
          throw new TRPCError({
            code: "CONFLICT",
            message: "Username is already taken. Please choose another one.",
          });
        }
      }

      // Proceed with the update if username is available or not being changed
      await ctx.db.user.update({
        where: { id: ctx.session.user.id },
        data: {
          name: input.name,
          username: input.username,
          bio: input.bio,
          timezone: input.timezone,
          avatarImage: getUploadThingImageConnectDisconnectArgs(
            input.avatarImage,
          ),
          coverImage: getUploadThingImageConnectDisconnectArgs(
            input.coverImage,
          ),
        },
      });
      return { success: true };
    }),

  markUserAsOnboarded: protectedProcedure.mutation(async ({ ctx }) => {
    await ctx.db.user.update({
      where: { id: ctx.session.user.id },
      data: { onboarded: true },
    });
    return { success: true };
  }),

  resetUserOnboarding: protectedProcedure.mutation(async ({ ctx }) => {
    await ctx.db.user.update({
      where: { id: ctx.session.user.id },
      data: { onboarded: false }, // Set onboarded to false
    });
    return { success: true };
  }),
});
