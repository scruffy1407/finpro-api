-- AlterTable
ALTER TABLE "JobHunter"."WorkExperience" ADD COLUMN     "currently_working" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "end_date" DROP NOT NULL;
