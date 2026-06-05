-- CreateTable
CREATE TABLE "benefita"."SertifikasiBnsp" (
    "id" SERIAL NOT NULL,
    "perusahaanId" VARCHAR(50) NOT NULL,
    "pppa" VARCHAR(255),
    "popal" VARCHAR(255),
    "pppu" VARCHAR(255),
    "poippu" VARCHAR(255),
    "limbahB3" VARCHAR(255),
    "tpsLb3" VARCHAR(255),
    "sampah3R" VARCHAR(255),
    "pSampah" VARCHAR(255),
    "aEnergi" VARCHAR(255),
    "mEnergi" VARCHAR(255),
    "pcua" VARCHAR(255),
    "lca" VARCHAR(255),

    CONSTRAINT "SertifikasiBnsp_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "benefita"."Proper" (
    "id" SERIAL NOT NULL,
    "perusahaanId" VARCHAR(50) NOT NULL,
    "tahun" INTEGER NOT NULL,
    "emas" INTEGER NOT NULL DEFAULT 0,
    "hijau" INTEGER NOT NULL DEFAULT 0,
    "biru" INTEGER NOT NULL DEFAULT 0,
    "merah" INTEGER NOT NULL DEFAULT 0,
    "hitam" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Proper_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "benefita"."SertifikasiBnsp" ADD CONSTRAINT "SertifikasiBnsp_perusahaanId_fkey" FOREIGN KEY ("perusahaanId") REFERENCES "benefita"."TabPerusahaan"("0NO_INDUK") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "benefita"."Proper" ADD CONSTRAINT "Proper_perusahaanId_fkey" FOREIGN KEY ("perusahaanId") REFERENCES "benefita"."TabPerusahaan"("0NO_INDUK") ON DELETE RESTRICT ON UPDATE CASCADE;
