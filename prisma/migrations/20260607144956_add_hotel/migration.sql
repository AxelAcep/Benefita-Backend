-- CreateTable
CREATE TABLE "benefita"."hotel" (
    "id" TEXT NOT NULL,
    "kode_hotel" TEXT NOT NULL,
    "nama_hotel" TEXT NOT NULL,
    "alamat" TEXT NOT NULL,
    "kota" TEXT NOT NULL,
    "telepon" TEXT NOT NULL,
    "fax" TEXT,
    "pub_rate" INTEGER,
    "cor_rate" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hotel_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "hotel_kode_hotel_key" ON "benefita"."hotel"("kode_hotel");
