/*
  Warnings:

  - You are about to drop the column `tanggalDiubah` on the `HakAksesKaryawan` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "benefita"."HakAksesKaryawan" DROP CONSTRAINT "HakAksesKaryawan_pegawaiId_fkey";

-- DropIndex
DROP INDEX "benefita"."HakAksesKaryawan_perusahaanId_pegawaiId_jenisAkses_key";

-- AlterTable
ALTER TABLE "benefita"."HakAksesKaryawan" DROP COLUMN "tanggalDiubah",
ALTER COLUMN "pegawaiId" DROP NOT NULL,
ALTER COLUMN "status" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "benefita"."HakAksesKaryawan" ADD CONSTRAINT "HakAksesKaryawan_pegawaiId_fkey" FOREIGN KEY ("pegawaiId") REFERENCES "benefita"."Pegawai"("id") ON DELETE SET NULL ON UPDATE CASCADE;
