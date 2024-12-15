/*
  Warnings:

  - A unique constraint covering the columns `[userId]` on the table `Company` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[userId]` on the table `JobHunter` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Company_userId_key" ON "Company"."Company"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "JobHunter_userId_key" ON "JobHunter"."JobHunter"("userId");
