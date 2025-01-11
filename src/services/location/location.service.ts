import { PrismaClient } from "@prisma/client";

export class LocationService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  async getUserLocation(cityId: number) {
    try {
      const city = await this.prisma.city.findUnique({
        where: {
          city_id: cityId,
        },
        include: {
          province: true,
        },
      });
      return { success: true, data: city };
    } catch (e) {
      return {
        success: false,
        message: "Something went wrong, failed to getAllProvince",
      };
    }
  }

  async getAllProvince() {
    try {
      const province = await this.prisma.province.findMany({});
      return {
        success: true,
        data: province,
      };
    } catch (error) {
      return {
        success: false,
        message: "Something went wrong, failed to getAllProvince",
      };
    }
  }
  async getCityByProvince(provinceId: number) {
    try {
      const province = await this.prisma.city.findMany({
        where: {
          provinceId: provinceId,
        },
      });
      return { success: true, data: province };
    } catch (e) {
      return {
        success: false,
        message: "Something went wrong, failed to getAllProvince",
      };
    }
  }

  async searchLocation(searchKeyword: string) {
    try {
      const [searchCities, searchProvinces] = await Promise.all([
        this.prisma.city.findMany({
          where: {
            name: {
              contains: searchKeyword,
              mode: "insensitive", // Case-insensitive search
            },
          },
        }),
        this.prisma.province.findMany({
          where: {
            name: {
              contains: searchKeyword,
              mode: "insensitive", // Case-insensitive search
            },
          },
        }),
      ]);

      const combinedResults = [...searchCities, ...searchProvinces];
      return {
        success: true,
        data: combinedResults,
      };
    } catch (e) {
      console.error("Error occurred during search:", e); // Log specific error details
      return {
        success: false,
        message: "Something went wrong, failed to search",
      };
    }
  }
}
