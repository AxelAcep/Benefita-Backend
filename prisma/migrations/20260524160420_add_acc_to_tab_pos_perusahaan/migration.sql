/*
  Warnings:

  - Added the required column `ACC` to the `tabposperusahaan` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "benefita"."tabposperusahaan" ADD COLUMN     "ACC" VARCHAR(255) NOT NULL;
