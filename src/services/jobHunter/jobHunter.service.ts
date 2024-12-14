import { PrismaClient, RoleType, Gender } from "@prisma/client";
import { UserService } from "../baseUser/user.service";
import { JobHunterGeneralInfo, UpdateImage } from "../../models/models";

export class JobHunterService {
  private prisma: PrismaClient;
  private userService: UserService;

  constructor() {
    this.prisma = new PrismaClient();
    this.userService = new UserService();
  }

  // USER
  async getUserDetail(user_id: number) {
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
      if (jobHunter.role_type !== RoleType.jobhunter) {
        return {
          success: false,
          message: "Cannot access this data",
        };
      }

      const jobHunterResp: JobHunterGeneralInfo = {
        jobHunterId: jobHunter.jobHunter[0].job_hunter_id,
        locationCity: jobHunter.jobHunter[0].location_city as string,
        locationProvince: jobHunter.jobHunter[0].location_province as string,
        name: jobHunter.jobHunter[0].name,
        gender: jobHunter.jobHunter[0].gender as Gender,
        dob: jobHunter.jobHunter[0].dob as Date,
        expectedSalary: Number(jobHunter.jobHunter[0].expected_salary),
      };
      return {
        success: true,
        jobHunterResp,
      };
    } catch (e) {
      return {
        success: false,
        message: "Something went wrong",
        detail: e,
      };
    }
  }

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

      const user = await this.userService.validateJobHunter(
        user_id,
        jobHunterId,
      );

      if (!user?.success) {
        return {
          success: false,
          message: user.message,
        };
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
        message: "Something went wrong, failed to update job hunter profile",
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

      const uploadImage = await this.userService.uploadImage(
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

      await this.prisma.jobHunter.update({
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
}
