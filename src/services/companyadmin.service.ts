import { PrismaClient } from "@prisma/client";
import { ApplicationStatus } from "@prisma/client";
import { sendApplicationStatusEmail } from "../config/nodeMailer";

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

  async getJobApplicants(jobId: number, userId: number, fetchType: string) {
    try {
      const companyId = await this.getCompanyId(userId);

      if (!companyId) {
        console.error("No company found for this user.");
        return {
          success: false,
          message: "No company found for this user",
        };
      }

      const job = await this.prisma.jobPost.findUnique({
        where: {
          job_id: jobId,
        },
      });
      if (!job) {
        return {
          success: false,
          message: "Job not available",
        };
      }

      if (job.companyId !== companyId) {
        return {
          success: false,
          message: "User not authorize to access this job",
        };
      }

      const whereCondition: any = {
        jobId: jobId,
      };

      if (fetchType === "interview") {
        whereCondition.application_status = "interview";
      } else if (fetchType === "accepted") {
        whereCondition.application_status = "accepted";
      } else if (fetchType === "rejected") {
        whereCondition.application_status = "rejected";
      }

      const applicants = await this.prisma.application.findMany({
        where: whereCondition,
        include: {
          jobHunter: {
            select: {
              job_hunter_id: true,
              name: true,
              email: true,
              resume: true,
            },
          },
          interview: true,
        },
      });

      console.log("APPLICANTS", applicants, companyId);

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
    userId: number,
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
      select: {
        application_status: true,
        jobPost: {
          select: {
            job_title: true,
            company: {
              select: {
                company_name: true,
              },
            },
          },
        },
        jobHunter: {
          select: {
            email: true,
            name: true,
          },
        },
      },
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

    const jobTitle = existingApplication.jobPost?.job_title;
    const companyName = existingApplication.jobPost?.company?.company_name;
    const applicantEmail = existingApplication.jobHunter?.email;
    const applicantName = existingApplication.jobHunter?.name;
    if (applicantEmail && applicantName && jobTitle && companyName) {
      try {
        await sendApplicationStatusEmail(applicantEmail, {
          name: applicantName,
          applicationStatus: status,
          jobName: companyName,
          jobTitle: jobTitle,
        });
      } catch (error) {
        console.error("Error sending application status email:", error);
      }
    }

    return updateResult;
  }

  async deleteJob(jobId: number, userId: number): Promise<string> {
    try {
      const companyId = await this.getCompanyId(userId);
      if (!companyId) {
        return "User does not belong to a company.";
      }

      const jobPost = await this.prisma.jobPost.findUnique({
        where: { job_id: jobId },
      });

      if (!jobPost) {
        return "Job post not found.";
      }

      // Ensure the job belongs to the user's company
      if (jobPost.companyId !== companyId) {
        return "Unauthorized to delete this job post.";
      }

      const currentDate = new Date();
      const isExpired = jobPost.expired_date < currentDate;

      if (isExpired) {
        await this.prisma.jobPost.update({
          where: { job_id: jobId },
          data: {
            deleted: true,
            status: false,
            updated_at: new Date(),
          },
        });
        return "Job post marked as deleted successfully.";
      }

      const applications = await this.prisma.application.findMany({
        where: {
          jobId: jobId,
        },
      });

      if (applications.length > 0) {
        return "Cannot delete job post. It has related applications.";
      }

      await this.prisma.jobPost.update({
        where: { job_id: jobId },
        data: {
          deleted: true,
          status: false,
          updated_at: new Date(),
        },
      });

      return "Job post deleted successfully.";
    } catch (error) {
      const err = error as Error;
      return "Error deleting job post: " + err.message;
    }
  }

  // Get job post status with user authorization
  async getJobStatus(jobId: number, userId: number): Promise<boolean> {
    try {
      const companyId = await this.getCompanyId(userId);
      if (!companyId) {
        return false;
      }

      const jobPost = await this.prisma.jobPost.findUnique({
        where: { job_id: jobId },
        select: {
          status: true,
          companyId: true,
        },
      });

      if (!jobPost) {
        console.error("Job post not found.");
        return false;
      }

      if (jobPost.companyId !== companyId) {
        console.error("Unauthorized to view this job post.");
        return false;
      }

      return jobPost.status;
    } catch (error) {
      console.error("Error fetching job status:", error);
      return false;
    }
  }

  async toggleJobStatus(
    jobId: number,
    status: boolean,
    userId: number,
  ): Promise<string> {
    try {
      const companyId = await this.getCompanyId(userId);
      if (!companyId) {
        return "User does not belong to a company.";
      }
      const jobPost = await this.prisma.jobPost.findUnique({
        where: { job_id: jobId },
      });
      if (!jobPost) {
        return "Job post not found.";
      }
      if (jobPost.companyId !== companyId) {
        return "Unauthorized to update this job post.";
      }

      await this.prisma.jobPost.update({
        where: { job_id: jobId },
        data: {
          status,
          updated_at: new Date(),
        },
      });

      return `Job post status updated to ${status ? "active" : "inactive"}.`;
    } catch (error) {
      const err = error as Error;
      console.error("Error updating job status:", error);
      return "Error updating job status: " + err.message;
    }
  }
}
