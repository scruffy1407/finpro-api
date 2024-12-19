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
        path: `/resumes/${file.originalname}_${Date.now()}`,
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
        return { error: "Invalid access token or user not found." };
      }

      if (jobHunter.job_hunter_id !== data.jobHunterId) {
        return { error: "Unauthorized access to apply for the job." };
      }

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
        return { error: "Job does not exist." };
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
          message: "You have already applied for this job.",
        };
      }

      const resumeUrl = await this.uploadResumeToDropbox(file);

      return await this.prisma.application.create({
        data: {
          ...data,
          resume: resumeUrl as string,
          application_status: ApplicationStatus.ON_REVIEW,
        },
      });
    } catch (error) {
      return { error: "Failed to apply for the job, please try again" };
    }
  }

  async getAllApplications(jobHunterId: number) {
    return await this.prisma.application.findMany({
      where: { jobHunterId },
      include: { jobPost: true },
    });
  }

  async createBookmark(
    jobHunterId: number,
    jobPostId: number,
    date_added: Date
  ) {
    return await this.prisma.jobWishlist.create({
      data: {
        jobHunterId,
        jobPostId,
        date_added,
      },
    });
  }

  async removeBookmarks(jobHunterId: number, jobPostId: number) {
    console.log(jobHunterId);
    console.log(jobPostId);
    const bookmark = await this.prisma.jobWishlist.deleteMany({
      where: {
        jobHunterId,
        jobPostId,
      },
    });

    if (bookmark.count === 0) {
      return { success: false, message: "Bookmark not found." };
    }

    return { success: true, message: "Bookmark removed successfully." };
  }

  async getAllBookmarks(jobHunterId: number) {
    return await this.prisma.jobWishlist.findMany({
      where: { jobHunterId },
      include: { jobPost: true },
    });
  }
}
