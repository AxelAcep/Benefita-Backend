-- CreateTable
CREATE TABLE "benefita"."tabposperusahaan" (
    "id" TEXT NOT NULL,
    "nama" VARCHAR(255) NOT NULL,
    "jabatan" VARCHAR(255) NOT NULL,
    "FOLLOW_UP" VARCHAR(255),
    "NO_INDUK" VARCHAR(50) NOT NULL,

    CONSTRAINT "tabposperusahaan_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "benefita"."tabposperusahaan" ADD CONSTRAINT "tabposperusahaan_NO_INDUK_fkey" FOREIGN KEY ("NO_INDUK") REFERENCES "benefita"."tabperusahaan"("0NO_INDUK") ON DELETE RESTRICT ON UPDATE CASCADE;
