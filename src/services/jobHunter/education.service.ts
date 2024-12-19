import { PrismaClient, RoleType } from "@prisma/client";
import { UserService } from "../baseUser/user.service";
import { EducationData } from "../../models/models";

export class EducationService {
  private prisma: PrismaClient;
  private userService: UserService;

  constructor() {
    this.prisma = new PrismaClient();
    this.userService = new UserService();
  }

  async getListEducation(user_id: number) {
    try {
      const user = await this.userService.validateJobHunter(user_id);
      if (!user.success) {
        return {
          success: false,
          message: user.message,
        };
      }

      const listEducation = await this.prisma.jobHunter.findUnique({
        where: {
          job_hunter_id: user?.data?.jobHunter[0].job_hunter_id as number,
        },
        include: {
          education: true,
        },
      });
      const education = listEducation?.education;
      return {
        success: true,
        data: education,
      };
    } catch (e) {
      return {
        success: false,
        message: "Something went wrong, failed to get list",
        detail: e,
      };
    }
  }

  async createEducation(user_id: number, data: EducationData) {
    const { jobHunterId } = data;

    try {
      const user = await this.userService.validateJobHunter(
        user_id,
        jobHunterId,
      );
      if (!user.success) {
        return {
          success: false,
          message: user.message,
        };
      }

      const createEducation = await this.prisma.education.create({
        data: {
          jobHunterId: jobHunterId,
          education_degree: data.education_degree,
          education_name: data.education_name,
          education_description: data.education_description,
          cumulative_gpa: data.cumulative_gpa,
          graduation_date: data.graduation_date,
          created_at: new Date(),
          updated_at: new Date(),
        },
      });
      return {
        success: true,
        data: createEducation,
      };
    } catch (e) {
      return {
        success: false,
        message: "Something went wrong, failed to create working experience",
        detail: e,
      };
    }
  }

  async updateEducation(
    user_id: number,
    education_id: number,
    data: EducationData,
  ) {
    const { jobHunterId } = data;
    console.log("CONTROLLER : ", data);

    try {
      const checkEducation = await this.prisma.education.findUnique({
        where: {
          education_id: education_id,
        },
      });

      if (!checkEducation) {
        return {
          success: false,
          message: "Education is not available",
        };
      }

      const user = await this.userService.validateJobHunter(
        user_id,
        jobHunterId,
      );
      if (!user.success) {
        return {
          success: false,
          message: user.message,
        };
      }

      if (
        checkEducation.jobHunterId !== user.data?.jobHunter[0].job_hunter_id
      ) {
        return {
          success: false,
          message:
            "User cannot edit this work experience because he/she not the owner",
        };
      }

      const updateEducation = await this.prisma.education.update({
        where: {
          education_id: education_id,
        },
        data: {
          education_degree: data.education_degree,
          education_name: data.education_name,
          education_description: data.education_description,
          cumulative_gpa: data.cumulative_gpa,
          graduation_date: data.graduation_date,
          updated_at: new Date(),
        },
      });
      console.log(updateEducation);
      return {
        success: true,
        data: updateEducation,
      };
    } catch (e) {
      return {
        success: false,
        message: "Something went wrong, failed to edit education",
        detail: e,
      };
    }
  }

  async deleteEducation(user_id: number, education_id: number) {
    try {
      const getEducation = await this.prisma.education.findUnique({
        where: {
          education_id: education_id,
        },
      });

      if (!getEducation) {
        return {
          success: false,
          message: "Education is not available",
        };
      }

      const user = await this.userService.validateJobHunter(
        user_id,
        getEducation.jobHunterId,
      );
      if (!user.success) {
        return {
          success: false,
          message: user.message,
        };
      }

      await this.prisma.education.delete({
        where: {
          education_id: education_id,
        },
      });
      return {
        success: true,
        message: "Education Deleted",
      };
    } catch (e) {
      return {
        success: false,
        message: "Something went wrong, failed to delete working experience",
        detail: e,
      };
    }
  }
}
