/*
  Warnings:

  - You are about to drop the column `biru` on the `Proper` table. All the data in the column will be lost.
  - You are about to drop the column `emas` on the `Proper` table. All the data in the column will be lost.
  - You are about to drop the column `hijau` on the `Proper` table. All the data in the column will be lost.
  - You are about to drop the column `hitam` on the `Proper` table. All the data in the column will be lost.
  - You are about to drop the column `merah` on the `Proper` table. All the data in the column will be lost.
  - You are about to drop the column `perusahaanId` on the `Proper` table. All the data in the column will be lost.
  - Added the required column `jenisIndustris` to the `Proper` table without a default value. This is not possible if the table is not empty.
  - Added the required column `namaPerusahaan` to the `Proper` table without a default value. This is not possible if the table is not empty.
  - Added the required column `peringkat` to the `Proper` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "benefita"."Peringkat" AS ENUM ('EMAS', 'HIJAU', 'BIRU', 'MERAH', 'HITAM');

-- DropForeignKey
ALTER TABLE "benefita"."Proper" DROP CONSTRAINT "Proper_perusahaanId_fkey";

-- AlterTable
ALTER TABLE "benefita"."Proper" DROP COLUMN "biru",
DROP COLUMN "emas",
DROP COLUMN "hijau",
DROP COLUMN "hitam",
DROP COLUMN "merah",
DROP COLUMN "perusahaanId",
ADD COLUMN     "jenisIndustris" VARCHAR(255) NOT NULL,
ADD COLUMN     "namaPerusahaan" VARCHAR(255) NOT NULL,
ADD COLUMN     "noIndukPemda" TEXT,
ADD COLUMN     "noIndukPerusahaan" TEXT,
ADD COLUMN     "noIndukProvinsi" TEXT,
ADD COLUMN     "peringkat" "benefita"."Peringkat" NOT NULL;

-- AddForeignKey
ALTER TABLE "benefita"."Proper" ADD CONSTRAINT "Proper_noIndukProvinsi_fkey" FOREIGN KEY ("noIndukProvinsi") REFERENCES "benefita"."TabPerusahaan"("0NO_INDUK") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "benefita"."Proper" ADD CONSTRAINT "Proper_noIndukPemda_fkey" FOREIGN KEY ("noIndukPemda") REFERENCES "benefita"."TabPerusahaan"("0NO_INDUK") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "benefita"."Proper" ADD CONSTRAINT "Proper_noIndukPerusahaan_fkey" FOREIGN KEY ("noIndukPerusahaan") REFERENCES "benefita"."TabPerusahaan"("0NO_INDUK") ON DELETE SET NULL ON UPDATE CASCADE;
