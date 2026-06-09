-- CreateEnum
CREATE TYPE "benefita"."TipeSurat" AS ENUM ('umum', 'marketing', 'lsp');

-- CreateTable
CREATE TABLE "benefita"."permintaan_nomor_surat" (
    "id" SERIAL NOT NULL,
    "noSurat" VARCHAR(100) NOT NULL,
    "keterangan" TEXT,
    "tanggal_kirim" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tipe" "benefita"."TipeSurat" NOT NULL DEFAULT 'umum',
    "tujuan_no_induk" VARCHAR(50) NOT NULL,
    "pengirim_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "permintaan_nomor_surat_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "permintaan_nomor_surat_noSurat_key" ON "benefita"."permintaan_nomor_surat"("noSurat");

-- CreateIndex
CREATE UNIQUE INDEX "permintaan_nomor_surat_tujuan_no_induk_pengirim_id_tanggal__key" ON "benefita"."permintaan_nomor_surat"("tujuan_no_induk", "pengirim_id", "tanggal_kirim");

-- AddForeignKey
ALTER TABLE "benefita"."permintaan_nomor_surat" ADD CONSTRAINT "permintaan_nomor_surat_tujuan_no_induk_fkey" FOREIGN KEY ("tujuan_no_induk") REFERENCES "benefita"."TabPerusahaan"("0NO_INDUK") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "benefita"."permintaan_nomor_surat" ADD CONSTRAINT "permintaan_nomor_surat_pengirim_id_fkey" FOREIGN KEY ("pengirim_id") REFERENCES "benefita"."Pegawai"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
