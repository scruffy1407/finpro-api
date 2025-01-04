import { Prisma, PrismaClient } from "@prisma/client";
import { AuthUtils } from "../utils/auth.utils";

export class JobCompanyDashService {
	private prisma: PrismaClient;
	private authUtils: AuthUtils;

	constructor() {
		this.prisma = new PrismaClient();
		this.authUtils = new AuthUtils();
	}

	async getJobDashList(
		limit: number = 10, // Fetch 10 posts initially, to load more later
		offset: number = 0,
		companyId: number,
		status?: boolean,
		salaryShow?: boolean,
		sortOrder?: string,
		jobTitle?: string
	) {
		try {
			// Build the search criteria for fetching job posts
			const whereConditions: any = {
				companyId, // Filter by companyId
				deleted: false, // Exclude deleted records
			};

			if (status !== undefined) {
				whereConditions.status = status; // Filter by status if provided
			}

			if (salaryShow !== undefined) {
				whereConditions.salary_show = salaryShow; // Filter by salary visibility if provided
			}

			// If job_title is provided, add a case-insensitive search condition
			if (jobTitle) {
				whereConditions.job_title = {
					contains: jobTitle, // Case-insensitive search for job_title
					mode: "insensitive", // Make search case-insensitive
				};
			}

			// Construct the orderBy array for sorting based on user input
			const orderBy: any = [];
			if (sortOrder === "asc") {
				orderBy.push({ job_title: "asc" }); // Alphabetical sorting A-Z
			} else if (sortOrder === "desc") {
				orderBy.push({ job_title: "desc" }); // Alphabetical sorting Z-A
			} else {
				orderBy.push({ created_at: "desc" }); // Default sorting by newest job posts
			}

			// Fetch job posts based on the search criteria
			const jobPosts = await this.prisma.jobPost.findMany({
				where: whereConditions, // Apply the search criteria
				skip: offset, // Skip posts based on the offset
				take: limit, // Limit the number of records per request (max 10)
				orderBy: orderBy, // Apply sorting
				select: {
					job_id: true,
					job_title: true,
					selection_text_active: true,
					created_at: true,
					updated_at: true,
					status: true,
					salary_show: true,
					salary_min: true,
					salary_max: true,
					expired_date: true,
					companyId: true,
					_count: {
						select: {
							applyJob: true, // Count the number of related Application records
						},
					},
				},
			});

			// Calculate additional metrics
			const now = new Date();

			// Total number of jobs with status true and not expired
			const jobCompleteCount = await this.prisma.jobPost.count({
				where: {
					companyId,
					status: true,
					expired_date: {
						gt: now,
					},
					deleted: false,
				},
			});

			// Total number of jobs that are not expired
			const jobActiveCount = await this.prisma.jobPost.count({
				where: {
					companyId,
					expired_date: {
						gt: now,
					},
					deleted: false,
				},
			});

			// Count total applicants across all jobs
			const totalApplicants = await this.prisma.application.count({
				where: {
					jobPost: {
						companyId,
						deleted: false,
					},
				},
			});

			// Return results
			return {
				data: jobPosts.map((jobPost) => ({
					...jobPost,
					number_applicants: jobPost._count?.applyJob || 0, // Per job post
				})),
				metrics: {
					jobCompleteCount,
					jobActiveCount,
					totalApplicants,
				},
			};
		} catch (error) {
			const err = error as Error;
			return { error: "Error fetching job posts: " + err.message };
		}
	}
	
	
}
