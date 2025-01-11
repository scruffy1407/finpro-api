import { PrismaClient, RoleType } from "@prisma/client";
import cloudinary from "../config/cloudinary";
import {
  CompanyInfoResp,
  CompanyGeneralInfo,
  UpdateImage,
  JobHunterGeneralInfo,
  companyDetailResponse,
  JobPost,
  reviewResponse,
} from "../models/models";
import { UserService } from "./baseUser/user.service";
import { getLocationDetail } from "../utils/api";

export class CompanyService {
  private prisma: PrismaClient;
  private userService: UserService;

  constructor() {
    this.prisma = new PrismaClient();
    this.userService = new UserService();
  }

  //   COMPANY
  async getCompanyDetail(user_id: number) {
    try {
      const company = await this.prisma.baseUsers.findUnique({
        where: {
          user_id: user_id,
        },
        include: {
          company: true,
        },
      });

      if (!company) {
        return {
          success: false,
          message: "Cannot find company",
        };
      }

      if (company.role_type !== RoleType.company) {
        return {
          success: false,
          message: "Cannot access this data",
        };
      }

      const companyResp: CompanyInfoResp = {
        company_id: company.company[0].company_id,
        company_name: company.company[0].company_name,
        company_province: company.company[0].company_province ?? "",
        phone_number: company.phone_number ?? "",
        company_city: company.company[0].company_city ?? "",
        company_description: company.company[0].company_description ?? "",
        company_industry: company.company[0].company_industry ?? "",
        company_logo: company.company[0].logo ?? "",
        company_size: company.company[0].company_size ?? "",
        email: company.email,
        address_details: company.company[0].address_details ?? "",
        latitude: company.company[0].latitude as number,
        longitude: company.company[0].longitude as number,
        cityId: company.company[0].cityId as number,
      };
      console.log(companyResp, "BAMBANG SERVICEE");
      return {
        success: true,
        companyResp,
      };
    } catch (e) {
      return {
        success: false,
        message: "Something went wrong",
        detail: e,
      };
    }
  }

  async updateCompanyDetail(user_id: number, updateData: CompanyGeneralInfo) {
    const { companyId } = updateData;
    try {
      console.log(updateData, "POOPP SERVICEEE");
      const company = await this.prisma.baseUsers.findUnique({
        where: {
          user_id: user_id,
        },
        include: {
          company: true,
        },
      });

      if (!company) {
        return {
          success: false,
          message: "Cannot find company",
        };
      }

      if (company?.company[0].company_id !== companyId) {
        return {
          success: false,
          message: "User are not authorized to update",
        };
      }

      // const location = await getLocationDetail(
      //   updateData.company_province,
      //   updateData.company_city,
      // );

      // if (!location.success) {
      //   console.error("Error fetching location:", location.message);
      //   return {
      //     success: false,
      //     message: "Failed to update company: " + location.message,
      //   };
      // }

      const [updatedCompany, updatedUser] = await this.prisma.$transaction([
        this.prisma.company.update({
          where: {
            company_id: companyId,
          },
          data: {
            company_name: updateData.company_name,
            address_details: updateData.address_details,
            company_description: updateData.company_description,
            company_industry: updateData.company_industry,
            company_size: updateData.company_size,
            company_province: updateData.company_province,
            company_city: updateData.company_city,
            cityId: updateData.cityId,
            longitude: null,
            latitude: null,
          },
        }),
        this.prisma.baseUsers.update({
          where: {
            user_id: user_id,
          },
          data: {
            phone_number: updateData.phone_number,
          },
        }),
      ]);

      console.log("data", updatedCompany);

      return {
        success: true,
        company: updatedCompany,
        user: updatedUser,
      };
    } catch (e) {
      console.log(e);
      return {
        success: false,
        message: "Cannot update the company or user",
        detail: e,
      };
    }
  }

  async updateCompanyImage(user_id: number, updateData: UpdateImage) {
    const { id } = updateData;
    console.log("id", id);
    console.log(updateData.image);

    try {
      const company = await this.prisma.baseUsers.findUnique({
        where: {
          user_id: user_id,
        },
        include: {
          company: true,
        },
      });
      if (!company) {
        return {
          success: false,
          message: "Cannot find company",
        };
      }

      // if (company?.company[0].company_id !== id) {
      //   return {
      //     success: false,
      //     message: "User are not authorized to update",
      //   };
      // }

      const uploadImage = await this.userService.uploadImage(
        company.role_type,
        updateData.image
      );
      if (!uploadImage.success) {
        return {
          success: false,
          message: "Failed to update company",
          detail: uploadImage.message,
        };
      }

      await this.prisma.company.update({
        where: {
          company_id: company.company[0].company_id,
        },
        data: {
          logo: uploadImage.data as string,
        },
      });
      return {
        success: true,
        message: "Success update image",
        image: uploadImage.data,
      };
    } catch (e) {
      return {
        success: false,
        message: "Something went wrong, failed to update company image",
        detail: e,
      };
    }
  }

  async searchCompany(keyword: string) {
    try {
      const company = await this.prisma.company.findMany({
        where: {
          company_name: {
            contains: keyword,
            mode: "insensitive", // Case-insensitive search
          },
        },
      });
      const searchResult: { value: number; label: string }[] = company.map(
        (company) => {
          return {
            value: company.company_id,
            label: company.company_name,
          };
        }
      );
      console.log(searchResult);
      return {
        success: true,
        data: searchResult,
      };
    } catch (e) {
      return {
        success: false,
        message: "Something went wrong, failed to update company image",
        detail: e,
      };
    }
  }
  async getSpecificCompany(company_id: number) {
    try {
      const company = await this.prisma.company.findUnique({
        where: {
          company_id: company_id,
        },
      });
      const specificData: { value: number; label: string } = {
        label: company?.company_name as string,
        value: company?.company_id as number,
      };
      return {
        success: true,
        data: specificData,
      };
    } catch (e) {
      return {
        success: false,
        message: "Something went wrong, failed to update company image",
        detail: e,
      };
    }
  }
}
