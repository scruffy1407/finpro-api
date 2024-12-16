/*
  Warnings:

  - You are about to alter the column `expected_salary` on the `Application` table. The data in that column could be lost. The data in that column will be cast from `BigInt` to `Decimal(15,2)`.
  - You are about to alter the column `salary_min` on the `JobPost` table. The data in that column could be lost. The data in that column will be cast from `BigInt` to `Decimal(15,2)`.
  - You are about to alter the column `salary_max` on the `JobPost` table. The data in that column could be lost. The data in that column will be cast from `BigInt` to `Decimal(15,2)`.
  - You are about to alter the column `expected_salary` on the `JobHunter` table. The data in that column could be lost. The data in that column will be cast from `BigInt` to `Decimal(15,2)`.

*/
-- AlterTable
ALTER TABLE "Application"."Application" ALTER COLUMN "expected_salary" SET DEFAULT 0,
ALTER COLUMN "expected_salary" SET DATA TYPE DECIMAL(15,2);

-- AlterTable
ALTER TABLE "Company"."JobPost" ALTER COLUMN "salary_min" SET DEFAULT 0,
ALTER COLUMN "salary_min" SET DATA TYPE DECIMAL(15,2),
ALTER COLUMN "salary_max" SET DEFAULT 0,
ALTER COLUMN "salary_max" SET DATA TYPE DECIMAL(15,2);

-- AlterTable
ALTER TABLE "JobHunter"."JobHunter" ALTER COLUMN "expected_salary" SET DEFAULT 0,
ALTER COLUMN "expected_salary" SET DATA TYPE DECIMAL(15,2);
