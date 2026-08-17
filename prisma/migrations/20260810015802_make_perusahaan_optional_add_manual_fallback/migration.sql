-- DropForeignKey
ALTER TABLE "benefita"."pengajuan_judul_training" DROP CONSTRAINT "pengajuan_judul_training_perusahaanId_fkey";

-- AlterTable
ALTER TABLE "benefita"."pengajuan_judul_training" ADD COLUMN     "namaPerusahaanManual" TEXT,
ALTER COLUMN "perusahaanId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "benefita"."pengajuan_judul_training" ADD CONSTRAINT "pengajuan_judul_training_perusahaanId_fkey" FOREIGN KEY ("perusahaanId") REFERENCES "benefita"."TabPerusahaan"("0NO_INDUK") ON DELETE SET NULL ON UPDATE CASCADE;
