import { PrismaClient } from "@prisma/client";
import {
  companyDetailResponse,
  JobPost,
  reviewResponse,
} from "../models/models";
import { jobSchema } from "../validators/company.validator";
import { AuthUtils } from "../utils/auth.utils";
import getDistance from "geolib/es/getDistance";
import { shuffle } from "lodash";

export class CompanyService {
  private prisma: PrismaClient;
  private authUtils: AuthUtils;

  constructor() {
    this.prisma = new PrismaClient();
    this.authUtils = new AuthUtils();
  }

  async createJob(data: JobPost, token: string) {
    const validatedData = jobSchema.parse(data);

    const decodedToken = await this.authUtils.decodeToken(token);
    if (!decodedToken || !decodedToken.user_id) {
      return "Invalid token or companyId not found";
    }
    const userId = decodedToken.user_id;
    const company = await this.prisma.company.findFirst({
      where: {
        userId: userId,
      },

      select: { company_id: true },
    });

    if (!company) {
      return "company Id is not found";
    }

    const companyId = company.company_id;
    return this.prisma.jobPost.create({
      data: {
        job_title: validatedData.job_title,
        companyId: companyId,
        preSelectionTestId: validatedData.preSelectionTestId,
        categoryId: validatedData.categoryId,
        selection_text_active: validatedData.selection_test_active,
        salary_show: validatedData.salary_show,
        salary_min: validatedData.salary_min,
        salary_max: validatedData.salary_max,
        job_description: validatedData.job_description,
        job_experience_min: validatedData.job_experience_min,
        job_experience_max: validatedData.job_experience_max,
        expired_date: validatedData.expired_date,
        status: validatedData.status,
        job_type: validatedData.job_type,
        job_space: validatedData.job_space,
      },
    });
  }

  async deleteJob(jobId: number) {
    try {
      const jobPost = await this.prisma.jobPost.findUnique({
        where: { job_id: jobId },
      });

      if (!jobPost) {
        return { success: false, message: "Job post not found." };
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
        return {
          success: false,
          message: "Job post marked as deleted successfully.",
        };
      }
      const applications = await this.prisma.application.findMany({
        where: {
          jobId: jobId,
        },
      });

      if (applications.length > 0) {
        return {
          success: false,
          message: "Cannot delete job post. It has related applications.",
        };
      }

      await this.prisma.jobPost.update({
        where: { job_id: jobId },
        data: {
          deleted: true,
          status: false,
          updated_at: new Date(),
        },
      });
      return { success: true, message: "Job post deleted successfully." };
    } catch (error) {
      const err = error as Error;
      return {
        success: false,
        message: "Error deleting job post: " + err.message,
      };
    }
  }

  async updateJob(jobId: number, data: JobPost) {
    try {
      const validatedData = jobSchema.parse(data);
      const existingJobPost = await this.prisma.jobPost.findUnique({
        where: {
          job_id: jobId,
        },
      });

      if (!existingJobPost) {
        return "Job post not found";
      }
      const relatedApplications = await this.prisma.application.findMany({
        where: {
          jobId: jobId,
        },
      });
      if (relatedApplications.length > 0) {
        return this.prisma.jobPost.update({
          where: {
            job_id: jobId,
          },
          data: {
            expired_date: validatedData.expired_date,
          },
        });
      }
      if (validatedData.selection_test_active === false) {
        validatedData.preSelectionTestId = null; // Set to null when inactive
      }
      return this.prisma.jobPost.update({
        where: {
          job_id: jobId,
        },
        data: {
          job_title: validatedData.job_title,
          preSelectionTestId: validatedData.preSelectionTestId,
          categoryId: validatedData.categoryId,
          selection_text_active: validatedData.selection_test_active,
          salary_show: validatedData.salary_show,
          salary_min: validatedData.salary_min,
          salary_max: validatedData.salary_max,
          job_description: validatedData.job_description,
          job_experience_min: validatedData.job_experience_min,
          job_experience_max: validatedData.job_experience_max,
          expired_date: validatedData.expired_date,
          status: validatedData.status,
          job_type: validatedData.job_type,
          job_space: validatedData.job_space,
        },
      });
    } catch (error) {
      const err = error as Error;
      return "Error updating job post: " + err.message;
    }
  }

