-- CreateEnum
CREATE TYPE "benefita"."ResponMA" AS ENUM ('PENDING', 'DISETUJUI', 'DITOLAK');

-- CreateTable
CREATE TABLE "benefita"."pengajuan_judul_training" (
    "id" TEXT NOT NULL,
    "judulTraining" TEXT NOT NULL,
    "jumlahHari" INTEGER NOT NULL,
    "namaKontak" TEXT,
    "kontak" TEXT,
    "jumlahPeserta" INTEGER,
    "responMA" "benefita"."ResponMA" NOT NULL DEFAULT 'PENDING',
    "perusahaanId" TEXT NOT NULL,
    "inputOlehId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pengajuan_judul_training_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "benefita"."pengajuan_judul_training" ADD CONSTRAINT "pengajuan_judul_training_perusahaanId_fkey" FOREIGN KEY ("perusahaanId") REFERENCES "benefita"."TabPerusahaan"("0NO_INDUK") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "benefita"."pengajuan_judul_training" ADD CONSTRAINT "pengajuan_judul_training_inputOlehId_fkey" FOREIGN KEY ("inputOlehId") REFERENCES "benefita"."Pegawai"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
