/*
  Warnings:

  - Added the required column `isRefreshed` to the `ResultPreSelection` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "Application"."ApplicationStatus" ADD VALUE 'onTest';
ALTER TYPE "Application"."ApplicationStatus" ADD VALUE 'waitingSubmission';

-- AlterEnum
ALTER TYPE "PreSelectionTest"."CompletionStatusPreSelectionTest" ADD VALUE 'ongoing';

-- AlterTable
ALTER TABLE "JobHunter"."WorkExperience" ADD COLUMN     "end_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "start_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "PreSelectionTest"."ResultPreSelection" ADD COLUMN     "isRefreshed" BOOLEAN NOT NULL;
