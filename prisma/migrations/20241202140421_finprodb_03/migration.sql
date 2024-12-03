/*
  Warnings:

  - Added the required column `developer_name` to the `Developer` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Company"."Company" ALTER COLUMN "company_industry" DROP NOT NULL,
ALTER COLUMN "company_size" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Developer"."Developer" ADD COLUMN     "developer_name" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "JobHunter"."JobHunter" ALTER COLUMN "dob" DROP NOT NULL,
ALTER COLUMN "location_city" DROP NOT NULL,
ALTER COLUMN "location_province" DROP NOT NULL,
ALTER COLUMN "expected_salary" DROP NOT NULL;
