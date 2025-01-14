import { PrismaClient } from "@prisma/client";
import { Request, Response } from "express";
import axios from "axios";
import opencage from "opencage-api-client";

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

  // OPEN CAGE
  async getDetailLocation(cityId: number) {
    try {
      const city = await this.prisma.city.findUnique({
        where: {
          city_id: cityId,
        },
        include: {
          province: true,
        },
      });

      if (!city) {
        return {
          success: false,
          message: "City not found",
        };
      }

      const queryString = `${city.name}, ${city.province.name}`;
      const data = await opencage.geocode({ q: queryString }); // Use `await` here

      if (data.status.code === 200 && data.results.length > 0) {
        const place = data.results[0];
        return {
          success: true,
          data: {
            geo: place.geometry,
            detail: place.formatted,
            timezone: place.annotations?.timezone?.name,
          },
        };
      } else {
        return {
          success: false,
          message: `Geocoding failed: ${data.status.message}`,
          total_results: data.total_results,
        };
      }
    } catch (error: any) {
      console.error("Error occurred during geocoding:", error.message);
      if (error.status?.code === 402) {
        return {
          success: false,
          message:
            "Hit free trial daily limit. Become a customer: https://opencagedata.com/pricing",
        };
      }
      return {
        success: false,
        message: "An error occurred",
      };
    }
  }

  // async updateCityLatLng() {
  //   const result: {
  //     success: boolean;
  //     updatedCities: {
  //       cityId: number;
  //       name: string;
  //       lat: number;
  //       lng: number;
  //     }[];
  //     errors: { cityId?: number; name?: string; reason: string }[];
  //   } = {
  //     success: true,
  //     updatedCities: [],
  //     errors: [],
  //   };
  //   try {
  //     const cities = await this.prisma.city.findMany({
  //       include: { province: true },
  //     });
  //
  //     for (const city of cities) {
  //       try {
  //         const queryString = `${city.name}, ${city.province.name}`;
  //         const response = await opencage.geocode({ q: queryString });
  //
  //         if (response.status.code === 200 && response.results.length > 0) {
  //           const location = response.results[0].geometry;
  //
  //           await this.prisma.city.update({
  //             where: { city_id: city.city_id },
  //             data: {
  //               lat: location.lat.toString(),
  //               lang: location.lng.toString(),
  //             },
  //           });
  //
  //           result.updatedCities.push({
  //             cityId: city.city_id,
  //             name: city.name,
  //             lat: location.lat,
  //             lng: location.lng,
  //           });
  //         } else {
  //           result.errors.push({
  //             cityId: city.city_id,
  //             name: city.name,
  //             reason: "No geolocation data found",
  //           });
  //         }
  //       } catch (err: any) {
  //         result.errors.push({
  //           cityId: city.city_id,
  //           name: city.name,
  //           reason: err?.message,
  //         });
  //       }
  //     }
  //   } catch (err: any) {
  //     result.success = false;
  //     result.errors.push({ reason: err.message });
  //   } finally {
  //     await this.prisma.$disconnect();
  //   }
  //
  //   return result;
  // }
}
