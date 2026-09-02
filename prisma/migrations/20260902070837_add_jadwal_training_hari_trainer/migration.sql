-- CreateTable
CREATE TABLE "benefita"."jadwal_training_hari" (
    "id" SERIAL NOT NULL,
    "jadwalId" INTEGER NOT NULL,
    "tanggal" DATE NOT NULL,

    CONSTRAINT "jadwal_training_hari_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "benefita"."trainer_on_jadwal_hari" (
    "jadwalHariId" INTEGER NOT NULL,
    "trainerKode" TEXT NOT NULL,

    CONSTRAINT "trainer_on_jadwal_hari_pkey" PRIMARY KEY ("jadwalHariId","trainerKode")
);

-- CreateIndex
CREATE UNIQUE INDEX "jadwal_training_hari_jadwalId_tanggal_key" ON "benefita"."jadwal_training_hari"("jadwalId", "tanggal");

-- AddForeignKey
ALTER TABLE "benefita"."jadwal_training_hari" ADD CONSTRAINT "jadwal_training_hari_jadwalId_fkey" FOREIGN KEY ("jadwalId") REFERENCES "benefita"."jadwal_training"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "benefita"."trainer_on_jadwal_hari" ADD CONSTRAINT "trainer_on_jadwal_hari_jadwalHariId_fkey" FOREIGN KEY ("jadwalHariId") REFERENCES "benefita"."jadwal_training_hari"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "benefita"."trainer_on_jadwal_hari" ADD CONSTRAINT "trainer_on_jadwal_hari_trainerKode_fkey" FOREIGN KEY ("trainerKode") REFERENCES "benefita"."kontak"("kode") ON DELETE RESTRICT ON UPDATE CASCADE;
