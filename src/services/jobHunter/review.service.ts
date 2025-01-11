import { PrismaClient } from "@prisma/client";
import { ReviewData } from "../../models/models";

export class ReviewService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  async createReview(userId: number, data: ReviewData) {
    try {
      const user = await this.prisma.baseUsers.findUnique({
        where: {
          user_id: userId,
        },
        include: {
          jobHunter: {
            select: {
              job_hunter_id: true,
              review: true,
            },
          },
        },
      });
      if (!user) {
        return {
          success: false,
          message: "User not found",
        };
      }

      const workExperience = await this.prisma.workExperience.findUnique({
        where: {
          work_experience_id: data.workExperienceId,
        },
      });
      if (!workExperience) {
        return {
          success: false,
          message: "work experience not found",
        };
      }
      if (workExperience.jobHunterId !== user.jobHunter[0].job_hunter_id) {
        return {
          success: false,
          message: "User not authorize to create review",
        };
      }

      const company = await this.prisma.company.findUnique({
        where: {
          company_id: workExperience.companyId,
        },
        include: {
          review: true,
        },
      });
      if (!company) {
        return {
          success: false,
          message: "Company not found",
        };
      }
      if (company.review.length !== 0) {
        for (let i = 0; i < company.review.length; i++) {
          if (
            company.review[i].workExperienceId ===
            workExperience.work_experience_id
          ) {
            return {
              success: false,
              message:
                "Cannot create another review with the same working experience",
            };
          }
        }
      }

      await this.prisma.jobReview.create({
        data: {
          companyId: workExperience.companyId,

          jobHunterId: user.jobHunter[0].job_hunter_id,
          workExperienceId: workExperience.work_experience_id,
          review_title: data.reviewTitle,
          review_description: data.reviewDescription,
          career_path_rating: data.careerPathRating,
          cultural_rating: data.culturalRating,
          facility_rating: data.facilityRating,
          work_balance_rating: data.workLifeBalanceRating,
        },
      });
      return {
        success: true,
      };
    } catch (e) {
      return {
        success: false,
        message: "something went wrong,failed to create review",
      };
    }
  }
}
