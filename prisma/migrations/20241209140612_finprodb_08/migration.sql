/*
  Warnings:

  - Added the required column `jobPostId` to the `JobWishlist` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "JobHunter"."JobWishlist" DROP CONSTRAINT "JobWishlist_jobHunterId_fkey";

-- AlterTable
ALTER TABLE "Company"."Company" ADD COLUMN     "latitude" INTEGER,
ADD COLUMN     "longitude" INTEGER;

-- AlterTable
ALTER TABLE "JobHunter"."JobWishlist" ADD COLUMN     "jobPostId" INTEGER NOT NULL;

-- CreateTable
CREATE TABLE "Application"."_ApplicationToJobWishlist" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_ApplicationToJobWishlist_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_ApplicationToJobWishlist_B_index" ON "Application"."_ApplicationToJobWishlist"("B");

-- AddForeignKey
ALTER TABLE "JobHunter"."JobWishlist" ADD CONSTRAINT "JobWishlist_jobHunterId_fkey" FOREIGN KEY ("jobHunterId") REFERENCES "JobHunter"."JobHunter"("job_hunter_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobHunter"."JobWishlist" ADD CONSTRAINT "JobWishlist_jobPostId_fkey" FOREIGN KEY ("jobPostId") REFERENCES "Company"."JobPost"("job_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Application"."_ApplicationToJobWishlist" ADD CONSTRAINT "_ApplicationToJobWishlist_A_fkey" FOREIGN KEY ("A") REFERENCES "Application"."Application"("application_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Application"."_ApplicationToJobWishlist" ADD CONSTRAINT "_ApplicationToJobWishlist_B_fkey" FOREIGN KEY ("B") REFERENCES "JobHunter"."JobWishlist"("wishlist_id") ON DELETE CASCADE ON UPDATE CASCADE;
