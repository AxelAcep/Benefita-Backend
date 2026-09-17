-- CreateEnum
CREATE TYPE "benefita"."ModeJurnal" AS ENUM ('SIMPLE', 'ADVANCED');

-- CreateEnum
CREATE TYPE "benefita"."StatusJurnal" AS ENUM ('POSTED', 'CLOSED');

-- CreateEnum
CREATE TYPE "benefita"."StatusPeriode" AS ENUM ('OPEN', 'CLOSED');

-- AlterTable
ALTER TABLE "benefita"."akun" ADD COLUMN     "isKasBank" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "benefita"."request_keuangan" ADD COLUMN     "jurnalTransaksiId" INTEGER;

-- CreateTable
CREATE TABLE "benefita"."jurnal_transaksi" (
    "id" SERIAL NOT NULL,
    "noJurnal" TEXT NOT NULL,
    "tanggal" TIMESTAMP(3) NOT NULL,
    "deskripsi" TEXT NOT NULL,
    "mode" "benefita"."ModeJurnal" NOT NULL DEFAULT 'SIMPLE',
    "status" "benefita"."StatusJurnal" NOT NULL DEFAULT 'POSTED',
    "totalNominal" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "periode" TEXT NOT NULL,
    "sumber" TEXT NOT NULL DEFAULT 'MANUAL',
    "createdBy" TEXT,
    "closedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "jurnal_transaksi_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "benefita"."jurnal_baris" (
    "id" SERIAL NOT NULL,
    "transaksiId" INTEGER NOT NULL,
    "akunId" INTEGER NOT NULL,
    "debit" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "kredit" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "keterangan" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "jurnal_baris_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "benefita"."periode_akuntansi" (
    "id" SERIAL NOT NULL,
    "periode" TEXT NOT NULL,
    "status" "benefita"."StatusPeriode" NOT NULL DEFAULT 'OPEN',
    "labaRugiBersih" DECIMAL(65,30),
    "jurnalPenutupId" INTEGER,
    "closedAt" TIMESTAMP(3),
    "closedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "periode_akuntansi_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "jurnal_transaksi_noJurnal_key" ON "benefita"."jurnal_transaksi"("noJurnal");

-- CreateIndex
CREATE INDEX "jurnal_baris_akunId_idx" ON "benefita"."jurnal_baris"("akunId");

-- CreateIndex
CREATE UNIQUE INDEX "periode_akuntansi_periode_key" ON "benefita"."periode_akuntansi"("periode");

-- CreateIndex
CREATE UNIQUE INDEX "periode_akuntansi_jurnalPenutupId_key" ON "benefita"."periode_akuntansi"("jurnalPenutupId");

-- CreateIndex
CREATE UNIQUE INDEX "request_keuangan_jurnalTransaksiId_key" ON "benefita"."request_keuangan"("jurnalTransaksiId");

-- AddForeignKey
ALTER TABLE "benefita"."request_keuangan" ADD CONSTRAINT "request_keuangan_jurnalTransaksiId_fkey" FOREIGN KEY ("jurnalTransaksiId") REFERENCES "benefita"."jurnal_transaksi"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "benefita"."jurnal_transaksi" ADD CONSTRAINT "jurnal_transaksi_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "benefita"."Pegawai"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "benefita"."jurnal_baris" ADD CONSTRAINT "jurnal_baris_transaksiId_fkey" FOREIGN KEY ("transaksiId") REFERENCES "benefita"."jurnal_transaksi"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "benefita"."jurnal_baris" ADD CONSTRAINT "jurnal_baris_akunId_fkey" FOREIGN KEY ("akunId") REFERENCES "benefita"."akun"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "benefita"."periode_akuntansi" ADD CONSTRAINT "periode_akuntansi_jurnalPenutupId_fkey" FOREIGN KEY ("jurnalPenutupId") REFERENCES "benefita"."jurnal_transaksi"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "benefita"."periode_akuntansi" ADD CONSTRAINT "periode_akuntansi_closedBy_fkey" FOREIGN KEY ("closedBy") REFERENCES "benefita"."Pegawai"("id") ON DELETE SET NULL ON UPDATE CASCADE;

