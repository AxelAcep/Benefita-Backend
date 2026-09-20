-- CreateEnum
CREATE TYPE "benefita"."KategoriAkun" AS ENUM ('KAS_BANK', 'PIUTANG_USAHA', 'PIUTANG_LAINNYA', 'AKTIVA_TETAP', 'HUTANG_LANCAR', 'HUTANG_JANGKA_PANJANG', 'MODAL_AKUN');

-- AlterTable
ALTER TABLE "benefita"."akun" ADD COLUMN     "kategori" "benefita"."KategoriAkun";

