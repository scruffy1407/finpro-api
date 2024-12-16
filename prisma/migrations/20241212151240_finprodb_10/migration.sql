-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "Location";

-- AlterTable
ALTER TABLE "Company"."Company" ADD COLUMN     "cityId" INTEGER;

-- AlterTable
ALTER TABLE "JobHunter"."JobHunter" ADD COLUMN     "cityId" INTEGER;

-- CreateTable
CREATE TABLE "Location"."province" (
    "province_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "province_pkey" PRIMARY KEY ("province_id")
);

-- CreateTable
CREATE TABLE "Location"."city" (
    "city_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "provinceId" INTEGER NOT NULL,

    CONSTRAINT "city_pkey" PRIMARY KEY ("city_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "province_province_id_key" ON "Location"."province"("province_id");

-- CreateIndex
CREATE UNIQUE INDEX "city_city_id_key" ON "Location"."city"("city_id");

-- AddForeignKey
ALTER TABLE "JobHunter"."JobHunter" ADD CONSTRAINT "JobHunter_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "Location"."city"("city_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Company"."Company" ADD CONSTRAINT "Company_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "Location"."city"("city_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Location"."city" ADD CONSTRAINT "city_provinceId_fkey" FOREIGN KEY ("provinceId") REFERENCES "Location"."province"("province_id") ON DELETE RESTRICT ON UPDATE CASCADE;
