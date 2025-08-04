/*
  Warnings:

  - You are about to drop the column `embedding` on the `items` table. All the data in the column will be lost.
  - You are about to drop the column `tsv` on the `items` table. All the data in the column will be lost.
  - Made the column `started_at` on table `ingestion_log` required. This step will fail if there are existing NULL values in that column.
  - Made the column `status` on table `ingestion_log` required. This step will fail if there are existing NULL values in that column.
  - Made the column `items_processed` on table `ingestion_log` required. This step will fail if there are existing NULL values in that column.
  - Made the column `items_inserted` on table `ingestion_log` required. This step will fail if there are existing NULL values in that column.
  - Made the column `items_updated` on table `ingestion_log` required. This step will fail if there are existing NULL values in that column.
  - Made the column `items_failed` on table `ingestion_log` required. This step will fail if there are existing NULL values in that column.
  - Made the column `openai_model` on table `ingestion_log` required. This step will fail if there are existing NULL values in that column.
  - Made the column `has_anaesthetic` on table `items` required. This step will fail if there are existing NULL values in that column.
  - Made the column `is_active` on table `items` required. This step will fail if there are existing NULL values in that column.
  - Made the column `is_new_item` on table `items` required. This step will fail if there are existing NULL values in that column.
  - Made the column `last_updated` on table `items` required. This step will fail if there are existing NULL values in that column.
  - Made the column `created_at` on table `items` required. This step will fail if there are existing NULL values in that column.
  - Made the column `status` on table `suggestions` required. This step will fail if there are existing NULL values in that column.
  - Made the column `created_at` on table `suggestions` required. This step will fail if there are existing NULL values in that column.
  - Made the column `updated_at` on table `suggestions` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "mbs"."suggestions" DROP CONSTRAINT "suggestions_item_number_fkey";

-- DropIndex
DROP INDEX "mbs"."idx_mbs_ingestion_log_file_hash";

-- DropIndex
DROP INDEX "mbs"."idx_mbs_ingestion_log_started_at";

-- DropIndex
DROP INDEX "mbs"."idx_mbs_ingestion_log_status";

-- DropIndex
DROP INDEX "mbs"."idx_mbs_items_active";

-- DropIndex
DROP INDEX "mbs"."idx_mbs_items_category";

-- DropIndex
DROP INDEX "mbs"."idx_mbs_items_category_active";

-- DropIndex
DROP INDEX "mbs"."idx_mbs_items_embedding";

-- DropIndex
DROP INDEX "mbs"."idx_mbs_items_item_number";

-- DropIndex
DROP INDEX "mbs"."idx_mbs_items_provider_active";

-- DropIndex
DROP INDEX "mbs"."idx_mbs_items_provider_type";

-- DropIndex
DROP INDEX "mbs"."idx_mbs_items_tsv";

-- DropIndex
DROP INDEX "mbs"."idx_mbs_suggestions_created_at";

-- DropIndex
DROP INDEX "mbs"."idx_mbs_suggestions_item_number";

-- DropIndex
DROP INDEX "mbs"."idx_mbs_suggestions_status";

-- DropIndex
DROP INDEX "mbs"."idx_mbs_suggestions_tenant_id";

-- DropIndex
DROP INDEX "mbs"."idx_mbs_suggestions_tenant_status";

-- DropIndex
DROP INDEX "mbs"."idx_mbs_suggestions_user_id";

-- DropIndex
DROP INDEX "mbs"."idx_mbs_suggestions_user_status";

-- AlterTable
ALTER TABLE "mbs"."ingestion_log" ALTER COLUMN "file_name" SET DATA TYPE TEXT,
ALTER COLUMN "started_at" SET NOT NULL,
ALTER COLUMN "status" SET NOT NULL,
ALTER COLUMN "items_processed" SET NOT NULL,
ALTER COLUMN "items_inserted" SET NOT NULL,
ALTER COLUMN "items_updated" SET NOT NULL,
ALTER COLUMN "items_failed" SET NOT NULL,
ALTER COLUMN "openai_model" SET NOT NULL;

-- AlterTable
ALTER TABLE "mbs"."items" DROP COLUMN "embedding",
DROP COLUMN "tsv",
ALTER COLUMN "group_name" SET DATA TYPE TEXT,
ALTER COLUMN "sub_group" SET DATA TYPE TEXT,
ALTER COLUMN "has_anaesthetic" SET NOT NULL,
ALTER COLUMN "is_active" SET NOT NULL,
ALTER COLUMN "is_new_item" SET NOT NULL,
ALTER COLUMN "last_updated" SET NOT NULL,
ALTER COLUMN "created_at" SET NOT NULL;

-- AlterTable
ALTER TABLE "mbs"."suggestions" ALTER COLUMN "status" SET NOT NULL,
ALTER COLUMN "created_at" SET NOT NULL,
ALTER COLUMN "updated_at" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "mbs"."suggestions" ADD CONSTRAINT "suggestions_item_number_fkey" FOREIGN KEY ("item_number") REFERENCES "mbs"."items"("item_number") ON DELETE RESTRICT ON UPDATE CASCADE;
