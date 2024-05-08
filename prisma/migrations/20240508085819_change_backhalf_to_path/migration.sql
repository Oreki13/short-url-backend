/*
  Warnings:

  - You are about to drop the column `back_half` on the `tbl_data_url` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[path]` on the table `tbl_data_url` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `path` to the `tbl_data_url` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "tbl_data_url_back_half_key";

-- AlterTable
ALTER TABLE "tbl_data_url" DROP COLUMN "back_half",
ADD COLUMN     "path" VARCHAR(2555) NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "tbl_data_url_path_key" ON "tbl_data_url"("path");
