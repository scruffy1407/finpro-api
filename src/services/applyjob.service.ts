import { PrismaClient } from "@prisma/client";
import { Application, ApplicationStatus } from "../models/models";
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
        path: `/resumes/${Date.now()}-${file.originalname}}`,
        contents: file.buffer,
      });
      const sharedLinkResponse = await dbx.sharingCreateSharedLinkWithSettings({
        path: dropboxResponse.result.path_display!,
      });

      return sharedLinkResponse.result.url;
    } catch (error) {
      console.log(error);
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

      // PENJAGAAN BUAT ISI DATA DIRI SEBELUM APPLYJOB (UNCOMMENT ABIS LIVE)
      // const requiredFields: Array<keyof typeof jobHunter> = [
      //   "name",
      //   "gender",
      //   "dob",
      //   "location_city",
      //   "location_province",
      // ];

      // const missingFields = requiredFields.filter((field) => !jobHunter[field]);

      // if (missingFields.length > 0) {
      //   return {
      //     error: `The following fields are missing: ${missingFields.join(", ")}.`,
      //   };
      // }

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

      const newApplication = await this.prisma.application.create({
        data: {
          ...data,
          resume: resumeUrl as string,
          application_status: ApplicationStatus.ON_REVIEW,
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

  // BOOKMARK SERVICES
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
}
