-- CreateTable
CREATE TABLE "benefita"."log_perubahan_perusahaan" (
    "id" TEXT NOT NULL,
    "perusahaan_id" TEXT NOT NULL,
    "field" TEXT NOT NULL,
    "data_lama" JSONB,
    "data_baru" JSONB,
    "diubah_oleh" TEXT NOT NULL,
    "tanggal" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "log_perubahan_perusahaan_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "log_perubahan_perusahaan_perusahaan_id_idx" ON "benefita"."log_perubahan_perusahaan"("perusahaan_id");

-- AddForeignKey
ALTER TABLE "benefita"."log_perubahan_perusahaan" ADD CONSTRAINT "log_perubahan_perusahaan_perusahaan_id_fkey" FOREIGN KEY ("perusahaan_id") REFERENCES "benefita"."tabperusahaan"("0NO_INDUK") ON DELETE CASCADE ON UPDATE CASCADE;
