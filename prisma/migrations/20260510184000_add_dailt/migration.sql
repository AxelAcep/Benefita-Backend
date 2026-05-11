-- CreateTable
CREATE TABLE "benefita"."daily_activity" (
    "ID" TEXT NOT NULL,
    "PEGAWAI_ID" VARCHAR(50) NOT NULL,
    "PERUSAHAAN_ID" VARCHAR(50) NOT NULL,
    "KONTAK" VARCHAR(255) NOT NULL,
    "JENIS_TRAINING" VARCHAR(255) NOT NULL,
    "KETERANGAN" VARCHAR(255) NOT NULL,
    "KATEGORI" VARCHAR(255) NOT NULL,
    "INOUT" VARCHAR(50) NOT NULL,
    "TANGGAL" VARCHAR(50) NOT NULL,
    "PERUSAHAAN" VARCHAR(255) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "daily_activity_pkey" PRIMARY KEY ("ID")
);

-- CreateIndex
CREATE INDEX "daily_activity_PERUSAHAAN_ID_idx" ON "benefita"."daily_activity"("PERUSAHAAN_ID");

-- CreateIndex
CREATE INDEX "daily_activity_PEGAWAI_ID_idx" ON "benefita"."daily_activity"("PEGAWAI_ID");

-- AddForeignKey
ALTER TABLE "benefita"."daily_activity" ADD CONSTRAINT "daily_activity_PEGAWAI_ID_fkey" FOREIGN KEY ("PEGAWAI_ID") REFERENCES "benefita"."Pegawai"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "benefita"."daily_activity" ADD CONSTRAINT "daily_activity_PERUSAHAAN_ID_fkey" FOREIGN KEY ("PERUSAHAAN_ID") REFERENCES "benefita"."tabperusahaan"("0NO_INDUK") ON DELETE CASCADE ON UPDATE CASCADE;
