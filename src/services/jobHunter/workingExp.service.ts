import { PrismaClient, RoleType } from "@prisma/client";
import { WorkingExperience } from "../../models/models";
import { UserService } from "../baseUser/user.service";

export class WorkingExpService {
  private prisma: PrismaClient;
  private userService: UserService;

  constructor() {
    this.prisma = new PrismaClient();
    this.userService = new UserService();
  }

  async getListWorkingExperience(user_id: number) {
    try {
      const user = await this.userService.validateJobHunter(user_id);
      if (!user.success) {
        return {
          success: false,
          message: user.message,
        };
      }

      const listWork = await this.prisma.jobHunter.findUnique({
        where: {
          job_hunter_id: user?.data?.jobHunter[0].job_hunter_id as number,
        },
        include: {
          workExperience: true,
        },
      });
      const workExperiences = listWork?.workExperience;

      console.log(workExperiences);
      return {
        success: true,
        data: workExperiences,
      };
    } catch (e) {
      return {
        success: false,
        message: "Something went wrong, failed to get list",
        detail: e,
      };
    }
  }

  async createWorkingExperience(user_id: number, data: WorkingExperience) {
    console.log(data);
    const { jobHunterId } = data;

    try {
      const user = await this.userService.validateJobHunter(
        user_id,
        jobHunterId
      );
      if (!user.success) {
        return {
          success: false,
          message: user.message,
        };
      }

      console.log(user);

      const company = await this.prisma.company.findUnique({
        where: {
          company_id: data.companyId,
        },
      });

      if (!company) {
        return { success: false, message: "Cannot find company" };
      }

      const createWork = await this.prisma.workExperience.create({
        data: {
          jobHunterId: user?.data?.jobHunter[0].job_hunter_id as number,
          companyId: data.companyId,
          company_name: company.company_name,
          job_description: data.jobDescription,
          job_title: data.jobTitle,
          created_at: new Date(),
          updated_at: new Date(),
        },
      });

      return {
        success: true,
        data: createWork,
      };
    } catch (e) {
      return {
        success: false,
        message: "Something went wrong, failed to create working experience",
        detail: e,
      };
    }
  }

  async editWorkingExperience(
    user_id: number,
    workExperienceId: number,
    data: WorkingExperience
  ) {
    const { jobHunterId } = data;
    try {
      const checkWorkExp = await this.prisma.workExperience.findUnique({
        where: {
          work_experience_id: workExperienceId,
        },
      });
      if (!checkWorkExp) {
        return {
          success: false,
          message: "Working Experience is not available",
        };
      }

      const user = await this.userService.validateJobHunter(
        user_id,
        jobHunterId
      );
      if (!user.success) {
        return {
          success: false,
          message: user.message,
        };
      }

      if (checkWorkExp.jobHunterId !== user.data?.jobHunter[0].job_hunter_id) {
        return {
          success: false,
          message:
            "User cannot edit this work experience because he/she not the owner",
        };
      }
      const company = await this.prisma.company.findUnique({
        where: {
          company_id: data.companyId,
        },
      });

      if (!company) {
        return { success: false, message: "Cannot find company" };
      }

      const updateWorkingExp = await this.prisma.workExperience.update({
        where: {
          work_experience_id: workExperienceId,
        },
        data: {
          company_name: company.company_name,
          job_description: data.jobDescription,
          job_title: data.jobTitle,
          updated_at: new Date(),
        },
      });
      return {
        success: true,
        data: updateWorkingExp,
      };
    } catch (e) {
      return {
        success: false,
        message: "Something went wrong, failed to edit working experience",
        detail: e,
      };
    }
  }

  async deleteWorkingExperience(user_id: number, workingExpId: number) {
    try {
      const getWorkExperience = await this.prisma.workExperience.findUnique({
        where: {
          work_experience_id: workingExpId,
        },
      });

      if (!getWorkExperience) {
        return {
          success: false,
          message: "Working Experience is not available",
        };
      }

      const user = await this.userService.validateJobHunter(
        user_id,
        getWorkExperience.jobHunterId
      );
      if (!user.success) {
        return {
          success: false,
          message: user.message,
        };
      }

      await this.prisma.workExperience.delete({
        where: {
          work_experience_id: workingExpId,
        },
      });
      return {
        success: true,
        message: "Working Experience Deleted",
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
