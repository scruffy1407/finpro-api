-- DropForeignKey
ALTER TABLE "Company"."JobPost" DROP CONSTRAINT "JobPost_preSelectionTestId_fkey";

-- AlterTable
ALTER TABLE "Company"."JobPost" ALTER COLUMN "preSelectionTestId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Company"."JobPost" ADD CONSTRAINT "JobPost_preSelectionTestId_fkey" FOREIGN KEY ("preSelectionTestId") REFERENCES "PreSelectionTest"."PreSelectionTest"("test_id") ON DELETE SET NULL ON UPDATE CASCADE;
