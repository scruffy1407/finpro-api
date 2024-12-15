import { PrismaClient } from "@prisma/client";
import { JobPost } from "../models/models";
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
			const applications = await this.prisma.application.findMany({
				where: {
					jobId: jobId,
				},
			});

			if (applications.length > 0) {
				return "Cannot delete job post. It has related applications.";
			}

			await this.prisma.jobPost.delete({
				where: {
					job_id: jobId,
				},
			});

			return "Job post deleted successfully.";
		} catch (error) {
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

			// Prepare the data for the update
			const updateData: any = {
				job_title: validatedData.job_title,
				preSelectionTestId: validatedData.preSelectionTestId,
				categoryId: validatedData.categoryId,
				selection_text_active: validatedData.selection_test_active,
				salary_show: validatedData.salary_show,
				salary_min: validatedData.salary_min,
				job_description: validatedData.job_description,
				job_experience_min: validatedData.job_experience_min,
				expired_date: validatedData.expired_date,
				status: validatedData.status,
				job_type: validatedData.job_type,
				job_space: validatedData.job_space,
			};

			// Conditionally add salary_max and job_experience_max only if they are not null
			if (validatedData.salary_max !== null) {
				updateData.salary_max = validatedData.salary_max;
			}

			if (validatedData.job_experience_max !== null) {
				updateData.job_experience_max = validatedData.job_experience_max;
			}

			// Update the job post with the new data
			return this.prisma.jobPost.update({
				where: {
					job_id: jobId,
				},
				data: updateData,
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
					expired_date: {
						gte: new Date(), // Filter for jobs where the expiry_date is in the future
					},
				},
				orderBy: {
					created_at: "desc", // Order by creation date, most recent first
				},
				take: 3, // Limit to the 8 newest job posts
				select: {
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
					created_at: true,
					job_type: true,
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
}

//GET JOB POST DATABASE

// async getJobPosts(page: number = 1, limit: number = 15) {
// 	try {
// 		//fetch the total number of job posts for calculating total pages
// 		const totalJobPosts = await this.prisma.jobPost.count();

// 		//total number pages
// 		const totalPages = Math.ceil(totalJobPosts / limit);

// 		if (page > totalPages) {
// 			return {
// 				data: [],
// 				currentPage: page,
// 				totalPages: totalPages,
// 				totalJobPosts: totalJobPosts,
// 				message: "No posts available for this page.",
// 			};
// 		}
// 		//skip value
// 		const skip = (page - 1) * limit;

// 		//fetch job Posts with pagination (skip and limit)
// 		const jobPosts = await this.prisma.jobPost.findMany({
// 			skip: skip,
// 			take: limit,
// 			orderBy: {
// 				created_at: "desc", // You can adjust this sorting logic if needed
// 			},
// 			select: {
// 				job_id: true,
// 				job_title: true,
// 				salary_min: true,
// 				salary_max: true,
// 				created_at: true,
// 				job_type: true,
// 				company: {
// 					select: {
// 						logo: true,
// 						company_name: true,
// 						company_city: true,
// 					},
// 				},
// 			},
// 		});

// 		// Return the paginated result
// 		return {
// 			data: jobPosts,
// 			currentPage: page,
// 			totalPages: totalPages,
// 			totalJobPosts: totalJobPosts,
// 		};
// 	} catch (error) {
// 		const err = error as Error;
// 		return { error: "Error fetching job posts: " + err.message };
// 	}
// }

//Backup 2
// async getJobPosts(
// 	page: number = 1,
// 	limit: number = 15,
// 	job_title?: string,
// 	categoryId?: number
// ) {
// 	try {
// 		// Build the search criteria based on the provided filters
// 		const whereConditions: any = {};

// 		if (job_title) {
// 			whereConditions.job_title = {
// 				contains: job_title, // Case-insensitive search for job_title
// 				mode: "insensitive",
// 			};
// 		}

// 		if (categoryId) {
// 			whereConditions.categoryId = categoryId; // Filter by categoryId
// 		}

// 		// Fetch the total number of job posts based on the search criteria
// 		const totalJobPosts = await this.prisma.jobPost.count({
// 			where: whereConditions,
// 		});

// 		// Calculate total number of pages
// 		const totalPages = Math.ceil(totalJobPosts / limit);

// 		// If the requested page is greater than total pages, return an empty result
// 		if (page > totalPages) {
// 			return {
// 				data: [],
// 				currentPage: page,
// 				totalPages: totalPages,
// 				totalJobPosts: totalJobPosts,
// 				message: "No posts available for this page.",
// 			};
// 		}

// 		// Calculate skip value for pagination
// 		const skip = (page - 1) * limit;

// 		// Fetch job posts based on the search criteria and pagination
// 		const jobPosts = await this.prisma.jobPost.findMany({
// 			where: whereConditions, // Apply the search criteria
// 			skip: skip, // Skip records for pagination
// 			take: limit, // Limit the number of records per page
// 			orderBy: {
// 				created_at: "desc", // Order by creation date, most recent first
// 			},
// 			select: {
// 				job_id: true,
// 				job_title: true,
// 				salary_min: true,
// 				salary_max: true,
// 				created_at: true,
// 				job_type: true,
// 				company: {
// 					select: {
// 						logo: true,
// 						company_name: true,
// 						company_city: true,
// 					},
// 				},
// 			},
// 		});

// 		// Return the paginated results with search information
// 		return {
// 			data: jobPosts,
// 			currentPage: page,
// 			totalPages: totalPages,
// 			totalJobPosts: totalJobPosts,
// 		};
// 	} catch (error) {
// 		const err = error as Error;
// 		return { error: "Error fetching job posts: " + err.message };
// 	}
// }

//backup 3
// async getJobPosts(
// 	page: number = 1,
// 	limit: number = 15,
// 	job_title?: string,
// 	categoryId?: number,
// 	jobType?: string,
// 	jobSpace?: string,
// 	dateRange?: string,
// 	sortOrder?: string
// ) {
// 	try {
// 		// Build the search criteria based on the provided filters
// 		const whereConditions: any = {};

// 		if (job_title) {
// 			whereConditions.job_title = {
// 				contains: job_title, // Case-insensitive search for job_title
// 				mode: "insensitive",
// 			};
// 		}

// 		if (categoryId) {
// 			whereConditions.categoryId = categoryId; // Filter by categoryId
// 		}

// 		// If jobType and jobSpace are provided, filter by them as well
// 		if (jobType || jobSpace) {
// 			whereConditions.job_type = jobType; // Filter by jobType (full-time, internship, etc.)
// 			whereConditions.job_space = jobSpace; // Filter by jobSpace (remote, hybrid, etc.)
// 		}

// 		// Add date range filter if provided
// 		if (dateRange === "last7days") {
// 			const last7Days = new Date();
// 			last7Days.setDate(last7Days.getDate() - 7);
// 			whereConditions.created_at = {
// 				gte: last7Days, // Filter by date greater than or equal to last 7 days
// 			};
// 		} else if (dateRange === "thisMonth") {
// 			const startOfMonth = new Date();
// 			startOfMonth.setDate(1); // Set to the first day of the current month
// 			whereConditions.created_at = {
// 				gte: startOfMonth, // Filter by date greater than or equal to the start of the month
// 			};
// 		} else if (dateRange === "thisYear") {
// 			const startOfYear = new Date();
// 			startOfYear.setMonth(0); // Set to January of the current year
// 			startOfYear.setDate(1); // Set to the first day of the year
// 			whereConditions.created_at = {
// 				gte: startOfYear, // Filter by date greater than or equal to the start of the year
// 			};
// 		}

// 		// Fetch the total number of job posts based on the search criteria
// 		const totalJobPosts = await this.prisma.jobPost.count({
// 			where: whereConditions,
// 		});

// 		// Calculate total number of pages
// 		const totalPages = Math.ceil(totalJobPosts / limit);

// 		// If the requested page is greater than total pages, return an empty result
// 		if (page > totalPages) {
// 			return {
// 				data: [],
// 				currentPage: page,
// 				totalPages: totalPages,
// 				totalJobPosts: totalJobPosts,
// 				message: "No posts available for this page.",
// 			};
// 		}

// 		// Calculate skip value for pagination
// 		const skip = (page - 1) * limit;

// 		// Construct the orderBy array for sorting based on user input
// 		const orderBy: any = [];
// 		if (sortOrder === "asc") {
// 			orderBy.push({ job_title: "asc" }); // Alphabetical sorting A-Z
// 		} else if (sortOrder === "desc") {
// 			orderBy.push({ job_title: "desc" }); // Alphabetical sorting Z-A
// 		} else {
// 			orderBy.push({ created_at: "desc" }); // Default sorting by newest job posts
// 		}

// 		// Fetch job posts based on the search criteria and pagination
// 		const jobPosts = await this.prisma.jobPost.findMany({
// 			where: whereConditions, // Apply the search criteria
// 			skip: skip, // Skip records for pagination
// 			take: limit, // Limit the number of records per page
// 			orderBy: orderBy, // Apply sorting
// 			select: {
// 				job_id: true,
// 				job_title: true,
// 				salary_min: true,
// 				salary_max: true,
// 				created_at: true,
// 				job_type: true,
// 				job_space: true,
// 				salary_show: true,
// 				job_experience_min: true,
// 				job_experience_max: true,
// 				company: {
// 					select: {
// 						logo: true,
// 						company_name: true,
// 						company_city: true,
// 					},
// 				},
// 			},
// 		});

// 		// Return the paginated results with search information
// 		return {
// 			data: jobPosts,
// 			currentPage: page,
// 			totalPages: totalPages,
// 			totalJobPosts: totalJobPosts,
// 		};
// 	} catch (error) {
// 		const err = error as Error;
// 		return { error: "Error fetching job posts: " + err.message };
// 	}
// }
