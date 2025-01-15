-- AlterTable
ALTER TABLE "PreSelectionTest"."PreSelectionTest" ADD COLUMN     "companyId" INTEGER NOT NULL DEFAULT 1;

-- AddForeignKey
ALTER TABLE "PreSelectionTest"."PreSelectionTest" ADD CONSTRAINT "PreSelectionTest_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"."Company"("company_id") ON DELETE RESTRICT ON UPDATE CASCADE;
