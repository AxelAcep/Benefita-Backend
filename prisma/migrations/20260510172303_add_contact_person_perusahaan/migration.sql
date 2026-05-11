-- CreateTable
CREATE TABLE "benefita"."contact_person_perusahaan" (
    "KODE" VARCHAR(50) NOT NULL,
    "KODE_PERUSAHAAN" VARCHAR(50) NOT NULL,
    "NAMA" VARCHAR(255) NOT NULL,
    "TEKNIS_TERTINGGI" BOOLEAN NOT NULL DEFAULT false,
    "JABATAN" VARCHAR(255),
    "HP" VARCHAR(50),
    "EMAIL" VARCHAR(255),
    "POSISI" VARCHAR(50),
    "KEUANGAN" VARCHAR(50),
    "MINTA" VARCHAR(255),
    "KET" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contact_person_perusahaan_pkey" PRIMARY KEY ("KODE")
);

-- CreateIndex
CREATE INDEX "contact_person_perusahaan_KODE_PERUSAHAAN_idx" ON "benefita"."contact_person_perusahaan"("KODE_PERUSAHAAN");

-- AddForeignKey
ALTER TABLE "benefita"."contact_person_perusahaan" ADD CONSTRAINT "contact_person_perusahaan_KODE_PERUSAHAAN_fkey" FOREIGN KEY ("KODE_PERUSAHAAN") REFERENCES "benefita"."tabperusahaan"("0NO_INDUK") ON DELETE CASCADE ON UPDATE CASCADE;
