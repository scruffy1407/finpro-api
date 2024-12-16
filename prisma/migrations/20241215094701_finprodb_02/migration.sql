/*
  Warnings:

  - You are about to alter the column `expected_salary` on the `Application` table. The data in that column could be lost. The data in that column will be cast from `Decimal(10,2)` to `BigInt`.
  - You are about to alter the column `salary_min` on the `JobPost` table. The data in that column could be lost. The data in that column will be cast from `Decimal(10,2)` to `BigInt`.
  - You are about to alter the column `salary_max` on the `JobPost` table. The data in that column could be lost. The data in that column will be cast from `Decimal(10,2)` to `BigInt`.
  - You are about to alter the column `expected_salary` on the `JobHunter` table. The data in that column could be lost. The data in that column will be cast from `Decimal(10,2)` to `BigInt`.
  - A unique constraint covering the columns `[userId]` on the table `Developer` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Application"."Application" ALTER COLUMN "expected_salary" SET DEFAULT 0,
ALTER COLUMN "expected_salary" SET DATA TYPE BIGINT;

-- AlterTable
ALTER TABLE "Company"."JobPost" ALTER COLUMN "salary_min" SET DEFAULT 0,
ALTER COLUMN "salary_min" SET DATA TYPE BIGINT,
ALTER COLUMN "salary_max" SET DEFAULT 0,
ALTER COLUMN "salary_max" SET DATA TYPE BIGINT;

-- AlterTable
ALTER TABLE "JobHunter"."JobHunter" ALTER COLUMN "expected_salary" SET DEFAULT 0,
ALTER COLUMN "expected_salary" SET DATA TYPE BIGINT;

-- CreateIndex
CREATE UNIQUE INDEX "Developer_userId_key" ON "Developer"."Developer"("userId");
