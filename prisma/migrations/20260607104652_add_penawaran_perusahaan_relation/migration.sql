/*
  Warnings:

  - Added the required column `perusahaanId` to the `penawaran` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "benefita"."penawaran" ADD COLUMN     "perusahaanId" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "benefita"."penawaran" ADD CONSTRAINT "penawaran_perusahaanId_fkey" FOREIGN KEY ("perusahaanId") REFERENCES "benefita"."TabPerusahaan"("0NO_INDUK") ON DELETE RESTRICT ON UPDATE CASCADE;