  async jobNewLanding(): Promise<any> {
    try {
      const latestJobPosts = await this.prisma.jobPost.findMany({
        where: {
          status: true,
          deleted: false,
          expired_date: {
            gte: new Date(),
          },
        },
        orderBy: {
          created_at: "desc",
        },
        take: 3,
        select: {
          companyId: true,
          job_id: true,
          job_title: true,
          salary_min: true,
          salary_max: true,
          created_at: true,
          job_type: true,
          job_space: true,
          job_experience_min: true,
          job_experience_max: true,
          salary_show: true,
          company: {
            select: {
              logo: true,
              company_name: true,
              company_city: true,
            },
          },
        },
      });
      return latestJobPosts;
    } catch (error) {
      const err = error as Error;
      return { error: "Error fetching latest job posts: " + err.message };
    }
  }

  async nearestJobs(userLat: number, userLong: number) {
    try {
      // Fetch all job posts along with their company locations
      const jobs = await this.prisma.jobPost.findMany({
        where: {
          status: true, // Only fetch active job posts
          deleted: false,
        },
        select: {
          job_id: true,
          job_title: true,
          job_description: true,
          job_space: true,
          job_type: true,
          job_experience_min: true,
          job_experience_max: true,
          salary_min: true,
          salary_max: true,
          salary_show: true,
          created_at: true,
          company: {
            select: {
              company_id: true,
              company_name: true,
			  company_province: true,
			  company_city: true,
              latitude: true,
              longitude: true,
              logo: true,
            },
          },
        },
      });

      if (!jobs || jobs.length === 0) {
        return {
          success: false,
          message: "No jobs found",
        };
      }

      // Filter and sort jobs based on distance
      const jobsWithDistance = jobs
        .map((job) => {
          const { latitude, longitude } = job.company;

          if (latitude !== null && longitude !== null) {
            const distance = getDistance(
              { latitude: userLat, longitude: userLong },
              {
                latitude: parseFloat(latitude.toString()),
                longitude: parseFloat(longitude.toString()),
              },
            );

            return {
              ...job,
              company: { ...job.company },
              distance, // Distance in meters
            };
          }
          return null; // Exclude jobs with missing geolocation
        })
        .filter((job) => job !== null) // Remove null entries
        .sort((a, b) => a!.distance - b!.distance); // Sort by distance (nearest first);

      const jobSlice = jobsWithDistance.slice(0, 31);

      // Shuffle and take the first 6 jobs
      const randomJobs = shuffle(jobSlice).slice(0, 6);

      return {
        success: true,
        data: randomJobs,
      };
    } catch (error: any) {
      console.error("Error fetching nearest jobs:", error.message);
      return {
        success: false,
        message: "An error occurred while fetching nearest jobs.",
      };
    } finally {
      await this.prisma.$disconnect();
    }
  }
  async getJobPosts(
    page: number = 1,
    limit: number = 15,
    job_title?: string,
    categoryId?: number,
    jobType?: string,
    jobSpace?: string,
    dateRange?: string,
    sortOrder?: string,
    companyCity?: string,
    companyProvince?: string,
  ) {
    try {
      const whereConditions: any = {
        status: true,
        deleted: false,
        expired_date: {
          gte: new Date(),
        },
      };

      if (job_title) {
        whereConditions.job_title = {
          contains: job_title,
          mode: "insensitive",
        };
      }

      if (categoryId) {
        whereConditions.categoryId = categoryId;
      }
      if (jobType || jobSpace) {
        whereConditions.job_type = jobType;
        whereConditions.job_space = jobSpace;
      }

      if (companyCity || companyProvince) {
        whereConditions.company = {
          ...(companyCity && { company_city: companyCity }),
          ...(companyProvince && { company_province: companyProvince }),
        };
      }
      if (dateRange === "last7days") {
        const last7Days = new Date();
        last7Days.setDate(last7Days.getDate() - 7);
        whereConditions.created_at = {
          gte: last7Days,
        };
      } else if (dateRange === "thisMonth") {
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        whereConditions.created_at = {
          gte: startOfMonth,
        };
      } else if (dateRange === "thisYear") {
        const startOfYear = new Date();
        startOfYear.setMonth(0);
        startOfYear.setDate(1);
        whereConditions.created_at = {
          gte: startOfYear,
        };
      }
      const totalJobPosts = await this.prisma.jobPost.count({
        where: whereConditions,
      });
      const totalPages = Math.ceil(totalJobPosts / limit);
      if (page > totalPages) {
        return {
          data: [],
          currentPage: page,
          totalPages: totalPages,
          totalJobPosts: totalJobPosts,
          message: "No posts available for this page.",
        };
      }
      const skip = (page - 1) * limit;
      const orderBy: any = [];
      if (sortOrder === "asc") {
        orderBy.push({ job_title: "asc" });
      } else if (sortOrder === "desc") {
        orderBy.push({ job_title: "desc" });
      } else {
        orderBy.push({ created_at: "desc" });
      }
      const jobPosts = await this.prisma.jobPost.findMany({
        where: whereConditions,
        skip: skip,
        take: limit,
        orderBy: orderBy,
        select: {
          companyId: true,
          job_id: true,
          job_title: true,
          salary_min: true,
          salary_max: true,
          created_at: true,
          job_type: true,
          job_space: true,
          salary_show: true,
          job_experience_min: true,
          job_experience_max: true,
          company: {
            select: {
              logo: true,
              company_name: true,
              company_city: true,
              company_province: true,
            },
          },
        },
      });
      return {
        data: jobPosts,
        currentPage: page,
        totalPages: totalPages,
        totalJobPosts: totalJobPosts,
      };
    } catch (error) {
      const err = error as Error;
      return { error: "Error fetching job posts: " + err.message };
    }
  }

