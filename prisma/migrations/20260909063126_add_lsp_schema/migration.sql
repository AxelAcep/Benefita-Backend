-- CreateTable
CREATE TABLE "benefita"."tuk" (
    "id" SERIAL NOT NULL,
    "noSK" TEXT NOT NULL,
    "noPenetapan" TEXT,
    "tglSanggup" TIMESTAMP(3),
    "nama" TEXT NOT NULL,
    "alamat" TEXT NOT NULL,
    "telp" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tuk_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "benefita"."asesor" (
    "id" SERIAL NOT NULL,
    "nama" TEXT NOT NULL,
    "noRegAsesor" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "asesor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "benefita"."skema_kualifikasi" (
    "id" SERIAL NOT NULL,
    "kode" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "skema_kualifikasi_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "benefita"."peserta_uji" (
    "id" SERIAL NOT NULL,
    "pesertaTrainingId" INTEGER,
    "nama" TEXT NOT NULL,
    "instansi" TEXT,
    "tempatTinggal" TEXT,
    "email" TEXT,
    "wa" TEXT,
    "skemaId" INTEGER NOT NULL,
    "tukId" INTEGER,
    "asesorId" INTEGER,
    "tglUji" TIMESTAMP(3),
    "noReg" TEXT,
    "noSerBNSP" TEXT,
    "tglTerbit" TIMESTAMP(3),
    "statusHasil" TEXT,
    "suratKetKerja" BOOLEAN NOT NULL DEFAULT false,
    "suratRekom" BOOLEAN NOT NULL DEFAULT false,
    "sertPel" BOOLEAN NOT NULL DEFAULT false,
    "cv" BOOLEAN NOT NULL DEFAULT false,
    "ktp" BOOLEAN NOT NULL DEFAULT false,
    "ijazah" BOOLEAN NOT NULL DEFAULT false,
    "pasFoto" BOOLEAN NOT NULL DEFAULT false,
    "verTUK" BOOLEAN NOT NULL DEFAULT false,
    "ksediaTUK" BOOLEAN NOT NULL DEFAULT false,
    "apl01" BOOLEAN NOT NULL DEFAULT false,
    "apl02" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'CALON',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "peserta_uji_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "skema_kualifikasi_kode_key" ON "benefita"."skema_kualifikasi"("kode");

-- AddForeignKey
ALTER TABLE "benefita"."peserta_uji" ADD CONSTRAINT "peserta_uji_pesertaTrainingId_fkey" FOREIGN KEY ("pesertaTrainingId") REFERENCES "benefita"."peserta_training"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "benefita"."peserta_uji" ADD CONSTRAINT "peserta_uji_skemaId_fkey" FOREIGN KEY ("skemaId") REFERENCES "benefita"."skema_kualifikasi"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "benefita"."peserta_uji" ADD CONSTRAINT "peserta_uji_tukId_fkey" FOREIGN KEY ("tukId") REFERENCES "benefita"."tuk"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "benefita"."peserta_uji" ADD CONSTRAINT "peserta_uji_asesorId_fkey" FOREIGN KEY ("asesorId") REFERENCES "benefita"."asesor"("id") ON DELETE SET NULL ON UPDATE CASCADE;
