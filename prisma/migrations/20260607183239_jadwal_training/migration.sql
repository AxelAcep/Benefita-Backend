/*
  Warnings:

  - Added the required column `status` to the `jadwal_training` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "benefita"."jadwal_training" ADD COLUMN     "status" TEXT NOT NULL;
