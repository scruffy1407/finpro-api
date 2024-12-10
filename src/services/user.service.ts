import { PrismaClient, RoleType } from "@prisma/client";
import cloudinary from "../config/cloudinary";
import {
  CompanyInfoResp,
  CompanyGeneralInfo,
  UpdateImage,
  JobHunterGeneralInfo,
} from "../models/models";
import { getLocationDetail } from "../utils/api";

export class UserService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
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

  async updateCompanyDetail(user_id: number, updateData: CompanyGeneralInfo) {
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

      const location = await getLocationDetail(
        updateData.company_province,
        updateData.company_city,
      );

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
          longitude: location.success ? location.longitude : null,
          latitude: location.success ? location.latitude : null,
        },
      });

      return {
        success: true,
        updateCompany,
      };
    } catch (e) {
      return {
        success: false,
        message: "Cannot update the company",
        detail: e,
      };
    }
  }

  async updateCompanyImage(user_id: number, updateData: UpdateImage) {
    const { id } = updateData;

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

      if (company?.company[0].company_id !== id) {
        return {
          success: false,
          message: "User are not authorized to update",
        };
      }

      const uploadImage = await this.uploadImage(
        company.role_type,
        updateData.image,
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
          company_id: id,
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

  async getUserDetail(user_id: number) {}

  async updateUserProfile(user_id: number, updateData: JobHunterGeneralInfo) {
    const { jobHunterId } = updateData;

    try {
      const jobHunter = await this.prisma.baseUsers.findUnique({
        where: {
          user_id: user_id,
        },
        include: {
          jobHunter: true,
        },
      });

      const checkUser = await this.userValidator(
        "jobhunter",
        jobHunterId,
        jobHunter?.jobHunter[0].job_hunter_id,
      );
      if (!checkUser?.success) {
        return checkUser;
      }

      const updateUser = await this.prisma.jobHunter.update({
        where: {
          job_hunter_id: jobHunterId,
        },
        data: {
          name: updateData.name,
          gender: updateData.gender,
          dob: updateData.dob,
          location_city: updateData.locationCity,
          location_province: updateData.locationProvince,
          expected_salary: updateData.expectedSalary,
        },
      });
      return {
        success: true,
        updateUser,
      };
    } catch (e) {
      return {
        success: false,
        message: "Something went wrong, failed to update company image",
        detail: e,
      };
    }
  }

  async updateUserImage(user_id: number, updateData: UpdateImage) {
    const { id } = updateData;
    try {
      const jobHunter = await this.prisma.baseUsers.findUnique({
        where: {
          user_id: user_id,
        },
        include: {
          jobHunter: true,
        },
      });

      if (!jobHunter) {
        return {
          success: false,
          message: "Cannot find company",
        };
      }

      if (jobHunter?.jobHunter[0].job_hunter_id !== id) {
        return {
          success: false,
          message: "User are not authorized to update",
        };
      }

      const uploadImage = await this.uploadImage(
        jobHunter.role_type,
        updateData.image,
      );

      if (!uploadImage.success) {
        return {
          success: false,
          message: "Failed to update company",
          detail: uploadImage.message,
        };
      }

      const updateImage = await this.prisma.jobHunter.update({
        where: {
          job_hunter_id: id,
        },
        data: {
          photo: uploadImage.data,
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

  // WORKING EXPERIENCE

  async userValidator(
    user_role: RoleType,
    id?: number | undefined,
    compareId?: number | undefined,
  ) {
    if (!id) {
      return {
        success: false,
        message: `Cannot find ${user_role === RoleType.company ? "company" : "job hunter"}`,
      };
    }

    if (compareId !== id) {
      return {
        success: false,
        message: "User are not authorized to update",
      };
    }
    return {
      success: true,
      message: "All good",
    };
  }

  async uploadImage(userRole: RoleType, image: string) {
    try {
      const uploadImage = await cloudinary.uploader.upload(image, {
        folder: userRole === RoleType.company ? "Company" : "Job Hunter",
      });
      return {
        success: true,
        data: uploadImage.secure_url,
      };
    } catch (e) {
      return {
        success: false,
        message: "Failed to upload image",
      };
    }
  }
}
