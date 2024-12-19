// services/preSelectionTestService.ts
import { PrismaClient, JobPost, PreSelectionTest } from "@prisma/client";
import { AuthUtils } from "../utils/auth.utils";

export class PreSelectionTestService {
	private prisma: PrismaClient;
	private authUtils: AuthUtils;

	constructor() {
		this.prisma = new PrismaClient();
		this.authUtils = new AuthUtils(); // Initialize the AuthUtils class to decode JWT tokens
	}

	// Method to create a Pre-selection Test
	async createPreSelectionTest({
		jobPostId,
		testName,
		image = "",
		passingGrade = 85,
		duration = 30,
		token, // Token is passed in for authentication
	}: {
		jobPostId: number;
		testName: string;
		image?: string;
		passingGrade?: number;
		duration?: number;
		token: string; // Passing the JWT token to validate the company
	}): Promise<
		{ preSelectionTest: PreSelectionTest; updatedJobPost: JobPost } | string
	> {
		try {
			// Step 1: Decode the token to get the user and company info
			const decodedToken = await this.authUtils.decodeToken(token); // Decode JWT token
			if (!decodedToken || !decodedToken.user_id) {
				return "Invalid token or user ID not found";
			}

			const userId = decodedToken.user_id;

			// Step 2: Verify that the user is associated with a company
			const company = await this.prisma.company.findFirst({
				where: { userId: userId },
				select: { company_id: true },
			});

			if (!company) {
				return "User is not associated with a company";
			}

			// Step 3: Check if the job post exists
			const jobPost = await this.prisma.jobPost.findUnique({
				where: { job_id: jobPostId },
				include: { company: true },
			});

			if (!jobPost) {
				return "JobPost not found";
			}

			// Step 4: Verify that the job post belongs to the same company
			if (jobPost.company.company_id !== company.company_id) {
				return "You are not authorized to create a pre-selection test for this job post";
			}

			// Step 5: Create the pre-selection test
			const preSelectionTest = await this.prisma.preSelectionTest.create({
				data: {
					test_name: testName,
					image: image || "", // If no image provided, use an empty string
					passing_grade: passingGrade,
					duration: duration,
					jobPost: {
						connect: {
							job_id: jobPostId,
						},
					},
				},
			});

			// Step 6: Update the JobPost with the preSelectionTestId
			const updatedJobPost = await this.prisma.jobPost.update({
				where: { job_id: jobPostId },
				data: {
					preSelectionTestId: preSelectionTest.test_id, // Link the test to the job post
				},
			});

			// Return the created pre-selection test and updated job post
			return { preSelectionTest, updatedJobPost };
		} catch (error) {
			const err = error as Error;
			return `Error: ${err.message}`;
		}
	}

	// In the PreSelectionTestService
	async deletePreSelectionTest(
		testId: number
	): Promise<PreSelectionTest | string> {
		try {
			// Step 1: Find the pre-selection test by ID
			const preSelectionTest = await this.prisma.preSelectionTest.findUnique({
				where: { test_id: testId },
				include: { jobPost: true },
			});

			if (!preSelectionTest) {
				return "Pre-selection test not found";
			}

			// // Step 2: Check if the pre-selection test has 0 applicants
			// const applicants = await this.prisma.application.findMany({
			// 	where: {
			// 		jobPost: {
			// 			preSelectionTestId: testId, // Use the preSelectionTestId from JobPost
			// 		},
			// 	},
			// });

			// if (applicants.length > 0) {
			// 	return "Pre-selection test has applicants, cannot delete";
			// }
			// Step 3: Check if all applicants have failed or rejected status
			const nonFailedOrRejectedApplicants =
				await this.prisma.application.findMany({
					where: {
						jobPost: {
							preSelectionTestId: testId, // Use the preSelectionTestId from JobPost
						},
						application_status: {
							notIn: ["failed", "rejected"], // Exclude failed and rejected statuses
						},
					},
				});

			// If there are any applicants that don't have failed or rejected status
			if (nonFailedOrRejectedApplicants.length > 0) {
				return "Some applicants have not failed or rejected status, cannot delete";
			}

			// Step 4: Mark the pre-selection test as deleted (soft delete)
			const updatedPreSelectionTest = await this.prisma.preSelectionTest.update(
				{
					where: { test_id: testId },
					data: {
						deleted: true, // Set 'deleted' to true to soft delete
					},
				}
			);

			return updatedPreSelectionTest;
		} catch (error) {
			const err = error as Error;
			return `Error: ${err.message}`;
		}
	}
}
