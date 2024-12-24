/*
  Warnings:

  - Added the required column `workExperienceId` to the `JobReview` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "JobHunter"."JobReview" ADD COLUMN     "workExperienceId" INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE "JobHunter"."JobReview" ADD CONSTRAINT "JobReview_workExperienceId_fkey" FOREIGN KEY ("workExperienceId") REFERENCES "JobHunter"."WorkExperience"("work_experience_id") ON DELETE RESTRICT ON UPDATE CASCADE;
