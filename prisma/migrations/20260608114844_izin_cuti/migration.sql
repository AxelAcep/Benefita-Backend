-- CreateEnum
CREATE TYPE "benefita"."JenisIzin" AS ENUM ('CUTI', 'SAKIT', 'IZIN');

-- CreateEnum
CREATE TYPE "benefita"."StatusIzin" AS ENUM ('PENDING', 'DISETUJUI', 'DITOLAK');

-- CreateTable
CREATE TABLE "benefita"."PengajuanIzin" (
    "id" TEXT NOT NULL,
    "pegawaiId" TEXT NOT NULL,
    "jenisIzin" "benefita"."JenisIzin" NOT NULL,
    "tanggalMulai" TIMESTAMP(3) NOT NULL,
    "tanggalSelesai" TIMESTAMP(3) NOT NULL,
    "alasan" TEXT NOT NULL,
    "alasanTolak" TEXT,
    "status" "benefita"."StatusIzin" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PengajuanIzin_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "benefita"."BuktiIzin" (
    "id" TEXT NOT NULL,
    "pengajuanIzinId" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BuktiIzin_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "benefita"."PengajuanIzin" ADD CONSTRAINT "PengajuanIzin_pegawaiId_fkey" FOREIGN KEY ("pegawaiId") REFERENCES "benefita"."Pegawai"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "benefita"."BuktiIzin" ADD CONSTRAINT "BuktiIzin_pengajuanIzinId_fkey" FOREIGN KEY ("pengajuanIzinId") REFERENCES "benefita"."PengajuanIzin"("id") ON DELETE CASCADE ON UPDATE CASCADE;
