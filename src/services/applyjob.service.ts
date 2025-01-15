import { PrismaClient, ApplicationStatus } from "@prisma/client";
import { Application } from "../models/models";
import { Dropbox } from "dropbox";
import { DropboxTokenManager } from "../utils/dropboxRefreshToken";

export class ApplyJob {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  async uploadResumeToDropbox(
    file: Express.Multer.File
  ): Promise<string | undefined> {
    try {
      const tokenManager = DropboxTokenManager.getInstance();
      const accessToken = tokenManager.getAccessToken();
      const dbx = new Dropbox({ accessToken });

      const dropboxResponse = await dbx.filesUpload({
        path: `/resumes/${Date.now()}-${file.originalname}`,
        contents: file.buffer,
      });
      const sharedLinkResponse = await dbx.sharingCreateSharedLinkWithSettings({
        path: dropboxResponse.result.path_display!,
      });

      return sharedLinkResponse.result.url;
    } catch (error) {
      return "Failed to upload Resume File";
    }
  }

  async applyJob(
    data: Application,
    file: Express.Multer.File,
    accessToken: string
  ) {
    try {
      const jobHunter = await this.prisma.jobHunter.findFirst({
        where: {
          baseUser: { access_token: accessToken },
        },
        include: { baseUser: true },
      });

      if (!jobHunter) {
        return {
          success: false,
          statusCode: 401,
          message: "Invalid access token or user not found.",
        };
      }

      if (jobHunter.job_hunter_id !== data.jobHunterId) {
        return {
          success: false,
          statusCode: 403,
          message: "Unauthorized access to apply for the job.",
        };
      }
      const jobExists = await this.prisma.jobPost.findUnique({
        where: { job_id: data.jobId },
      });
      if (!jobExists) {
        return {
          success: false,
          statusCode: 404,
          message: "Job does not exist.",
        };
      }

      const existingApplication = await this.prisma.application.findFirst({
        where: {
          jobHunterId: data.jobHunterId,
          jobId: data.jobId,
        },
      });

      if (existingApplication) {
        return {
          success: false,
          statusCode: 409,
          message: "You have already applied for this job.",
        };
      }

      const resumeUrl = await this.uploadResumeToDropbox(file);

      if (!resumeUrl) {
        return {
          success: false,
          statusCode: 400,
          message: `Failed to upload Resume File, Please try again or refresh browser`,
        };
      }

      const newApplication = await this.prisma.application.create({
        data: {
          ...data,
          resume: resumeUrl as string,
          application_status: ApplicationStatus.onreview,
        },
      });

      return {
        success: true,
        statusCode: 201,
        data: newApplication,
      };
    } catch (error) {
      console.error("Error applying for job:", error);
      return {
        success: false,
        statusCode: 500,
        message: "Failed to apply for the job, please try again.",
      };
    }
  }

  async getAllApplications(jobHunterId: number) {
    return await this.prisma.application.findMany({
      where: { jobHunterId },
      include: { jobPost: true },
    });
  }

  async getUserApplications(
    limit: number = 6,
    offset: number = 0,
    userId: number,
    status?: string
  ) {
    try {
      const user = await this.prisma.baseUsers.findUnique({
        where: {
          user_id: userId,
        },
        include: {
          jobHunter: true,
        },
      });
      if (!user) {
        return {
          success: false,
          message: "User not found",
        };
      }
      const whereConditions: any = {
        jobHunterId: user.jobHunter[0].job_hunter_id,
        application_status: status as ApplicationStatus,
      };

      const applicationUser = await this.prisma.application.findMany({
        where: whereConditions,
        skip: offset,
        take: limit,
        orderBy: {
          created_at: "desc",
        },
        select: {
          application_id: true,
          application_status: true,
          created_at: true,
          resume: true,
          expected_salary: true,
          jobPost: {
            select: {
              job_id: true,
              job_title: true,
              job_space: true,
              job_type: true,
              salary_show: true,
              salary_min: true,
              salary_max: true,
              selection_text_active: true,
            },
          },
          resultPreSelection: {
            select: {
              completion_id: true,
              completion_score: true,
              completion_status: true,
            },
          },
        },
      });
      return {
        success: true,
        message: "Success get application",
        applicationUser,
      };
    } catch (error) {
      return {
        success: false,
        message: "Failed to get user application",
      };
    }
  }

