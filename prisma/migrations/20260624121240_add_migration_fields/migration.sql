-- AlterTable
ALTER TABLE "benefita"."Pegawai" ADD COLUMN     "akunInfo" TEXT,
ADD COLUMN     "alamat" TEXT,
ADD COLUMN     "instansi" TEXT,
ADD COLUMN     "jenisKelamin" TEXT,
ADD COLUMN     "kodeDepartemen" TEXT,
ADD COLUMN     "nik" TEXT,
ADD COLUMN     "pendidikanTerakhir" TEXT,
ADD COLUMN     "remark" TEXT,
ADD COLUMN     "sisaCuti" INTEGER,
ADD COLUMN     "statusDate" TIMESTAMP(3),
ADD COLUMN     "statusHarian" TEXT,
ADD COLUMN     "statusKaryawan" TEXT,
ADD COLUMN     "statusPerkawinan" TEXT,
ADD COLUMN     "tanggalMasuk" TIMESTAMP(3),
ADD COLUMN     "tempatTanggalLahir" TEXT,
ADD COLUMN     "updatedBy" TEXT,
ADD COLUMN     "userData" TEXT,
ADD COLUMN     "userStatus" TEXT;

-- AlterTable
ALTER TABLE "benefita"."User" ADD COLUMN     "emailGmail" TEXT;
