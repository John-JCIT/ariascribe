-- Rename tables to plural
ALTER TABLE "account" RENAME TO "accounts";
ALTER TABLE "user" RENAME TO "users";
ALTER TABLE "ut_image" RENAME TO "ut_images";
ALTER TABLE "verification" RENAME TO "verifications";

-- AlterTable
ALTER TABLE "accounts" RENAME CONSTRAINT "account_pkey" TO "accounts_pkey";

-- AlterTable
ALTER TABLE "users" RENAME CONSTRAINT "user_pkey" TO "users_pkey";

-- AlterTable
ALTER TABLE "ut_images" RENAME CONSTRAINT "ut_image_pkey" TO "ut_images_pkey";

-- AlterTable
ALTER TABLE "verifications" RENAME CONSTRAINT "verification_pkey" TO "verifications_pkey";

-- RenameForeignKey
ALTER TABLE "accounts" RENAME CONSTRAINT "account_userId_fkey" TO "accounts_userId_fkey";

-- RenameForeignKey
ALTER TABLE "users" RENAME CONSTRAINT "user_avatarImageId_fkey" TO "users_avatarImageId_fkey";

-- RenameForeignKey
ALTER TABLE "users" RENAME CONSTRAINT "user_coverImageId_fkey" TO "users_coverImageId_fkey";

-- RenameForeignKey
ALTER TABLE "ut_images" RENAME CONSTRAINT "ut_image_userId_fkey" TO "ut_images_userId_fkey";

-- RenameIndex
ALTER INDEX "user_avatarImageId_key" RENAME TO "users_avatarImageId_key";

-- RenameIndex
ALTER INDEX "user_coverImageId_key" RENAME TO "users_coverImageId_key";

-- RenameIndex
ALTER INDEX "user_email_key" RENAME TO "users_email_key";

-- RenameIndex
ALTER INDEX "user_username_key" RENAME TO "users_username_key";

-- RenameIndex
ALTER INDEX "ut_image_key_key" RENAME TO "ut_images_key_key";

-- RenameIndex
ALTER INDEX "ut_image_userId_idx" RENAME TO "ut_images_userId_idx";
