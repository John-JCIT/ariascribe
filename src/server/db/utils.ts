import { clientEnv } from "@/env/client";

// Helper function for display name logic
export const displayUserNameAndUsername = (user: {
  name: string | null;
  username: string | null;
}): string => {
  if (!user) return "";
  const { name, username } = user;
  if (username) {
    const usernameWithAt = `@${username}`;
    if (name) {
      return `${name} (${usernameWithAt})`;
    }
    return usernameWithAt;
  }
  return name ?? ""; // Return empty string if name is also null
};

export const getImageUrl = (key: string | null): string | null => {
  return key ? `${clientEnv.NEXT_PUBLIC_UPLOADTHING_URL_ROOT}${key}` : null;
};

// Type for the input user object expected by getEnhancedUser
// It needs the base fields plus image relations with the 'key' field
export type UserForEnhancement = {
  avatarImageUrl: string | null;
  coverImageUrl: string | null;
  avatarImage: { key: string } | null;
  coverImage: { key: string } | null;
  // Include other fields from the user model that you want to pass through
  [key: string]: any; // Allow other properties
};

// Type for the enhanced user object
export type EnhancedUser<T extends UserForEnhancement> = T & {
  profilePic: string | null;
  coverPic: string | null;
  isAdmin: boolean;
};

/**
 * Adds computed profilePic and coverPic fields to a user object.
 * Expects the input user object to have avatar/cover URLs and related images with keys.
 */
export function getEnhancedUser<T extends UserForEnhancement>(
  user: T | null | undefined,
): EnhancedUser<T> | null {
  if (!user) {
    return null;
  }

  const profilePic =
    user.avatarImageUrl ?? getImageUrl(user.avatarImage?.key ?? null);
  const coverPic =
    user.coverImageUrl ?? getImageUrl(user.coverImage?.key ?? null);
  const isAdmin = user.role === "admin";

  return {
    ...user,
    profilePic,
    coverPic,
    isAdmin,
  };
}

// Type for the image input, matching what UploadThing components typically return
// and what our form state holds.
export type UploadThingImageInput =
  | {
      id: string;
      key: string;
    }
  | null
  | undefined;

// Prisma types for relation updates (simplified for connect/disconnect)
type PrismaConnectById = { connect: { id: string } };
type PrismaDisconnect = { disconnect: true };

/**
 * Generates Prisma arguments for connecting or disconnecting a related image.
 * Based on the input from an UploadThing component.
 *
 * @param imageInput The image object { id, key }, null, or undefined.
 * @returns Prisma arguments for connect, disconnect, or undefined (no change).
 */
export function getUploadThingImageConnectDisconnectArgs(
  imageInput: UploadThingImageInput,
): PrismaConnectById | PrismaDisconnect | undefined {
  if (imageInput === null) {
    // Explicitly removing the image
    return { disconnect: true };
  }
  if (imageInput?.id) {
    // Connecting a new or existing image
    return { connect: { id: imageInput.id } };
  }
  // Input is undefined or lacks an id, so no database change needed for this relation
  return undefined;
}
