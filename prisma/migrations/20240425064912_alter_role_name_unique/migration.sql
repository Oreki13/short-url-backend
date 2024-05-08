/*
  Warnings:

  - A unique constraint covering the columns `[name]` on the table `role_user` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[id]` on the table `tbl_data_url` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[title]` on the table `tbl_data_url` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[back_half]` on the table `tbl_data_url` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[id]` on the table `users` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "role_user_name_key" ON "role_user"("name");

-- CreateIndex
CREATE UNIQUE INDEX "tbl_data_url_id_key" ON "tbl_data_url"("id");

-- CreateIndex
CREATE UNIQUE INDEX "tbl_data_url_title_key" ON "tbl_data_url"("title");

-- CreateIndex
CREATE UNIQUE INDEX "tbl_data_url_back_half_key" ON "tbl_data_url"("back_half");

-- CreateIndex
CREATE UNIQUE INDEX "users_id_key" ON "users"("id");