  async createBookmark(userId: number, jobPostId: number) {
    try {
      const user = await this.prisma.baseUsers.findUnique({
        where: { user_id: userId },
        include: { jobHunter: true },
      });
      const jobHunterId = user?.jobHunter[0].job_hunter_id as number;
      const existingBookmark = await this.prisma.jobWishlist.findFirst({
        where: {
          jobHunterId,
          jobPostId,
        },
      });

      if (existingBookmark) {
        return {
          success: false,
          message: "Bookmark already exists for this job post.",
        };
      }

      const newBookmark = await this.prisma.jobWishlist.create({
        data: {
          jobHunterId,
          jobPostId,
          date_added: new Date(),
        },
      });

      return {
        success: true,
        message: "Bookmark created successfully.",
        bookmark: newBookmark,
      };
    } catch (error) {
      console.error("Error creating bookmark:", error);
      return { success: false, message: "Failed to create bookmark." };
    }
  }

  async removeBookmarks(userId: number, wishlist_id: number) {
    try {
      const user = await this.prisma.baseUsers.findUnique({
        where: { user_id: userId },
        include: { jobHunter: true },
      });

      if (!user) {
        return { success: false, message: "User not found." };
      }

      await this.prisma.jobWishlist.delete({
        where: {
          wishlist_id,
        },
      });

      return { success: true, message: "Bookmark removed successfully." };
    } catch (error) {
      console.error("Error removing bookmark:", error);
      return { success: false, message: "Failed to remove bookmark." };
    }
  }

  async getAllBookmarks(userId: number) {
    try {
      const user = await this.prisma.baseUsers.findUnique({
        where: { user_id: userId },
        include: { jobHunter: true },
      });

      const bookmarks = await this.prisma.jobHunter.findFirst({
        where: { job_hunter_id: user?.jobHunter[0].job_hunter_id },
        include: {
          jobWishlist: {
            where: {
              jobPost: {
                status: true,
                deleted: false,
              },
            },
            include: {
              jobPost: {
                include: { company: true },
              },
            },
          },
        },
      });
      return bookmarks;
    } catch (error) {
      console.error("Error fetching bookmarks:", error);
      return { success: false, message: "Failed to fetch bookmarks." };
    }
  }

  async verifyApplyJob(jobId: number, userId: number) {
    try {
      const checkJob = await this.prisma.jobPost.findUnique({
        where: {
          job_id: jobId,
        },
      });

      if (!checkJob) {
        return { success: false, message: "Jobs not found" };
      }

      const checkUser = await this.prisma.baseUsers.findUnique({
        where: {
          user_id: userId,
        },
        include: {
          jobHunter: true,
        },
      });

      if (!checkUser) {
        return { success: false, message: "User not found" };
      }

      const findApplication = await this.prisma.application.findMany({
        where: {
          jobId: jobId,
          jobHunterId: checkUser.jobHunter[0].job_hunter_id,
        },
      });

      if (!findApplication) {
        return {
          success: false,
          message: "Application not found",
        };
      }
      return {
        success: true,
        message: "Application found",
      };
    } catch (error) {
      return {
        success: false,
        message: "Failed to verify",
      };
    }
  }

  async getDetailApplicant(userId: number, applicantId: number) {
    const userRequest = await this.prisma.baseUsers.findUnique({
      where: {
        user_id: userId,
      },
      include: {
        company: true,
      },
    });

    if (!userRequest) {
      return {
        success: false,
        message: "Company not found",
      };
    }
    const applicant = await this.prisma.application.findUnique({
      where: {
        application_id: applicantId,
      },
      include: {
        jobPost: true,
      },
    });

    if (!applicant) {
      return {
        success: false,
        message: "Applicant Not Found",
      };
    }

    const companyId = applicant.jobPost.companyId;
    if (companyId !== userRequest.company[0].company_id) {
      return {
        success: false,
        message: "User not authorized to access this applicant",
      };
    }

    const jobHunterDetail = await this.prisma.jobHunter.findUnique({
      where: {
        job_hunter_id: applicant.jobHunterId,
      },
      select: {
        name: true,
        dob: true,
        gender: true,
        email: true,
        photo: true,
        location_city: true,
        location_province: true,
        summary: true,
        workExperience: true,
        // Take only the latest education record
        education: {
          orderBy: {
            graduation_date: "desc",
          },
          take: 3,
        },
        skillAssessmentCompletion: true,
      },
    });

    if (!jobHunterDetail) {
      return {
        success: false,
        message: "User Not found",
      };
    }

    return {
      success: true,
      jobHunterDetail,
    };
  }
}
