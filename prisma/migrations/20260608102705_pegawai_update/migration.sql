/*
  Warnings:

  - You are about to drop the column `Departemen` on the `Pegawai` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[nip]` on the table `Pegawai` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "benefita"."Pegawai" DROP COLUMN "Departemen",
ADD COLUMN     "departemen" TEXT,
ADD COLUMN     "fotoKey" TEXT,
ADD COLUMN     "fotoUrl" TEXT,
ADD COLUMN     "nip" TEXT;

-- CreateTable
CREATE TABLE "benefita"."DokumenPegawai" (
    "id" TEXT NOT NULL,
    "pegawaiId" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "tipe" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DokumenPegawai_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Pegawai_nip_key" ON "benefita"."Pegawai"("nip");

-- AddForeignKey
ALTER TABLE "benefita"."DokumenPegawai" ADD CONSTRAINT "DokumenPegawai_pegawaiId_fkey" FOREIGN KEY ("pegawaiId") REFERENCES "benefita"."Pegawai"("id") ON DELETE CASCADE ON UPDATE CASCADE;
