-- DropForeignKey
ALTER TABLE "benefita"."peserta_training" DROP CONSTRAINT "peserta_training_noIndukPerusahaan_fkey";

-- AlterTable
ALTER TABLE "benefita"."peserta_training" ALTER COLUMN "noIndukPerusahaan" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "benefita"."peserta_training" ADD CONSTRAINT "peserta_training_noIndukPerusahaan_fkey" FOREIGN KEY ("noIndukPerusahaan") REFERENCES "benefita"."TabPerusahaan"("0NO_INDUK") ON DELETE SET NULL ON UPDATE CASCADE;
