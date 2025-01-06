/*
  Warnings:

  - Added the required column `end_date` to the `SkillAsessmentCompletion` table without a default value. This is not possible if the table is not empty.
  - Added the required column `isRefreshed` to the `SkillAsessmentCompletion` table without a default value. This is not possible if the table is not empty.
  - Added the required column `start_date` to the `SkillAsessmentCompletion` table without a default value. This is not possible if the table is not empty.
  - Added the required column `correct_answer` to the `SkillAsessmentQuestion` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
ALTER TYPE "SkillAssessment"."CompletionStatusSkillAssessment" ADD VALUE 'ongoing';

-- AlterTable
ALTER TABLE "SkillAssessment"."SkillAsessmentCompletion" ADD COLUMN     "end_date" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "isRefreshed" BOOLEAN NOT NULL,
ADD COLUMN     "start_date" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "SkillAssessment"."SkillAsessmentQuestion" ADD COLUMN     "correct_answer" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "SkillAssessment"."SkillAssessment" ALTER COLUMN "passing_grade" SET DEFAULT 75;
