-- AlterTable
ALTER TABLE "benefita"."tuk" ADD COLUMN     "updateOleh" TEXT;

-- AddForeignKey
ALTER TABLE "benefita"."tuk" ADD CONSTRAINT "tuk_updateOleh_fkey" FOREIGN KEY ("updateOleh") REFERENCES "benefita"."Pegawai"("id") ON DELETE SET NULL ON UPDATE CASCADE;
