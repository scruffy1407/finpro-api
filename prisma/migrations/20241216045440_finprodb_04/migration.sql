-- AlterTable
ALTER TABLE "Company"."JobPost" ADD COLUMN     "deleted" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "PreSelectionTest"."PreSelectionTest" ADD COLUMN     "deleted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "duration" INTEGER NOT NULL DEFAULT 30,
ADD COLUMN     "passing_grade" INTEGER NOT NULL DEFAULT 85;

-- AlterTable
ALTER TABLE "SkillAssessment"."SkillAssessment" ADD COLUMN     "deleted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "duration" INTEGER NOT NULL DEFAULT 30,
ADD COLUMN     "passing_grade" INTEGER NOT NULL DEFAULT 85;
