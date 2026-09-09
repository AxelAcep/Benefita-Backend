-- CreateEnum
CREATE TYPE "benefita"."JenisRequestKeuangan" AS ENUM ('PENGELUARAN', 'PEMASUKAN');

-- CreateEnum
CREATE TYPE "benefita"."StatusRequestKeuangan" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "benefita"."request_keuangan" (
    "id" SERIAL NOT NULL,
    "jenis" "benefita"."JenisRequestKeuangan" NOT NULL,
    "akunId" INTEGER,
    "deskripsi" TEXT NOT NULL,
    "nominal" DECIMAL(65,30) NOT NULL,
    "tanggal" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "requestedBy" TEXT NOT NULL,
    "status" "benefita"."StatusRequestKeuangan" NOT NULL DEFAULT 'PENDING',
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "catatan" TEXT,
    "buktiFile" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "request_keuangan_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "benefita"."request_keuangan" ADD CONSTRAINT "request_keuangan_akunId_fkey" FOREIGN KEY ("akunId") REFERENCES "benefita"."akun"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "benefita"."request_keuangan" ADD CONSTRAINT "request_keuangan_requestedBy_fkey" FOREIGN KEY ("requestedBy") REFERENCES "benefita"."Pegawai"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "benefita"."request_keuangan" ADD CONSTRAINT "request_keuangan_approvedBy_fkey" FOREIGN KEY ("approvedBy") REFERENCES "benefita"."Pegawai"("id") ON DELETE SET NULL ON UPDATE CASCADE;
