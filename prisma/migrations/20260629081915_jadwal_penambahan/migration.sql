-- AlterTable
ALTER TABLE "benefita"."jadwal_training" ADD COLUMN     "batch" INTEGER,
ADD COLUMN     "durasi" INTEGER,
ADD COLUMN     "penawaran" TEXT,
ADD COLUMN     "periode" TEXT,
ADD COLUMN     "statusPrio" TEXT,
ADD COLUMN     "statusTr" TEXT,
ADD COLUMN     "tglRencana" TIMESTAMP(3),
ADD COLUMN     "tipe" TEXT,
ADD COLUMN     "trainer" TEXT,
ADD COLUMN     "updTgl" TIMESTAMP(3);
