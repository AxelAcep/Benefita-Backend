-- AlterTable
ALTER TABLE "benefita"."Pegawai" ADD COLUMN     "kode" TEXT,
ADD COLUMN     "prefix" TEXT,
ALTER COLUMN "jabatan" DROP NOT NULL;
