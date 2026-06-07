-- CreateTable
CREATE TABLE "benefita"."peserta_training" (
    "id" SERIAL NOT NULL,
    "nama" TEXT NOT NULL,
    "jabatan" TEXT,
    "alamat" TEXT,
    "noTelp" TEXT,
    "noFax" TEXT,
    "email" TEXT,
    "alamatPengirimanSertifikat" TEXT,
    "catatan" TEXT,
    "industri" TEXT,
    "status" TEXT,
    "noIndukPerusahaan" TEXT NOT NULL,
    "noJadwal" TEXT NOT NULL,
    "ujian" BOOLEAN DEFAULT false,
    "noInvUjian" TEXT,
    "noKwtUjian" TEXT,
    "diskon" INTEGER,
    "ppn" INTEGER,
    "cashback" INTEGER,
    "hargaTotal" INTEGER,
    "bayar" INTEGER,
    "infoPembayaran" TEXT,
    "infoPenagihan" TEXT,
    "tglBayar" TIMESTAMP(3),
    "noInvoice" TEXT,
    "noKwitansi" TEXT,
    "accExecutiveId" TEXT NOT NULL,
    "updateOleh" TEXT,
    "konfirmasiOleh" TEXT,
    "tglInput" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tglUpdate" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "peserta_training_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "benefita"."peserta_training" ADD CONSTRAINT "peserta_training_noIndukPerusahaan_fkey" FOREIGN KEY ("noIndukPerusahaan") REFERENCES "benefita"."TabPerusahaan"("0NO_INDUK") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "benefita"."peserta_training" ADD CONSTRAINT "peserta_training_noJadwal_fkey" FOREIGN KEY ("noJadwal") REFERENCES "benefita"."jadwal_training"("noJadwal") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "benefita"."peserta_training" ADD CONSTRAINT "peserta_training_accExecutiveId_fkey" FOREIGN KEY ("accExecutiveId") REFERENCES "benefita"."Pegawai"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "benefita"."peserta_training" ADD CONSTRAINT "peserta_training_updateOleh_fkey" FOREIGN KEY ("updateOleh") REFERENCES "benefita"."Pegawai"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "benefita"."peserta_training" ADD CONSTRAINT "peserta_training_konfirmasiOleh_fkey" FOREIGN KEY ("konfirmasiOleh") REFERENCES "benefita"."Pegawai"("id") ON DELETE SET NULL ON UPDATE CASCADE;
