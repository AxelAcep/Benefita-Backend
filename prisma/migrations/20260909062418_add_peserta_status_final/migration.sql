-- AlterTable
ALTER TABLE "benefita"."peserta_training" ADD COLUMN     "finalOleh" TEXT,
ADD COLUMN     "finalTgl" TIMESTAMP(3),
ADD COLUMN     "statusFinal" BOOLEAN NOT NULL DEFAULT false;

-- AddForeignKey
ALTER TABLE "benefita"."peserta_training" ADD CONSTRAINT "peserta_training_finalOleh_fkey" FOREIGN KEY ("finalOleh") REFERENCES "benefita"."Pegawai"("id") ON DELETE SET NULL ON UPDATE CASCADE;
