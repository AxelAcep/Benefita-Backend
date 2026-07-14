/*
  Warnings:

  - You are about to drop the `table_jenis_biaya` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `table_neraca` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "benefita"."table_neraca" DROP CONSTRAINT "table_neraca_jenisBiayaId_fkey";

-- DropTable
DROP TABLE "benefita"."table_jenis_biaya";

-- DropTable
DROP TABLE "benefita"."table_neraca";

-- CreateTable
CREATE TABLE "benefita"."TableJenisBiaya" (
    "id" SERIAL NOT NULL,
    "kode" TEXT NOT NULL,
    "ket" TEXT,

    CONSTRAINT "TableJenisBiaya_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "benefita"."TableNeraca" (
    "id" SERIAL NOT NULL,
    "tanggal" TIMESTAMP(3) NOT NULL,
    "jenisBiayaId" INTEGER NOT NULL,
    "uraian" TEXT,
    "bukti" TEXT,
    "debit" BIGINT,
    "kredit" BIGINT,
    "saldo" BIGINT,
    "periode" TEXT,
    "userInputId" TEXT,
    "tanggalInput" TIMESTAMP(3),
    "userUpdateId" TEXT,
    "tanggalUpdate" TIMESTAMP(3),

    CONSTRAINT "TableNeraca_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TableJenisBiaya_kode_key" ON "benefita"."TableJenisBiaya"("kode");

-- AddForeignKey
ALTER TABLE "benefita"."TableNeraca" ADD CONSTRAINT "TableNeraca_jenisBiayaId_fkey" FOREIGN KEY ("jenisBiayaId") REFERENCES "benefita"."TableJenisBiaya"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "benefita"."TableNeraca" ADD CONSTRAINT "TableNeraca_userInputId_fkey" FOREIGN KEY ("userInputId") REFERENCES "benefita"."Pegawai"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "benefita"."TableNeraca" ADD CONSTRAINT "TableNeraca_userUpdateId_fkey" FOREIGN KEY ("userUpdateId") REFERENCES "benefita"."Pegawai"("id") ON DELETE SET NULL ON UPDATE CASCADE;
