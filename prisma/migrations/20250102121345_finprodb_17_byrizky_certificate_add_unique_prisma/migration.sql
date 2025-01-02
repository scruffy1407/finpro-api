/*
  Warnings:

  - A unique constraint covering the columns `[certificate_unique_id]` on the table `Certificate` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Certificate_certificate_unique_id_key" ON "SkillAssessment"."Certificate"("certificate_unique_id");
