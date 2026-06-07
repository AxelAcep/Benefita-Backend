/*
  Warnings:

  - The `responMA` column on the `pengajuan_judul_training` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "benefita"."pengajuan_judul_training" DROP COLUMN "responMA",
ADD COLUMN     "responMA" TEXT DEFAULT 'PENDING';

-- DropEnum
DROP TYPE "benefita"."ResponMA";
