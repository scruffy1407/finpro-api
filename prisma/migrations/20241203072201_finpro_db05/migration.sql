/*
  Warnings:

  - A unique constraint covering the columns `[google_id]` on the table `BaseUsers` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "BaseUsers_google_id_key" ON "BaseUsers"."BaseUsers"("google_id");
