import { PrismaClient } from "@prisma/client";
import * as fs from "fs";
import csvParser from "csv-parser";

const prisma = new PrismaClient();

function titleCase(str: string): string {
  return str
    .toLowerCase()
    .split(" ")
    .map(function (word) {
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(" ");
}

async function seed() {
  try {
    await seedProvinces();
    await seedCities();
  } catch (error) {
    console.error("Error seeding:", error);
  } finally {
    await prisma.$disconnect();
  }
}

async function seedProvinces() {
  const results: { province_id: string; name: string }[] = [];
  return new Promise<void>((resolve, reject) => {
    fs.createReadStream("prisma/provinces.csv")
      .pipe(csvParser())
      .on("data", (data) => results.push(data))
      .on("end", async () => {
        try {
          for (const row of results) {
            const dataToInsert = {
              province_id: parseInt(row.province_id), // Use province_id
              name: titleCase(row.name),
            };
            await prisma.province.create({ data: dataToInsert });
          }
          resolve();
        } catch (error) {
          reject(error);
        }
      })
      .on("error", (error) => reject(error));
  });
}

async function seedCities() {
  const results: { city_id: string; name: string; provinceId: string }[] = [];
  return new Promise<void>((resolve, reject) => {
    fs.createReadStream("prisma/cities.csv")
      .pipe(csvParser())
      .on("data", (data) => results.push(data))
      .on("end", async () => {
        try {
          for (const row of results) {
            const dataToInsert = {
              city_id: parseInt(row.city_id),
              name: titleCase(row.name),
              provinceId: parseInt(row.provinceId),
            };
            await prisma.city.create({ data: dataToInsert });
          }
          resolve();
        } catch (error) {
          reject(error);
        }
      })
      .on("error", (error) => reject(error));
  });
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});