  async getJobPostDetail(jobId: number): Promise<any> {
    try {
      const jobPostDetail = await this.prisma.jobPost.findUnique({
        where: { job_id: jobId },
        include: {
          company: {
            select: {
              company_id: true,
              company_name: true,
              company_description: true,
              logo: true,
              company_city: true,
              company_province: true,
              address_details: true,
              company_industry: true,
              company_size: true,
              review: true,
            },
          },
          category: {
            select: {
              category_name: true,
            },
          },
          preSelectionTest: {
            select: {
              test_name: true,
            },
          },
        },
      });
      if (!jobPostDetail) {
        return { message: "Job post not found" };
      }
      const relatedJobPosts = await this.prisma.jobPost.findMany({
        where: {
          categoryId: jobPostDetail.categoryId,
          job_id: { not: jobId },
          status: true,
          deleted: false,
        },
        take: 3,
        select: {
          job_id: true,
          job_title: true,
          salary_min: true,
          salary_max: true,
          job_experience_min: true,
          job_experience_max: true,
          salary_show: true,
          created_at: true,
          job_type: true,
          job_space: true,
          company: {
            select: {
              logo: true,
              company_name: true,
              company_city: true,
            },
          },
        },
      });

      return { jobPostDetail, relatedJobPosts };
    } catch (error) {
      const err = error as Error;
      return { error: "Error fetching job post detail: " + err.message };
    }
  }

  async getCategory() {
    try {
      const categories = await this.prisma.category.findMany({
        select: {
          category_name: true,
          category_id: true,
        },
      });
      return categories;
    } catch (error) {
      const err = error as Error;
      return { error: "somethin wrong with the category id : " + err.message };
    }
  }

