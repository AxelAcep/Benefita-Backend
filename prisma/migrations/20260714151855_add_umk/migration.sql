-- DropForeignKey
ALTER TABLE "benefita"."umk" DROP CONSTRAINT "umk_PIC_umk_fkey";

-- DropForeignKey
ALTER TABLE "benefita"."umk" DROP CONSTRAINT "umk_inputter_fkey";

-- AlterTable
ALTER TABLE "benefita"."umk" ALTER COLUMN "PIC_umk" DROP NOT NULL,
ALTER COLUMN "inputter" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "benefita"."umk" ADD CONSTRAINT "umk_PIC_umk_fkey" FOREIGN KEY ("PIC_umk") REFERENCES "benefita"."Pegawai"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "benefita"."umk" ADD CONSTRAINT "umk_inputter_fkey" FOREIGN KEY ("inputter") REFERENCES "benefita"."Pegawai"("id") ON DELETE SET NULL ON UPDATE CASCADE;
