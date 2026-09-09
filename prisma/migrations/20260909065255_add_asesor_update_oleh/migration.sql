-- AlterTable
ALTER TABLE "benefita"."asesor" ADD COLUMN     "updateOleh" TEXT;

-- AddForeignKey
ALTER TABLE "benefita"."asesor" ADD CONSTRAINT "asesor_updateOleh_fkey" FOREIGN KEY ("updateOleh") REFERENCES "benefita"."Pegawai"("id") ON DELETE SET NULL ON UPDATE CASCADE;
