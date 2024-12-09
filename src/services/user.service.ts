import { PrismaClient, CompanyIndustry } from "@prisma/client";
import { AuthUtils } from "../utils/auth.utils";
import { use } from "passport";
import { CompanyInfoResp, companyUpdate } from "../models/models";

export class UserService {
  private prisma: PrismaClient;
  private authUtils: AuthUtils;

  constructor() {
    this.prisma = new PrismaClient();
    this.authUtils = new AuthUtils();
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
      const companyResp: CompanyInfoResp = {
        company_id: company.company[0].company_id,
        company_name: company.company[0].company_name,
        company_province: company.company[0].company_province ?? "",
        company_city: company.company[0].company_city ?? "",
        company_description: company.company[0].company_description ?? "",
        company_industry: company.company[0].company_industry ?? "",
        company_logo: company.company[0].logo ?? "",
        company_size: company.company[0].company_size ?? "",
        email: company.email,
        address_detail: company.company[0].address_details ?? "",
      };

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

  async updateCompanyDetail(user_id: number, updateData: companyUpdate) {
    const { company_id } = updateData;
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

      if (company?.company[0].company_id !== company_id) {
        return {
          success: false,
          message: "User are not authorized to update",
        };
      }

      const updateCompany = await this.prisma.company.update({
        where: {
          company_id: company_id,
        },
        data: {
          company_name: updateData.company_name,
          company_description: updateData.company_description,
          company_industry: updateData.company_industry,
          company_size: updateData.company_size,
          company_province: updateData.company_province,
          company_city: updateData.company_city,
        },
      });
    } catch (e) {
      return {
        success: false,
        message: "Something went wrong",
        detail: e,
      };
    }
  }
}
