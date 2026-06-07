-- CreateTable
CREATE TABLE "benefita"."jadwal_training" (
    "id" SERIAL NOT NULL,
    "noJadwal" TEXT NOT NULL,
    "kodePelatihan" TEXT NOT NULL,
    "tglMulai" TIMESTAMP(3),
    "tglSelesai" TIMESTAMP(3),
    "judulLengkap" TEXT NOT NULL,
    "judulPendek" TEXT NOT NULL,
    "metode" TEXT NOT NULL,
    "jenisTraining" TEXT NOT NULL,
    "kota" TEXT NOT NULL,
    "lokasiDetail" TEXT,
    "biaya" INTEGER NOT NULL,
    "catatan" TEXT,
    "fileAgenda" TEXT,
    "lastUpdate" TIMESTAMP(3) NOT NULL,
    "updateOleh" TEXT NOT NULL,

    CONSTRAINT "jadwal_training_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "benefita"."trainer_on_jadwal" (
    "jadwalId" INTEGER NOT NULL,
    "trainerKode" TEXT NOT NULL,

    CONSTRAINT "trainer_on_jadwal_pkey" PRIMARY KEY ("jadwalId","trainerKode")
);

-- CreateIndex
CREATE UNIQUE INDEX "jadwal_training_noJadwal_key" ON "benefita"."jadwal_training"("noJadwal");

-- AddForeignKey
ALTER TABLE "benefita"."jadwal_training" ADD CONSTRAINT "jadwal_training_updateOleh_fkey" FOREIGN KEY ("updateOleh") REFERENCES "benefita"."Pegawai"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "benefita"."jadwal_training" ADD CONSTRAINT "jadwal_training_kodePelatihan_fkey" FOREIGN KEY ("kodePelatihan") REFERENCES "benefita"."judul_training"("kode") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "benefita"."trainer_on_jadwal" ADD CONSTRAINT "trainer_on_jadwal_jadwalId_fkey" FOREIGN KEY ("jadwalId") REFERENCES "benefita"."jadwal_training"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "benefita"."trainer_on_jadwal" ADD CONSTRAINT "trainer_on_jadwal_trainerKode_fkey" FOREIGN KEY ("trainerKode") REFERENCES "benefita"."kontak"("kode") ON DELETE RESTRICT ON UPDATE CASCADE;
