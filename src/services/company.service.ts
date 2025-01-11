import { PrismaClient } from "@prisma/client";
import {
	companyDetailResponse,
	JobPost,
	reviewResponse,
} from "../models/models";
import { jobSchema } from "../validators/company.validator";
import { AuthUtils } from "../utils/auth.utils";
import errorMap from "zod/lib/locales/en";

export class CompanyService {
	private prisma: PrismaClient;
	private authUtils: AuthUtils;

	constructor() {
		this.prisma = new PrismaClient();
		this.authUtils = new AuthUtils();
	}

	//Create a Job

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
		console.log(validatedData);
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

	// Delete a Job

	async deleteJob(jobId: number): Promise<string> {
		try {
			// Fetch the job post details to check the expired date
			const jobPost = await this.prisma.jobPost.findUnique({
				where: { job_id: jobId },
			});

			if (!jobPost) {
				return "Job post not found.";
			}

			// Check if the job has expired
			const currentDate = new Date();
			const isExpired = jobPost.expired_date < currentDate;

			// If the job has expired, we can delete it even if there are related applications
			if (isExpired) {
				// Perform soft delete by updating the `deleted` field
				await this.prisma.jobPost.update({
					where: { job_id: jobId },
					data: {
						deleted: true, // Set the `deleted` field to true
						status: false, // Optionally update the status to inactive
						updated_at: new Date(), // Ensure the updated timestamp is refreshed
					},
				});

				return "Job post marked as deleted successfully.";
			}

			// Check if the job has related applications
			const applications = await this.prisma.application.findMany({
				where: {
					jobId: jobId,
				},
			});

			if (applications.length > 0) {
				return "Cannot delete job post. It has related applications.";
			}

			// Perform soft delete by updating the `deleted` field
			await this.prisma.jobPost.update({
				where: { job_id: jobId },
				data: {
					deleted: true, // Set the `deleted` field to true
					status: false, // Optionally update the status to inactive
					updated_at: new Date(), // Ensure the updated timestamp is refreshed
				},
			});

			console.log("Soft delete data for job post in success", {
				deleted: true,
				status: false,
				updated_at: new Date(),
			});

			return "Job post deleted successfully.";
		} catch (error) {
			console.log("Soft delete data for job post: in  error", {
				deleted: true,
				status: false,
				updated_at: new Date(),
			});

			const err = error as Error;
			return "Error deleting job post: " + err.message;
		}
	}

