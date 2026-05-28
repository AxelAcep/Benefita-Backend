-- CreateTable
CREATE TABLE "benefita"."permohonan_hak_akses" (
    "id" TEXT NOT NULL,
    "perusahaan_id" TEXT NOT NULL,
    "pegawai_id" TEXT NOT NULL,
    "jenis_akses" VARCHAR(10) NOT NULL,
    "terima" BOOLEAN,
    "tanggal" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "permohonan_hak_akses_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "benefita"."permohonan_hak_akses" ADD CONSTRAINT "permohonan_hak_akses_perusahaan_id_fkey" FOREIGN KEY ("perusahaan_id") REFERENCES "benefita"."tabperusahaan"("0NO_INDUK") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "benefita"."permohonan_hak_akses" ADD CONSTRAINT "permohonan_hak_akses_pegawai_id_fkey" FOREIGN KEY ("pegawai_id") REFERENCES "benefita"."Pegawai"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
