import { Prisma } from "@/generated/prisma";
import { displayUserNameAndUsername } from "@/server/db/utils";

export const userExtension = Prisma.defineExtension({
  name: "userComputedFieldsBase",
  result: {
    user: {
      displayNameWithUsername: {
        needs: { name: true, username: true },
        compute(user) {
          return displayUserNameAndUsername(user);
        },
      },
      displayName: {
        needs: { name: true, username: true },
        compute(user) {
          return user.name ?? user.username ?? "";
        },
      },
      isAdmin: {
        needs: { role: true },
        compute(user) {
          return user.role === "ADMIN";
        },
      },
      // profilePic removed
      // coverPic removed
    },
  },
});
