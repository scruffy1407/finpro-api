import { PrismaClient, RoleType } from "@prisma/client";
import { WorkingExperience } from "../models/models";

export class WorkingExpService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  async createWorkingExperience(user_id: number, data: WorkingExperience) {
    try {
      const user = await this.prisma.baseUsers.findUnique({
        where: {
          user_id: user_id,
        },
        include: {
          jobHunter: true,
        },
      });
      if (!user) {
        return {
          success: false,
          message: "Cannot find user",
        };
      }

      if (user?.jobHunter[0].job_hunter_id !== user_id) {
        return {
          success: false,
          message: "User are not authorized to create working experience",
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
          jobHunterId: user.jobHunter[0].job_hunter_id,
          companyId: data.companyId,
          company_name: company.company_name,
          job_description: data.jobDescription,
          created_at: new Date(),
          updated_at: new Date(),
          job_title: data.jobTitle,
        },
      });

      return {
        success: true,
        createWork,
      };
    } catch (e) {
      return {
        success: false,
        message: "Something went wrong, failed to create working experience",
        detail: e,
      };
    }
  }

  async editWorkingExperience(user_id: number, data: WorkingExperience) {
    try {
    } catch (e) {}
  }
}
