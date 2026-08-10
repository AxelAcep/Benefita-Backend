-- CreateTable
CREATE TABLE "benefita"."lini_bisnis" (
    "id" SERIAL NOT NULL,
    "nama" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lini_bisnis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "benefita"."lini_bisnis_training" (
    "id" SERIAL NOT NULL,
    "liniBisnisId" INTEGER NOT NULL,
    "judulTrainingId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lini_bisnis_training_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "lini_bisnis_nama_key" ON "benefita"."lini_bisnis"("nama");

-- CreateIndex
CREATE UNIQUE INDEX "lini_bisnis_training_liniBisnisId_judulTrainingId_key" ON "benefita"."lini_bisnis_training"("liniBisnisId", "judulTrainingId");

-- AddForeignKey
ALTER TABLE "benefita"."lini_bisnis_training" ADD CONSTRAINT "lini_bisnis_training_liniBisnisId_fkey" FOREIGN KEY ("liniBisnisId") REFERENCES "benefita"."lini_bisnis"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "benefita"."lini_bisnis_training" ADD CONSTRAINT "lini_bisnis_training_judulTrainingId_fkey" FOREIGN KEY ("judulTrainingId") REFERENCES "benefita"."judul_training"("id") ON DELETE CASCADE ON UPDATE CASCADE;
