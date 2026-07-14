-- CreateTable
CREATE TABLE "benefita"."umk" (
    "id" SERIAL NOT NULL,
    "TglInput_umk" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "No_umk" TEXT NOT NULL,
    "Jumlah_umk" INTEGER NOT NULL,
    "PIC_umk" TEXT NOT NULL,
    "Tujuan_umk" TEXT NOT NULL,
    "TglPeyerahanUang_umk" TEXT,
    "Realisasi_umk" INTEGER NOT NULL,
    "TglPutm_kmk" TEXT,
    "SisaUang_umk" INTEGER NOT NULL,
    "Ket_umk" TEXT,
    "Periode_umk" TEXT NOT NULL,
    "inputter" TEXT NOT NULL,

    CONSTRAINT "umk_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "umk_No_umk_key" ON "benefita"."umk"("No_umk");

-- AddForeignKey
ALTER TABLE "benefita"."umk" ADD CONSTRAINT "umk_PIC_umk_fkey" FOREIGN KEY ("PIC_umk") REFERENCES "benefita"."Pegawai"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "benefita"."umk" ADD CONSTRAINT "umk_inputter_fkey" FOREIGN KEY ("inputter") REFERENCES "benefita"."Pegawai"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
