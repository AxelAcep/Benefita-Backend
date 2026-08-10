-- AlterTable
ALTER TABLE "benefita"."TabPerusahaan" ADD COLUMN     "liniBisnisId" INTEGER,
ADD COLUMN     "liniBisnisNote" TEXT;

-- AddForeignKey
ALTER TABLE "benefita"."TabPerusahaan" ADD CONSTRAINT "TabPerusahaan_liniBisnisId_fkey" FOREIGN KEY ("liniBisnisId") REFERENCES "benefita"."lini_bisnis"("id") ON DELETE SET NULL ON UPDATE CASCADE;
