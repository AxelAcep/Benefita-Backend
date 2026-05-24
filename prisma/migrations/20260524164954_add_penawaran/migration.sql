-- CreateTable
CREATE TABLE "benefita"."penawaran" (
    "id" TEXT NOT NULL,
    "kodePelatihan" TEXT[],
    "tanggal" TIMESTAMP(3) NOT NULL,
    "filePath" VARCHAR(500) NOT NULL,

    CONSTRAINT "penawaran_pkey" PRIMARY KEY ("id")
);
