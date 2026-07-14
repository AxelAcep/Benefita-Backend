-- CreateTable
CREATE TABLE "benefita"."table_jenis_biaya" (
    "id" TEXT NOT NULL,
    "kode" TEXT NOT NULL,
    "ket" TEXT,

    CONSTRAINT "table_jenis_biaya_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "benefita"."table_neraca" (
    "id" TEXT NOT NULL,
    "tanggal" TIMESTAMP(3) NOT NULL,
    "jenisBiayaId" TEXT NOT NULL,
    "uraian" TEXT NOT NULL,
    "bukti" TEXT,
    "debit" DOUBLE PRECISION,
    "kredit" DOUBLE PRECISION,
    "saldo" DOUBLE PRECISION,
    "periode" TEXT NOT NULL,
    "userInput" TEXT NOT NULL,
    "tanggalInput" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userUpdate" TEXT,
    "tanggalUpdate" TIMESTAMP(3),

    CONSTRAINT "table_neraca_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "table_jenis_biaya_kode_key" ON "benefita"."table_jenis_biaya"("kode");

-- AddForeignKey
ALTER TABLE "benefita"."table_neraca" ADD CONSTRAINT "table_neraca_jenisBiayaId_fkey" FOREIGN KEY ("jenisBiayaId") REFERENCES "benefita"."table_jenis_biaya"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
