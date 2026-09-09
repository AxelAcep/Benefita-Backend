-- CreateEnum
CREATE TYPE "benefita"."JenisAkun" AS ENUM ('ASET', 'LIABILITAS', 'MODAL', 'PENDAPATAN', 'BEBAN');

-- CreateTable
CREATE TABLE "benefita"."akun" (
    "id" SERIAL NOT NULL,
    "kode" TEXT,
    "nama" TEXT NOT NULL,
    "jenis" "benefita"."JenisAkun" NOT NULL,
    "saldoAwal" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "akun_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "akun_kode_key" ON "benefita"."akun"("kode");