	// Service to update a job post
	async updateJob(jobId: number, data: JobPost) {
		try {
			// Validate the incoming data using your existing validation schema (if any)
			const validatedData = jobSchema.parse(data);

			// Check if the job post exists
			const existingJobPost = await this.prisma.jobPost.findUnique({
				where: {
					job_id: jobId,
				},
			});

			if (!existingJobPost) {
				return "Job post not found"; // Return a message if the job post doesn't exist
			}

			// Check if there are any related applications
			const relatedApplications = await this.prisma.application.findMany({
				where: {
					jobId: jobId,
				},
			});

			// If there are related applications, only allow updating the expired_date
			if (relatedApplications.length > 0) {
				// Only update the expired_date, nothing else
				return this.prisma.jobPost.update({
					where: {
						job_id: jobId,
					},
					data: {
						expired_date: validatedData.expired_date,
					},
				});
			}

			// Handle the logic for `selection_test_active` being set to false
			if (validatedData.selection_test_active === false) {
				validatedData.preSelectionTestId = 0; // Automatically set preSelectionTestId to 0
			}

			// Update the job post with the new data
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

	// Service to fetch the 8 newest job postings
	async jobNewLanding(): Promise<any> {
		try {
			// Fetch the 8 newest job posts by ordering by 'created_at' descending
			const latestJobPosts = await this.prisma.jobPost.findMany({
				where: {
					status: true, // Filter for only jobs with 'status' set to true
					deleted: false,
					expired_date: {
						gte: new Date(), // Filter for jobs where the expiry_date is in the future
					},
				},
				orderBy: {
					created_at: "desc", // Order by creation date, most recent first
				},
				take: 3, // Limit to the 8 newest job posts
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

			// Return the latest job posts
			return latestJobPosts;
		} catch (error) {
			const err = error as Error;
			return { error: "Error fetching latest job posts: " + err.message };
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
		companyProvince?: string
	) {
		try {
			// Build the search criteria based on the provided filters
			const whereConditions: any = {
				status: true, // Filter for only jobs with 'status' set to true
				deleted: false,
				expired_date: {
					gte: new Date(), // Filter for jobs where the expiry_date is in the future
				},
			};

			if (job_title) {
				whereConditions.job_title = {
					contains: job_title, // Case-insensitive search for job_title
					mode: "insensitive",
				};
			}

			if (categoryId) {
				whereConditions.categoryId = categoryId; // Filter by categoryId
			}

			// If jobType and jobSpace are provided, filter by them as well
			if (jobType || jobSpace) {
				whereConditions.job_type = jobType; // Filter by jobType (full-time, internship, etc.)
				whereConditions.job_space = jobSpace; // Filter by jobSpace (remote, hybrid, etc.)
			}

			if (companyCity || companyProvince) {
				whereConditions.company = {
					...(companyCity && { company_city: companyCity }),
					...(companyProvince && { company_province: companyProvince }),
				};
			}

			// Add date range filter if provided
			if (dateRange === "last7days") {
				const last7Days = new Date();
				last7Days.setDate(last7Days.getDate() - 7);
				whereConditions.created_at = {
					gte: last7Days, // Filter by date greater than or equal to last 7 days
				};
			} else if (dateRange === "thisMonth") {
				const startOfMonth = new Date();
				startOfMonth.setDate(1); // Set to the first day of the current month
				whereConditions.created_at = {
					gte: startOfMonth, // Filter by date greater than or equal to the start of the month
				};
			} else if (dateRange === "thisYear") {
				const startOfYear = new Date();
				startOfYear.setMonth(0); // Set to January of the current year
				startOfYear.setDate(1); // Set to the first day of the year
				whereConditions.created_at = {
					gte: startOfYear, // Filter by date greater than or equal to the start of the year
				};
			}

			// Fetch the total number of job posts based on the search criteria
			const totalJobPosts = await this.prisma.jobPost.count({
				where: whereConditions,
			});

			// Calculate total number of pages
			const totalPages = Math.ceil(totalJobPosts / limit);

			// If the requested page is greater than total pages, return an empty result
			if (page > totalPages) {
				return {
					data: [],
					currentPage: page,
					totalPages: totalPages,
					totalJobPosts: totalJobPosts,
					message: "No posts available for this page.",
				};
			}

			// Calculate skip value for pagination
			const skip = (page - 1) * limit;

			// Construct the orderBy array for sorting based on user input
			const orderBy: any = [];
			if (sortOrder === "asc") {
				orderBy.push({ job_title: "asc" }); // Alphabetical sorting A-Z
			} else if (sortOrder === "desc") {
				orderBy.push({ job_title: "desc" }); // Alphabetical sorting Z-A
			} else {
				orderBy.push({ created_at: "desc" }); // Default sorting by newest job posts
			}

			// Fetch job posts based on the search criteria and pagination
			const jobPosts = await this.prisma.jobPost.findMany({
				where: whereConditions, // Apply the search criteria
				skip: skip, // Skip records for pagination
				take: limit, // Limit the number of records per page
				orderBy: orderBy, // Apply sorting
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

			// Return the paginated results with search information
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

	// Service to get job post details by jobId for JobHunter
	async getJobPostDetail(jobId: number): Promise<any> {
		try {
			// Fetch the job post along with related details
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
							category_name: true, // Assuming Category model has a 'category_name'
						},
					},
					preSelectionTest: {
						select: {
							test_name: true, // Assuming 'test_name' field in PreSelectionTest
						},
					},
				},
			});

			if (!jobPostDetail) {
				return { message: "Job post not found" };
			}

			//add the related job posts to the job post detail
			const relatedJobPosts = await this.prisma.jobPost.findMany({
				where: {
					categoryId: jobPostDetail.categoryId,
					job_id: { not: jobId },
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
			console.log(e);
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
		limit: number = 6, // Fetch 10 posts initially, to load more later
		page: number = 1,
		hasJob: boolean = false
	) {
		console.log("QUERY", page);
		const whereConditions: any = {};
		if (companyName) {
			whereConditions.company_name = {
				contains: companyName, // Case-insensitive search for job_title
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

		console.log("WHERE CONDITION", whereConditions);

		try {
			// Fetch the total company based on the search criteria
			const totalCompany = await this.prisma.company.count({
				where: whereConditions,
			});

			// Calculate total number of pages
			const totalPages = Math.ceil(totalCompany / limit);

			// If the requested page is greater than total pages, return an empty result
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

			// Calculate skip value for pagination
			const skip = (page - 1) * limit;

			// Fetch company based on the search criteria and pagination
			const listCompany = await this.prisma.company.findMany({
				where: whereConditions, // Apply the search criteria
				skip: skip, // Skip records for pagination
				take: limit, // Limit the number of records per page
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
			console.log(e);
			return {
				success: false,
				message: "Failed to fetch company",
			};
		}
	}
}
