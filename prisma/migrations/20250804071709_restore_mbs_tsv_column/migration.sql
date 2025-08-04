/*
  Warnings:

  - You are about to drop the column `tsv` on the `items` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "mbs"."idx_mbs_items_tsv";

-- AlterTable
ALTER TABLE "mbs"."items" DROP COLUMN "tsv";
