-- CreateTable
CREATE TABLE "benefita"."judul_training" (
    "id" SERIAL NOT NULL,
    "kode" TEXT NOT NULL,
    "judulTraining" TEXT NOT NULL,
    "tipe" TEXT NOT NULL,
    "hari" INTEGER NOT NULL,
    "biayaOffline" INTEGER NOT NULL,
    "biayaOnline" INTEGER NOT NULL,
    "batch" INTEGER NOT NULL,
    "brosur" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "judul_training_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "judul_training_kode_key" ON "benefita"."judul_training"("kode");