  async getDetailCompanyPage(companyId: number) {
    try {
      const company = await this.prisma.company.findUnique({
        where: {
          company_id: companyId,
        },
        include: {
          jobPost: {
            where: {
              status: true,
            },
            orderBy: {
              created_at: "desc",
            },
          },
          _count: {
            select: {
              review: true,
              jobPost: {
                where: {
                  status: true,
                },
              },
            },
          },
          review: true,
          baseUser: true,
        },
      });

      if (!company) {
        return {
          success: false,
          message: "Cannot find company",
        };
      } else {
        const companyResponse: companyDetailResponse = {
          logo: company.logo as string,
          email: company.baseUser.email,
          addressDetail: company.address_details as string,
          companyDescription: company.company_description as string,
          companyIndustry: company.company_industry as string,
          companyCity: company.company_city as string,
          companySize: company.company_size as string,
          companyName: company.company_name,
          companyProvince: company.company_province as string,
          companyId: company.company_id,
          listJob: company.jobPost.map((job): JobPost => {
            return {
              job_id: job.job_id,
              job_title: job.job_title,
              job_description: job.job_description,
              salary_min: job.salary_min.toNumber(),
              salary_max: job.salary_max ? job.salary_max.toNumber() : 0,
              salary_show: job.salary_show,
              job_experience_max: job.job_experience_max as number,
              job_experience_min: job.job_experience_min as number,
              job_space: job.job_space,
              job_type: job.job_type,
              status: job.status,
              catergoryId: job.categoryId,
              companyId: job.companyId,
              preSelectionTestId: job.preSelectionTestId,
              expired_date: job.expired_date,
              created_at: job.created_at,
            };
          }),
          listReview: company.review.map((review): reviewResponse => {
            return {
              companyId: review.companyId,
              reviewId: review.review_id,
              careerPathRating: review.career_path_rating,
              culturalRating: review.cultural_rating,
              facilityRating: review.facility_rating,
              reviewDescription: review.review_description,
              reviewTitle: review.review_title,
              jobunterId: review.jobHunterId,
              workLifeBalanceRating: review.work_balance_rating,
            };
          }),
        };
        return {
          success: true,
          companyResponse,
          count: company._count,
        };
      }
    } catch (e) {
      return {
        success: false,
        message: "Something went wrong, failed to find company",
      };
    }
  }

  async getCompanyList(
    companyName?: string,
    companyCity?: string,
    companyProvince?: string,
    limit: number = 6,
    page: number = 1,
    hasJob: boolean = false,
  ) {
    const whereConditions: any = {};
    if (companyName) {
      whereConditions.company_name = {
        contains: companyName,
        mode: "insensitive",
      };
    }
    if (companyCity) {
      whereConditions.company_city = companyCity;
    }
    if (companyProvince) {
      whereConditions.company_province = companyProvince;
    }
    if (hasJob) {
    }
    try {
      const totalCompany = await this.prisma.company.count({
        where: whereConditions,
      });
      const totalPages = Math.ceil(totalCompany / limit);
      if (page > totalPages) {
        return {
          success: true,
          data: {
            listCompany: [],
            currentPage: page,
            totalPages: totalPages,
            totalCompany,
          },
          message: "No posts available for this page.",
        };
      }
      const skip = (page - 1) * limit;
      const listCompany = await this.prisma.company.findMany({
        where: whereConditions,
        skip: skip,
        take: limit,
        select: {
          company_id: true,
          logo: true,
          company_name: true,
          company_city: true,
          company_province: true,
          _count: {
            select: {
              jobPost: {
                where: {
                  status: true,
                },
              },
            },
          },
        },
      });
      return {
        success: true,
        data: {
          listCompany,
          currentPage: page,
          totalPages,
          totalCompany,
        },
        message: "Get Company List.",
      };
    } catch (e) {
      return {
        success: false,
        message: "Failed to fetch company",
      };
    }
  }
}
