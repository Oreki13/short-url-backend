-- CreateTable
CREATE TABLE "tbl_data_url" (
    "id" TEXT NOT NULL,
    "title" VARCHAR(2555) NOT NULL,
    "destination" TEXT NOT NULL,
    "back_half" VARCHAR(2555) NOT NULL,
    "count_clicks" INTEGER NOT NULL,
    "is_deleted" INTEGER NOT NULL,
    "user_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tbl_data_url_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "tbl_data_url" ADD CONSTRAINT "tbl_data_url_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
