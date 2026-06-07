/*
  Warnings:

  - You are about to drop the column `accExecutiveId` on the `peserta_training` table. All the data in the column will be lost.
  - Added the required column `inputOleh` to the `peserta_training` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "benefita"."peserta_training" DROP CONSTRAINT "peserta_training_accExecutiveId_fkey";

-- AlterTable
ALTER TABLE "benefita"."peserta_training" DROP COLUMN "accExecutiveId",
ADD COLUMN     "accExecutive" TEXT,
ADD COLUMN     "inputOleh" TEXT NOT NULL,
ADD COLUMN     "ownEnv" TEXT;

-- AddForeignKey
ALTER TABLE "benefita"."peserta_training" ADD CONSTRAINT "peserta_training_inputOleh_fkey" FOREIGN KEY ("inputOleh") REFERENCES "benefita"."Pegawai"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
