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

  async getListWorkingExperience(user_id: number, wReview: boolean) {
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
          workExperience: {
            select: {
              end_date: true,
              jobHunter: true,
              company_name: true,
              job_title: true,
              work_experience_id: true,
              job_description: true,
              start_date: true,
              companyId: true,
              JobReview: wReview ? true : undefined,
            },
          },
        },
      });

      const workExperiences = listWork?.workExperience;
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
    const { jobHunterId, startDate, endDate, currentlyWorking } = data;

    const start = new Date(startDate);
    const end = currentlyWorking ? null : new Date(endDate);

    if (end && start > end) {
      return {
        success: false,
        message: "Start date cannot be later than end date.",
      };
    }
  
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
          start_date: start,
          end_date: end,
          currently_working: currentlyWorking,
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
    const { jobHunterId, startDate, endDate, currentlyWorking } = data;

    const start = new Date(startDate);
    const end = endDate ? new Date(endDate) : null;

    if (!currentlyWorking && start > end!) {
      return {
        success: false,
        message: "Start date cannot be later than end date.",
      };
    }

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
            "User cannot edit this work experience because he/she is not the owner",
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
          start_date: start,
          end_date: currentlyWorking ? null : end,
          currently_working: currentlyWorking,
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
      // Delete related job reviews (optional, depending on your requirements)
      await this.prisma.jobReview.deleteMany({
        where: {
          workExperienceId: workingExpId,
        },
      });

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
