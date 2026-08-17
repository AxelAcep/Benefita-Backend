-- DropForeignKey
ALTER TABLE "benefita"."permintaan_nomor_surat" DROP CONSTRAINT "permintaan_nomor_surat_tujuan_no_induk_fkey";

-- AlterTable
ALTER TABLE "benefita"."permintaan_nomor_surat" ADD COLUMN     "tujuan_nama" VARCHAR(255),
ALTER COLUMN "tujuan_no_induk" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "benefita"."permintaan_nomor_surat" ADD CONSTRAINT "permintaan_nomor_surat_tujuan_no_induk_fkey" FOREIGN KEY ("tujuan_no_induk") REFERENCES "benefita"."TabPerusahaan"("0NO_INDUK") ON DELETE SET NULL ON UPDATE CASCADE;
