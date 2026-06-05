/*
  Warnings:

  - You are about to drop the `tabperusahaan` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "benefita"."HakAksesKaryawan" DROP CONSTRAINT "HakAksesKaryawan_perusahaanId_fkey";

-- DropForeignKey
ALTER TABLE "benefita"."contact_person_perusahaan" DROP CONSTRAINT "contact_person_perusahaan_KODE_PERUSAHAAN_fkey";

-- DropForeignKey
ALTER TABLE "benefita"."daily_activity" DROP CONSTRAINT "daily_activity_PERUSAHAAN_ID_fkey";

-- DropForeignKey
ALTER TABLE "benefita"."log_perubahan_perusahaan" DROP CONSTRAINT "log_perubahan_perusahaan_perusahaan_id_fkey";

-- DropForeignKey
ALTER TABLE "benefita"."permohonan_hak_akses" DROP CONSTRAINT "permohonan_hak_akses_perusahaan_id_fkey";

-- DropForeignKey
ALTER TABLE "benefita"."tabposperusahaan" DROP CONSTRAINT "tabposperusahaan_NO_INDUK_fkey";

-- DropTable
DROP TABLE "benefita"."tabperusahaan";

-- CreateTable
CREATE TABLE "benefita"."TabPerusahaan" (
    "0NO_INDUK" VARCHAR(50) NOT NULL,
    "jenisInstansi" VARCHAR(50) NOT NULL DEFAULT 'PERUSAHAAN',
    "1COMPANY" VARCHAR(255),
    "2ALAMAT" VARCHAR(255),
    "5TELP" VARCHAR(255),
    "6FAX" VARCHAR(255),
    "7EMAIL" VARCHAR(255),
    "24KET" TEXT,
    "fasilitas" VARCHAR(255),
    "ButuhTraining" VARCHAR(255),
    "prioritasMa" VARCHAR(50),
    "prioritasAe" VARCHAR(50),
    "21GROUP" VARCHAR(255),
    "idSimpel" VARCHAR(100),
    "alamatWaktu" VARCHAR(4),
    "alamatFactory" VARCHAR(255),
    "alamatFactoryWaktu" VARCHAR(4),
    "iso9000" VARCHAR(255),
    "iso14000" VARCHAR(255),
    "ohsas18001smk3" VARCHAR(255),
    "kategoriCpn" VARCHAR(255),
    "lineOfBusiness" VARCHAR(255),
    "lineBisnisSub" VARCHAR(255),
    "permodalan" VARCHAR(255),
    "nilaiSubBidangProper" INTEGER,
    "batasEmas" INTEGER,
    "batasHijau" INTEGER,
    "infoKeu" VARCHAR(255),
    "bdoAction" VARCHAR(50),
    "vendor" VARCHAR(15),
    "cabangSite" VARCHAR(255),
    "pesaing" VARCHAR(255),
    "prosedurPelatihan" VARCHAR(255),
    "kotaKabupaten" VARCHAR(100),
    "provinsi" VARCHAR(100),
    "instansi" VARCHAR(255),
    "sekilasLh" TEXT,
    "rsud" INTEGER DEFAULT 0,
    "indPengolahan" INTEGER DEFAULT 0,
    "pertambangan" INTEGER DEFAULT 0,
    "listrikGasAirBersih" INTEGER DEFAULT 0,
    "hotelResto" INTEGER DEFAULT 0,
    "angkutTrans" INTEGER DEFAULT 0,
    "bangunan" INTEGER DEFAULT 0,
    "pertanian" INTEGER DEFAULT 0,
    "keuangan" INTEGER DEFAULT 0,
    "laut" INTEGER DEFAULT 0,
    "jasa" INTEGER DEFAULT 0,
    "kode" VARCHAR(100),
    "tender1" VARCHAR(255),
    "tender2" VARCHAR(255),
    "tender3" VARCHAR(255),
    "pelatihanDiikuti" TEXT,
    "pemilik" VARCHAR(255),
    "yayasan" VARCHAR(255),
    "subKategori" VARCHAR(255),
    "cpSekolah" VARCHAR(255),

    CONSTRAINT "TabPerusahaan_pkey" PRIMARY KEY ("0NO_INDUK")
);

-- AddForeignKey
ALTER TABLE "benefita"."contact_person_perusahaan" ADD CONSTRAINT "contact_person_perusahaan_KODE_PERUSAHAAN_fkey" FOREIGN KEY ("KODE_PERUSAHAAN") REFERENCES "benefita"."TabPerusahaan"("0NO_INDUK") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "benefita"."daily_activity" ADD CONSTRAINT "daily_activity_PERUSAHAAN_ID_fkey" FOREIGN KEY ("PERUSAHAAN_ID") REFERENCES "benefita"."TabPerusahaan"("0NO_INDUK") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "benefita"."HakAksesKaryawan" ADD CONSTRAINT "HakAksesKaryawan_perusahaanId_fkey" FOREIGN KEY ("perusahaanId") REFERENCES "benefita"."TabPerusahaan"("0NO_INDUK") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "benefita"."log_perubahan_perusahaan" ADD CONSTRAINT "log_perubahan_perusahaan_perusahaan_id_fkey" FOREIGN KEY ("perusahaan_id") REFERENCES "benefita"."TabPerusahaan"("0NO_INDUK") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "benefita"."tabposperusahaan" ADD CONSTRAINT "tabposperusahaan_NO_INDUK_fkey" FOREIGN KEY ("NO_INDUK") REFERENCES "benefita"."TabPerusahaan"("0NO_INDUK") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "benefita"."permohonan_hak_akses" ADD CONSTRAINT "permohonan_hak_akses_perusahaan_id_fkey" FOREIGN KEY ("perusahaan_id") REFERENCES "benefita"."TabPerusahaan"("0NO_INDUK") ON DELETE RESTRICT ON UPDATE CASCADE;
