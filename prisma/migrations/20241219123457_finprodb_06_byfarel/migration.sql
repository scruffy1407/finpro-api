/*
  Warnings:

  - Added the required column `interview_room_code` to the `Interview` table without a default value. This is not possible if the table is not empty.
  - Added the required column `interview_url` to the `Interview` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "PreSelectionTest"."Interview" ADD COLUMN     "interview_room_code" TEXT NOT NULL,
ADD COLUMN     "interview_url" TEXT NOT NULL;
