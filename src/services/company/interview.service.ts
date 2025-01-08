import { ApplicationStatus, PrismaClient } from "@prisma/client";
import {
  Interview,
  InterviewEmail,
  InterviewStatus,
  UpdateStatusInterview,
} from "../../models/models";
import {
  formatDate,
  formatTime24Hour,
  convertToDate,
} from "../../utils/dateFormatter";

export class InterviewService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  generateCode(companyName: string) {
    // Extract the first 3 letters of the company name
    const companyCode = companyName.substring(0, 3).toUpperCase();

    // Get current date in YYYYMMDD format
    const currentDate = new Date().toISOString().slice(0, 10).replace(/-/g, "");

    // Generate a random 10-character string
    const randomChars = Math.random().toString(36).substring(2, 12);

    // Combine the components into the final code
    const code = `${companyCode}-${currentDate}-${randomChars}`;
    return code;
  }

  async setInterviewSchedule(userId: number, data: Interview) {
    // 1. Check applicant is available or not
    // If not it will return false and message
    // 2. User that update is actualy owner of the job
    // if not it will return false and message

    const applicationId = data.applicationId;

    try {
      const verifyData = await this.verifyApplicantData(userId, applicationId);

      if (!verifyData.success) {
        return {
          success: false,
          message: verifyData.message,
        };
      }

      const applicant = verifyData.data?.applicant;
      const user = verifyData.data?.user;

      if (applicant?.application_status !== ApplicationStatus.interview) {
        return {
          success: false,
          message:
            "Cannot create interview if the current status is not interview",
        };
      }

      let uniqueCode: string = "";
      let applicantCode: string = "";

      // do {
      //   uniqueCode = this.generateCode(
      //     user?.company[0].company_name || "anonymous",
      //   );
      //   const checkCode = await this.prisma.interview.findFirst({
      //     where: {
      //       interview_room_code: uniqueCode,
      //     },
      //   });
      //
      //   applicantCode = checkCode?.interview_room_code as string;
      //   console.log("CHECK CODE", checkCode);
      //   console.log("UNIQUIE CODE", uniqueCode);
      //   console.log("APPLICANT CODE", applicantCode);
      // } while (uniqueCode === applicantCode);
      //
      // const roomUrl = `http:localhost:3000/applicant/interview/meet?room=${uniqueCode}`;
      // console.log("OUTER UNIQUE CODE", uniqueCode);
      // console.log("ROOM URL", roomUrl);

      const createInterview = await this.prisma.interview.create({
        data: {
          applicationId: data.applicationId,
          interview_date: new Date(data.interviewDate),
          interview_room_code: uniqueCode,
          interview_url: data.interviewUrl as string,
          interview_time_start: convertToDate(
            data.interviewTimeStart as string,
            data.interviewDate as string,
          ),
          interview_time_end: convertToDate(
            data.interviewTimeEnd as string,
            data.interviewDate as string,
          ),
          created_at: new Date(),
          updated_at: new Date(),
          interview_descrption: data.interviewDescription,
          interview_status: InterviewStatus.scheduled,
        },
      });

      console.log(createInterview);

      const updateStatus = await this.updateStatusApplicantInterview(
        applicant.application_id,
      );
      if (!updateStatus.success) {
        await this.prisma.interview.delete({
          where: {
            interview_id: createInterview.interview_id,
          },
        });
        return {
          success: false,
          message: updateStatus.message,
        };
      } else {
        return {
          success: true,
          data: createInterview,
          interviewEmail: {
            email: applicant?.jobHunter.email,
            companyName: user?.company[0].company_name,
            jobTitle: applicant?.jobPost.job_title,
            name: applicant?.jobHunter.name,
            invitatationLink: createInterview.interview_url,
            interviewdDate: formatDate(createInterview.interview_date),
            interviewTimeEnd: formatTime24Hour(
              createInterview.interview_time_start,
            ),
            interviewTimeStart: formatTime24Hour(
              createInterview.interview_time_end,
            ),
          } as InterviewEmail,
        };
      }
    } catch (e) {
      console.log(e);
      return {
        success: false,
        message: "Failed to create interview",
      };
    }
  }

  async updateInterviewInformation(userId: number, updateData: Interview) {
    const interviewId = updateData.interviewId as number;

    console.log("INTERVIEW CONTROLLER", interviewId);

    try {
      const interview = await this.prisma.interview.findUnique({
        where: {
          interview_id: interviewId,
        },
      });
      if (!interview) {
        return {
          success: false,
          message: "Interview not found",
        };
      }
      console.log("CONTROLLER", updateData);

      const verifyData = await this.verifyApplicantData(
        userId,
        updateData.applicationId,
      );

      if (!verifyData.success) {
        return {
          success: false,
          message: verifyData.message,
        };
      }
      const applicant = verifyData.data?.applicant;
      const user = verifyData.data?.user;

      // if (user?.company[0].company_id !== applicant?.jobPost.companyId) {
      //   return {
      //     success: false,
      //     message: "User not authorize to update this data",
      //   };
      // }
      const updateInterview = await this.prisma.interview.update({
        where: {
          interview_id: interviewId,
        },
        data: {
          interview_descrption: updateData.interviewDescription,
          interview_date: new Date(updateData.interviewDate),
          interview_time_start: new Date(updateData.interviewTimeStart),
          interview_time_end: new Date(updateData.interviewTimeEnd),
          updated_at: new Date(),
        },
      });

      console.log("UPDATE DATA", updateInterview);

      return {
        success: true,
        interviewEmail: {
          email: applicant?.jobHunter.email,
          companyName: user?.company[0].company_name,
          jobTitle: applicant?.jobPost.job_title,
          name: applicant?.jobHunter.name,
          invitatationLink: updateInterview.interview_url,
          interviewdDate: formatDate(updateData.interviewDate as Date),
          interviewTimeEnd: formatTime24Hour(
            updateData.interviewTimeEnd as Date,
          ),
          interviewTimeStart: formatTime24Hour(
            updateData.interviewTimeStart as Date,
          ),
        } as InterviewEmail,
      };
    } catch (e) {
      console.log(e);
      return {
        success: false,
        message: "Failed to update interview",
      };
    }
  }

  async verifyApplicantData(userId: number, applicationId: number) {
    try {
      //   Check User
      const user = await this.prisma.baseUsers.findUnique({
        where: {
          user_id: userId,
        },
        include: {
          company: {
            select: {
              company_id: true,
              company_name: true,
            },
          },
        },
      });
      console.log("USERRRR", user);
      if (!user) {
        return { success: false, message: `User not found` };
      }
      const companyId = user.company[0].company_id;

      console.log("USER AND COMPANY ID", user, companyId);

      //   Check applicant
      const applicant = await this.prisma.application.findUnique({
        where: {
          application_id: applicationId,
        },
        include: {
          jobPost: {
            select: {
              companyId: true,
              job_title: true,
            },
          },
          jobHunter: {
            select: {
              name: true,
              email: true,
            },
          },
        },
      });
      if (!applicant) {
        return {
          success: false,
          message: "Applicant not fount",
        };
      }
      console.log(applicant);
      if (applicant.jobPost.companyId !== companyId) {
        return {
          success: false,
          message: "User not authorize to access this applicant",
        };
      }

      return {
        success: true,
        data: {
          user: user,
          applicant: applicant,
        },
      };
    } catch (e) {
      return {
        success: false,
        message:
          "Something went wrong while verify the data. Failed to create schedule inteview",
      };
    }
  }

  async updateStatusApplicantInterview(applicantId: number) {
    try {
      const updateStatus = await this.prisma.application.update({
        where: {
          application_id: applicantId,
        },
        data: {
          application_status: ApplicationStatus.interview,
        },
      });
      console.log(updateStatus);
      if (updateStatus) {
        return {
          success: true,
          message: "Success update applicant to interview",
        };
      } else {
        return {
          success: false,
          message: "Failed update applicant status",
        };
      }
    } catch (e) {
      return {
        success: false,
        message: e,
      };
    }
  }
  async updateStatusInterview(userId: number, data: UpdateStatusInterview) {
    const interviewId = data.interviewId as number;

    try {
      const interview = await this.prisma.interview.findUnique({
        where: {
          interview_id: interviewId,
        },
      });
      if (!interview) {
        return {
          success: false,
          message: "Interview not found",
        };
      }
      console.log("CONTROLLER", data);

      const verifyData = await this.verifyApplicantData(
        userId,
        data.applicationId,
      );

      if (!verifyData.success) {
        return {
          success: false,
          message: verifyData.message,
        };
      }

      await this.prisma.interview.update({
        where: {
          interview_id: data.interviewId,
        },
        data: {
          interview_status: data.interviewStatus as InterviewStatus,
          updated_at: new Date(),
        },
      });

      return { success: true, message: "Succesfully update" };
    } catch (e) {
      return {
        success: false,
        message: e,
      };
    }
  }
}
