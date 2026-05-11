-- CreateTable
CREATE TABLE "benefita"."HakAksesKaryawan" (
    "id" TEXT NOT NULL,
    "perusahaanId" TEXT NOT NULL,
    "pegawaiId" TEXT NOT NULL,
    "jenisAkses" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "tanggalDibuat" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tanggalDiubah" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HakAksesKaryawan_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "HakAksesKaryawan_perusahaanId_pegawaiId_jenisAkses_key" ON "benefita"."HakAksesKaryawan"("perusahaanId", "pegawaiId", "jenisAkses");

-- AddForeignKey
ALTER TABLE "benefita"."HakAksesKaryawan" ADD CONSTRAINT "HakAksesKaryawan_perusahaanId_fkey" FOREIGN KEY ("perusahaanId") REFERENCES "benefita"."tabperusahaan"("0NO_INDUK") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "benefita"."HakAksesKaryawan" ADD CONSTRAINT "HakAksesKaryawan_pegawaiId_fkey" FOREIGN KEY ("pegawaiId") REFERENCES "benefita"."Pegawai"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
