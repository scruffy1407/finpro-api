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
		// jobPostId,
		testName,
		image = "",
		passingGrade = 85,
		duration = 30,
		token, // Token is passed in for authentication
	}: {
		testName: string;
		image?: string;
		passingGrade?: number;
		duration?: number;
		token: string; // Passing the JWT token to validate the company
	}): Promise<{ preSelectionTest: PreSelectionTest } | string> {
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

			const companyId = company?.company_id;

			if (!company) {
				return "User is not associated with a company";
			}

			// // Step 3: Check if the job post exists
			// const jobPost = await this.prisma.jobPost.findUnique({
			// 	where: { job_id: jobPostId },
			// 	include: { company: true },
			// });

			// if (!jobPost) {
			// 	return "JobPost not found";
			// }

			// // Step 4: Verify that the job post belongs to the same company
			// if (jobPost.company.company_id !== company.company_id) {
			// 	return "You are not authorized to create a pre-selection test for this job post";
			// }

			// Step 5: Create the pre-selection test
			const preSelectionTest = await this.prisma.preSelectionTest.create({
				data: {
					test_name: testName,
					image: image || "", // If no image provided, use an empty string
					passing_grade: passingGrade,
					duration: duration,
					companyId: companyId,
					// jobPost: {
					// 	connect: {
					// 		job_id: jobPostId,
					// 	},
					// },
				},
			});

			// Return the created pre-selection test and updated job post
			return { preSelectionTest };
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

			if (preSelectionTest.deleted === true) {
				return "The selected Pre-Selection test is already deleted";
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

	async updatePreSelectionTest({
		testId,
		jobPostId,
		testName,
		image,
		passingGrade,
		duration,
		token,
	}: {
		testId: number;
		testName?: string;
		image?: string;
		passingGrade?: number;
		duration?: number;
		jobPostId?: number;
		token: string;
	}): Promise<PreSelectionTest | string> {
		try {
			const decodedToken = await this.authUtils.decodeToken(token);
			if (!decodedToken || !decodedToken.user_id) {
				return "invalid token or user ID not found";
			}

			const userId = decodedToken?.user_id;

			const company = await this.prisma.company.findFirst({
				where: { userId: userId },
				select: { company_id: true },
			});

			if (!company) {
				return "User is not associated with a company";
			}

			const preSelectionTest = await this.prisma.preSelectionTest.findUnique({
				where: { test_id: testId },
				include: { jobPost: true },
			});

			if (!preSelectionTest) {
				return "PreSelection test not found";
			}

			// Validate and connect the job post if jobPostId is provided
			if (jobPostId) {
				const jobPost = await this.prisma.jobPost.findUnique({
					where: { job_id: jobPostId },
					include: { company: true },
				});

				if (!jobPost) {
					return "Job post not found";
				}

				if (jobPost.company.company_id !== company.company_id) {
					return "You are not authorized to associate this job post with the pre-selection test";
				}

				// Connect the job post to the pre-selection test
				await this.prisma.preSelectionTest.update({
					where: { test_id: testId },
					data: {
						jobPost: {
							connect: {
								job_id: jobPostId,
							},
						},
					},
				});
			}

			const updateData: {
				test_name?: string;
				image?: string;
				passing_grade?: number;
				duration?: number;
			} = {};

			if (testName) {
				updateData.test_name = testName;
			}

			if (image !== undefined) {
				updateData.image = image;
			}

			if (passingGrade !== undefined) {
				updateData.passing_grade = passingGrade;
			}
			if (duration !== undefined) {
				updateData.duration = duration;
			}

			const updatedPreSelectionTest = await this.prisma.preSelectionTest.update(
				{
					where: { test_id: testId },
					data: updateData,
				}
			);

			return updatedPreSelectionTest;
		} catch (error) {
			const err = error as Error;
			return `Error is ${err.message}`;
		}
	}

	async createTest(testId: number, questions: Array<any>): Promise<any> {
		try {
			// Step 1: Find the pre-selection test by ID and check how many questions already exist
			const preSelectionTest = await this.prisma.preSelectionTest.findUnique({
				where: { test_id: testId },
				include: { testQuestions: true }, // Include the existing questions
			});

			if (!preSelectionTest) {
				return "Pre-selection test not found.";
			}

			const existingQuestionsCount = preSelectionTest.testQuestions.length;

			// Step 2: Check if there are already 25 questions
			if (existingQuestionsCount >= 25) {
				return "This Pre-selection Test already has 25 questions. You cannot add more.";
			}

			// Step 3: Check how many more questions can be added
			const remainingQuestions = 25 - existingQuestionsCount;

			if (questions.length > remainingQuestions) {
				return `You can only add ${remainingQuestions} more questions.`;
			}

			// Step 4: Validate that the correct_answer is one of the options
			for (let i = 0; i < questions.length; i++) {
				const { answer_1, answer_2, answer_3, answer_4, correct_answer } =
					questions[i];

				if (
					![answer_1, answer_2, answer_3, answer_4].includes(correct_answer)
				) {
					return `Correct answer must be one of the provided options for question ${i + 1}.`;
				}
			}

			const createdQuestions = await this.prisma.testQuestion.createMany({
				data: questions.map((question, index) => ({
					testId,
					question_number: index + 1,
					question: question.question,
					answer_1: question.answer_1,
					answer_2: question.answer_2,
					answer_3: question.answer_3,
					answer_4: question.answer_4,
					correct_answer: question.correct_answer,
				})),
			});

			return createdQuestions;
		} catch (error) {
			const err = error as Error;
			return `Error creating a questions ${err.message}`;
		}
	}
	async updateTestQuestions({
		preSelectionTestId,
		questions, // Array of questions
		token,
	}: {
		preSelectionTestId: number;
		questions: {
			questionId: number;
			question: string;
			answer_1: string;
			answer_2: string;
			answer_3: string;
			answer_4: string;
			correct_answer: string;
		}[];
		token: string;
	}) {
		try {
			console.log("Received questions:", questions); // Log the entire questions array

			// Step 1: Check if pre-selection test exists
			const preSelectionTest = await this.prisma.preSelectionTest.findUnique({
				where: { test_id: preSelectionTestId },
			});

			if (!preSelectionTest) {
				return { status: "error", message: "Pre-selection test not found." }; // Return structured error
			}

			// Step 2: Initialize an array to collect update promises
			const updatePromises = [];

			// Step 3: Loop through each question in the request body
			for (const question of questions) {
				const {
					questionId,
					question: questionText,
					answer_1,
					answer_2,
					answer_3,
					answer_4,
					correct_answer,
				} = question;

				console.log("Processing Question with ID:", questionId); // Debugging line

				// Check if the questionId is valid
				if (!questionId) {
					console.log(
						"Error: questionId is undefined or invalid for question:",
						question
					);
					updatePromises.push(Promise.reject("Invalid questionId."));
					continue;
				}

				// Find the existing question in the database (instead of fetching all test questions)
				const questionToUpdate = await this.prisma.testQuestion.findUnique({
					where: { question_id: questionId },
				});

				if (!questionToUpdate) {
					// Collect the error and continue to the next question
					updatePromises.push(
						Promise.reject(`Question with ID ${questionId} not found.`)
					);
					continue;
				}

				// Step 4: Validate that the correct_answer is one of the options
				if (
					![answer_1, answer_2, answer_3, answer_4].includes(correct_answer)
				) {
					// Collect the error and continue to the next question
					updatePromises.push(
						Promise.reject(
							`Correct answer must be one of the provided options for question ID ${questionId}.`
						)
					);
					continue;
				}

				// Step 5: Add the update to the promises array
				updatePromises.push(
					this.prisma.testQuestion.update({
						where: { question_id: questionId },
						data: {
							question: questionText,
							answer_1,
							answer_2,
							answer_3,
							answer_4,
							correct_answer,
						},
					})
				);
			}

			// Step 6: Wait for all updates and check for errors
			const updateResults = await Promise.allSettled(updatePromises);

			// Filter out any failed updates
			const errors = updateResults
				.filter((result) => result.status === "rejected")
				.map((result) => (result as PromiseRejectedResult).reason);

			if (errors.length > 0) {
				// Return structured error if any updates failed
				return {
					status: "error",
					message: `Error(s) occurred: ${errors.join(", ")}`,
				};
			}

			// Return success message if no errors occurred
			return {
				status: "success",
				message: "All questions updated successfully.",
			};
		} catch (error) {
			const err = error as Error;
			return { status: "error", message: `Error: ${err.message}` }; // Return error structure
		}
	}

	async getExistingQuestionsCount(testId: number): Promise<number> {
		try {
			const preSelectionTest = await this.prisma.preSelectionTest.findUnique({
				where: { test_id: testId },
				include: { testQuestions: true }, // Include the related test questions
			});

			if (!preSelectionTest) {
				return 0; // If no test is found, return 0
			}

			return preSelectionTest.testQuestions.length; // Return the count of existing questions
		} catch (error) {
			console.error("Error getting existing questions count:", error);
			throw new Error("Error fetching existing questions count.");
		}
	}

	async getPreSelectionTestsByCompany(token: string): Promise<any> {
		try {
			// Decode the provided token to retrieve the user's ID
			const decodedToken = await this.authUtils.decodeToken(token);
			if (!decodedToken || !decodedToken.user_id) {
				return { error: "Invalid token or company ID not found" };
			}

			const userId = decodedToken.user_id;

			// Fetch the company associated with the user
			const company = await this.prisma.company.findFirst({
				where: { userId: userId },
				select: { company_id: true },
			});

			if (!company) {
				return { error: "Company not found for the given user" };
			}

			const companyId = company.company_id;

			// Fetch all pre-selection tests created by the company
			const preSelectionTests = await this.prisma.preSelectionTest.findMany({
				where: {
					companyId: companyId, // Directly filter by companyId
					deleted: false,
				},
				select: {
					test_id: true,
					test_name: true,
					image: true,
					passing_grade: true,
					duration: true,
					created_at: true,
					_count: {
						select: {
							testQuestions: true, // Count of associated questions
						},
					},
				},
			});

			return preSelectionTests;
		} catch (error) {
			const err = error as Error;
			return { error: "Error fetching pre-selection tests: " + err.message };
		}
	}

	async getPreSelectionTestById(token: string, testId: number): Promise<any> {
		try {
			// Decode the provided token to retrieve the user's ID
			const decodedToken = await this.authUtils.decodeToken(token);
			if (!decodedToken || !decodedToken.user_id) {
				return { error: "Invalid token or company ID not found" };
			}

			const userId = decodedToken.user_id;

			// Fetch the company associated with the user
			const company = await this.prisma.company.findFirst({
				where: { userId: userId },
				select: { company_id: true },
			});

			if (!company) {
				return { error: "Company not found for the given user" };
			}

			const companyId = company.company_id;

			// Fetch the pre-selection test based on test_id and companyId
			const preSelectionTest = await this.prisma.preSelectionTest.findUnique({
				where: {
					test_id: testId, // Use test_id as the unique identifier
				},
				select: {
					test_id: true,
					passing_grade: true,
					test_name: true,
					duration: true,
					companyId: true, // Include the companyId to check the relationship
				},
			});

			// Check if the test belongs to the company
			if (!preSelectionTest) {
				return { error: "Pre-selection test not found" };
			}

			if (preSelectionTest.companyId !== companyId) {
				return { error: "You do not have access to this test" };
			}

			// Return only test_id and test_name
			return {
				test_id: preSelectionTest.test_id,
				test_name: preSelectionTest.test_name,
				passing_grade: preSelectionTest.passing_grade,
				duration: preSelectionTest.duration,
			};
		} catch (error) {
			const err = error as Error;
			return { error: "Error fetching pre-selection test: " + err.message };
		}
	}

	async getTestByPreTestId(testId: number, token: string): Promise<any> {
		try {
			// Step 1: Decode the token and get the userId and companyId
			const decodedToken = await this.authUtils.decodeToken(token);
			if (!decodedToken || !decodedToken.user_id) {
				return { error: "Invalid token or company ID not found" };
			}

			const userId = decodedToken.user_id;

			// Fetch the company associated with the user
			const company = await this.prisma.company.findFirst({
				where: { userId: userId },
				select: { company_id: true },
			});

			if (!company) {
				return { error: "Company not found for the given user" };
			}

			const companyId = company.company_id;

			// Step 2: Find the pre-selection test by ID and check if it belongs to the company
			const preSelectionTest = await this.prisma.preSelectionTest.findUnique({
				where: { test_id: testId },
				include: {
					testQuestions: {
						orderBy: {
							question_id: "asc", // Sorting by question_id in ascending order
						},
					},
				},
			});

			if (!preSelectionTest) {
				return "Pre-selection test not found.";
			}

			// Step 3: Check if the test belongs to the current company
			if (preSelectionTest.companyId !== companyId) {
				return "You are not authorized to access this test.";
			}

			// Step 4: Return the pre-selection test with the questions
			return preSelectionTest;
		} catch (error) {
			const err = error as Error;
			return `Error fetching pre-selection test: ${err.message}`;
		}
	}

	async softDeletePreSelectionTest(
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

			if (preSelectionTest.deleted === true) {
				return "The selected Pre-Selection test is already deleted";
			}

			// Step 2: Check if all applicants have failed or rejected status
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

			// Step 3: Mark the pre-selection test as deleted (soft delete)
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

	async getPreSelectionTestByIdHead(
		token: string,
		testId: number
	): Promise<any> {
		try {
			// Decode the provided token to retrieve the user's ID
			const decodedToken = await this.authUtils.decodeToken(token);
			if (!decodedToken || !decodedToken.user_id) {
				return { error: "Invalid token or user ID not found" };
			}

			const userId = decodedToken.user_id;

			// Fetch the pre-selection test based on testId
			const preSelectionTest = await this.prisma.preSelectionTest.findUnique({
				where: {
					test_id: testId, // Use test_id as the unique identifier
				},
				select: {
					test_id: true,
					passing_grade: true,
					test_name: true,
					duration: true,
					jobPost: {
						select: {
							job_id: true,
						},
					},
				},
			});

			if (!preSelectionTest) {
				return { error: "Pre-selection test not found" };
			}

			const jobIds = preSelectionTest.jobPost.map((job) => job.job_id);

			// Return only the relevant fields: test_id, test_name, passing_grade, and duration
			return {
				test_id: preSelectionTest.test_id,
				test_name: preSelectionTest.test_name,
				passing_grade: preSelectionTest.passing_grade,
				duration: preSelectionTest.duration,
				job_id: jobIds,
			};
		} catch (error) {
			const err = error as Error;
			return { error: "Error fetching pre-selection test: " + err.message };
		}
	}
}
