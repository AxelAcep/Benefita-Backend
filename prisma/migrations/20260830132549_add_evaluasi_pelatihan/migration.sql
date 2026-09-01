-- CreateTable
CREATE TABLE "benefita"."evaluasi_pelatihan" (
    "id" SERIAL NOT NULL,
    "pesertaTrainingId" INTEGER NOT NULL,
    "nilaiSistematikaMateri" INTEGER NOT NULL,
    "nilaiTampilanSlide" INTEGER NOT NULL,
    "nilaiAlokasiWaktu" INTEGER NOT NULL,
    "nilaiPenerapanMateri" INTEGER NOT NULL,
    "nilaiPeningkatanKompetensi" INTEGER NOT NULL,
    "nilaiTrainer" INTEGER NOT NULL,
    "manfaatUntukPeserta" TEXT,
    "manfaatUntukPerusahaan" TEXT,
    "divisiDisarankan" TEXT,
    "prosedurPengajuan" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "evaluasi_pelatihan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "benefita"."evaluasi_pelatihan_diminati" (
    "evaluasiId" INTEGER NOT NULL,
    "judulTrainingId" INTEGER NOT NULL,

    CONSTRAINT "evaluasi_pelatihan_diminati_pkey" PRIMARY KEY ("evaluasiId","judulTrainingId")
);

-- CreateIndex
CREATE UNIQUE INDEX "evaluasi_pelatihan_pesertaTrainingId_key" ON "benefita"."evaluasi_pelatihan"("pesertaTrainingId");

-- AddForeignKey
ALTER TABLE "benefita"."evaluasi_pelatihan" ADD CONSTRAINT "evaluasi_pelatihan_pesertaTrainingId_fkey" FOREIGN KEY ("pesertaTrainingId") REFERENCES "benefita"."peserta_training"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "benefita"."evaluasi_pelatihan_diminati" ADD CONSTRAINT "evaluasi_pelatihan_diminati_evaluasiId_fkey" FOREIGN KEY ("evaluasiId") REFERENCES "benefita"."evaluasi_pelatihan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "benefita"."evaluasi_pelatihan_diminati" ADD CONSTRAINT "evaluasi_pelatihan_diminati_judulTrainingId_fkey" FOREIGN KEY ("judulTrainingId") REFERENCES "benefita"."judul_training"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
