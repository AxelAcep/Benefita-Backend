-- CreateTable
CREATE TABLE "benefita"."berita" (
    "id" TEXT NOT NULL,
    "periode" TIMESTAMP(3) NOT NULL,
    "isi" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "berita_pkey" PRIMARY KEY ("id")
);
