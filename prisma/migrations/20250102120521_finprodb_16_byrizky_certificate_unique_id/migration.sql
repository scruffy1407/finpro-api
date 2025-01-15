/*
  Warnings:

  - Added the required column `certificate_unique_id` to the `Certificate` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "SkillAssessment"."Certificate" ADD COLUMN     "certificate_unique_id" TEXT NOT NULL;
