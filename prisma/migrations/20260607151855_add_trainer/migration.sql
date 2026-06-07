-- CreateTable
CREATE TABLE "benefita"."kontak" (
    "id" SERIAL NOT NULL,
    "kode" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "referensi" TEXT,
    "alamat" TEXT,
    "subjekKhusus" TEXT,
    "telp" TEXT,
    "keterangan" TEXT,
    "email" TEXT,
    "tugas" TIMESTAMP(3),
    "kantor" TEXT,
    "alamatKantor" TEXT,
    "noTelpKantor" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "kontak_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "kontak_kode_key" ON "benefita"."kontak"("kode");
