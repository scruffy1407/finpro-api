import { PrismaClient } from "@prisma/client";
import { ApplicationStatus } from "@prisma/client";

export class CompanyAdmin {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  async getCompanyId(userId: number): Promise<number | null> {
    const company = await this.prisma.baseUsers.findUnique({
      where: { user_id: userId },
      include: { company: true },
    });
    return company?.company[0].company_id || null;
  }

  async getJobPostInformation(jobId: number, userId: number) {
    const companyId = await this.getCompanyId(userId);

    if (!companyId) {
      console.error("No company found for this user.");
      return null;
    }

    const jobPost = await this.prisma.jobPost.findUnique({
      where: { job_id: jobId },
      include: {
        company: {
          select: {
            company_id: true,
            company_name: true,
            logo: true,
            company_industry: true,
            company_size: true,
          },
        },
      },
    });

    if (jobPost?.company?.company_id !== companyId) {
      console.error("Unauthorized to access this job post.");
      return null;
    }

    return jobPost;
  }

  async getCompanyApplicants(userId: number) {
    const companyId = await this.getCompanyId(userId);
    if (!companyId) {
      console.error("There is no company found for this user.");
      return null;
    }

    return await this.prisma.application.findMany({
      where: {
        jobPost: {
          companyId,
        },
      },
      include: {
        jobHunter: {
          select: {
            job_hunter_id: true,
            name: true,
            email: true,
            resume: true,
          },
        },
        jobPost: {
          select: {
            job_title: true,
          },
        },
      },
    });
  }

  async getJobApplicants(jobId: number, companyId: number) {
    try {
      const applicants = await this.prisma.jobPost.findUnique({
        where: { job_id: jobId },
        include: {
          applyJob: {
            include: {
              jobHunter: {
                select: {
                  job_hunter_id: true,
                  name: true,
                  email: true,
                  resume: true,
                },
              },
            },
          },
        },
      });

      if (applicants?.companyId !== companyId) {
        console.error("Unauthorized to access other company job");
        return {
          success: false,
          message: "Unauthorized to access other company job",
        };
      }

      console.log("Fetched applicants data:", applicants);

      return { success: true, applicants };
    } catch (error) {
      console.error("Error fetching job applicants:", error);
      return { success: false, message: "Error fetching job applicants" };
    }
  }

  async getApplicationDetails(applicationId: number, userId: number) {
    const companyId = await this.getCompanyId(userId);
    if (!companyId) {
      console.error("There is no company found for this user.");
      return null;
    }

    return await this.prisma.application.findFirst({
      where: {
        application_id: applicationId,
        jobPost: {
          companyId,
        },
      },
      include: {
        jobHunter: true,
        jobPost: {
          select: {
            job_title: true,
          },
        },
      },
    });
  }

  async updateApplicationStatus(
    applicationId: number,
    status: ApplicationStatus,
    userId: number
  ) {
    const companyId = await this.getCompanyId(userId);
    if (!companyId) {
      console.error("There is no company found for this user.");
      return null;
    }

    const existingApplication = await this.prisma.application.findFirst({
      where: {
        application_id: applicationId,
        jobPost: { companyId },
      },
      select: { application_status: true },
    });

    if (!existingApplication) {
      console.error("Application not found or unauthorized.");
      return null;
    }

    if (existingApplication.application_status !== ApplicationStatus.onreview) {
      console.error("Application status can no longer be updated.");
      return null;
    }

    const updateResult = await this.prisma.application.updateMany({
      where: {
        application_id: applicationId,
        jobPost: { companyId },
      },
      data: { application_status: status },
    });

    if (updateResult.count === 0) {
      console.error("Failed to update application status.");
      return null;
    }

    return updateResult;
  }
}
