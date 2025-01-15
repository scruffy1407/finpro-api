/*
  Warnings:

  - A unique constraint covering the columns `[test_unique_id]` on the table `PreSelectionTest` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[skill_assessment_unique_id]` on the table `SkillAssessment` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "PreSelectionTest"."PreSelectionTest" ADD COLUMN     "test_unique_id" INTEGER;

-- AlterTable
ALTER TABLE "SkillAssessment"."SkillAssessment" ADD COLUMN     "skill_assessment_unique_id" INTEGER;

-- CreateIndex
CREATE UNIQUE INDEX "PreSelectionTest_test_unique_id_key" ON "PreSelectionTest"."PreSelectionTest"("test_unique_id");

-- CreateIndex
CREATE UNIQUE INDEX "SkillAssessment_skill_assessment_unique_id_key" ON "SkillAssessment"."SkillAssessment"("skill_assessment_unique_id");
