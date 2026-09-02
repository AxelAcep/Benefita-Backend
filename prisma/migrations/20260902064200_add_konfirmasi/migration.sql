-- CreateTable
CREATE TABLE "benefita"."konfirmasi" (
    "id" SERIAL NOT NULL,
    "noKonfirmasi" TEXT NOT NULL,
    "tanggalKonfirmasi" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tanggalPelatihan" TIMESTAMP(3),
    "metode" TEXT NOT NULL,
    "kepada" TEXT,
    "kodePelatihan" TEXT,
    "namaPeserta" TEXT NOT NULL,
    "jabatan" TEXT,
    "kontak" TEXT,
    "filePath" TEXT,
    "noIndukInstansi" TEXT,
    "instansiNama" TEXT,
    "noJadwal" TEXT NOT NULL,
    "pesertaTrainingId" INTEGER NOT NULL,
    "dibuatOlehId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "konfirmasi_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "konfirmasi_noKonfirmasi_key" ON "benefita"."konfirmasi"("noKonfirmasi");

-- AddForeignKey
ALTER TABLE "benefita"."konfirmasi" ADD CONSTRAINT "konfirmasi_noIndukInstansi_fkey" FOREIGN KEY ("noIndukInstansi") REFERENCES "benefita"."TabPerusahaan"("0NO_INDUK") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "benefita"."konfirmasi" ADD CONSTRAINT "konfirmasi_noJadwal_fkey" FOREIGN KEY ("noJadwal") REFERENCES "benefita"."jadwal_training"("noJadwal") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "benefita"."konfirmasi" ADD CONSTRAINT "konfirmasi_pesertaTrainingId_fkey" FOREIGN KEY ("pesertaTrainingId") REFERENCES "benefita"."peserta_training"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "benefita"."konfirmasi" ADD CONSTRAINT "konfirmasi_dibuatOlehId_fkey" FOREIGN KEY ("dibuatOlehId") REFERENCES "benefita"."Pegawai"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
