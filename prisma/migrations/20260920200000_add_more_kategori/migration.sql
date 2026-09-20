-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "benefita"."KategoriAkun" ADD VALUE 'UANG_MUKA';
ALTER TYPE "benefita"."KategoriAkun" ADD VALUE 'BEBAN_DIBAYAR_DIMUKA';
ALTER TYPE "benefita"."KategoriAkun" ADD VALUE 'HARGA_POKOK_JASA';

