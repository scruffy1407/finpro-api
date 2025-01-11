import { PrismaClient } from "@prisma/client";
import { AuthUtils } from "../utils/auth.utils";
import { Decimal } from "@prisma/client/runtime/library";

interface ResultPreSelection {
	completion_id: number;
	applicationId: number;
	completion_score?: number;
	completion_date?: Date;
	completion_status?: string;
	created_at: Date;
	isRefreshed?: boolean;
}

interface Application {
	application_id: number;
	jobHunterId: number;
	jobId: number;
	resume?: string;
	expected_salary?: Decimal;
	application_status?: string;
	created_at: Date;
	updated_at?: Date;
}

export class ApplyTestService {
	private prisma: PrismaClient;
	private authUtils: AuthUtils;

	constructor() {
		this.prisma = new PrismaClient();
		this.authUtils = new AuthUtils();
	}

	async joinPreSelectionTest({
		jobId,
		token,
	}: {
		jobId: number;
		token: string;
	}): Promise<
		| string
		| { resultPreSelection: ResultPreSelection; application: Application }
	> {
		try {
			// Decode the token for verification
			const decodedToken = await this.authUtils.decodeToken(token);
			if (!decodedToken || !decodedToken.user_id) {
				return "Invalid token or user ID not found";
			}

			// Ensure the job post exists
			const jobPost = await this.prisma.jobPost.findUnique({
				where: { job_id: jobId },
				include: {
					preSelectionTest: true,
				},
			});

			if (!jobPost) {
				return "Job post not found";
			}

			// Ensure the job hunter exists

			const jobHunter = await this.prisma.jobHunter.findUnique({
				where: { userId: decodedToken.user_id },
			});

			if (!jobHunter) {
				return "Job hunter not found";
			}

			const jobHunterId = jobHunter.job_hunter_id;

			// Check if the job hunter profile is complete
			const requiredFields: Array<keyof typeof jobHunter> = [
				"name",
				"gender",
				"dob",
				"location_city",
				"location_province",
			];

			const missingFields = requiredFields.filter((field) => !jobHunter[field]);

			if (missingFields.length > 0) {
				return `The following fields are missing in your profile: ${missingFields.join(", ")}. Please complete your profile before joining the pre-selection test.`;
			}

			// Check if a ResultPreSelection already exists for this job post and job hunter
			const existingResult = await this.prisma.resultPreSelection.findFirst({
				where: {
					application: {
						jobHunterId: jobHunterId,
						jobId: jobId,
					},
				},
			});

			// if (existingResult) {
			// 	return "You have already joined this pre-selection test.";
			// }

			// Step 1: Create an application with `onTest` status
			const application = await this.prisma.application.create({
				data: {
					jobHunterId,
					jobId,
					application_status: "onTest", // Status set to 'onTest'
					expected_salary: 0, // Default salary
					resume: "",
				},
			});

			// Step 1.5 : Create a timeStamp

			const preSelectionTest = jobPost?.preSelectionTest;

			if (!preSelectionTest) {
				return "PreSelection Test Detail is not found";
			}

			const durationInMinutes = preSelectionTest.duration;
			const startDate = new Date(); // The time the user starts the test
			const endDate = new Date(startDate.getTime() + durationInMinutes * 60000); // Add duration to start time

			// Step 2: Create a ResultPreSelection entry
			const resultPreSelection = await this.prisma.resultPreSelection.create({
				data: {
					applicationId: application.application_id,
					completion_score: 0, // Initial score is 0
					start_date: startDate, // Record the start date
					end_date: endDate, // Record the calculated end date
					completion_date: startDate, // Store the start time in completion_date for now
					completion_status: "ongoing", // Initial status
					isRefreshed: false, // Default to false
				},
			});

			return {
				resultPreSelection,
				application,
			};
		} catch (error) {
			const err = error as Error;
			return `Error: ${err.message}`;
		}
	}

	async getPreSelectionQuestions({
		token,
		jobId,
	}: {
		token: string;
		jobId: number;
	}): Promise<{ questions: any[]; duration: number; testId: number } | string> {
		try {
			const decodedToken = await this.authUtils.decodeToken(token);
			if (!decodedToken || !decodedToken.user_id) {
				return "Invalid tokeb or user ID not found";
			}

			const jobPost = await this.prisma.jobPost.findUnique({
				where: { job_id: jobId },
				include: { preSelectionTest: true },
			});

			if (!jobPost || !jobPost.preSelectionTest) {
				return "Job post or PreSelectionTest not found.";
			}

			const preSelectionTest = jobPost.preSelectionTest;

			const jobHunter = await this.prisma.jobHunter.findUnique({
				where: { userId: decodedToken.user_id },
			});

			if (!jobHunter) {
				return "Job hunter not found.";
			}

			const jobHunterId = jobHunter.job_hunter_id;

			// Check if the user has already joined the preSelectionTest and their application status is "onTest"
			const application = await this.prisma.application.findFirst({
				where: {
					jobHunterId: jobHunterId,
					jobId: jobId,
					application_status: "onTest", // Ensure the application status is "onTest"
				},
			});

			if (!application) {
				return "You have not joined this pre-selection test or your application status is not 'onTest'. Please join the test first.";
			}

			// Fetch all questions related to the PreSelectionTest
			const questions = await this.prisma.testQuestion.findMany({
				where: { testId: preSelectionTest.test_id },
				select: {
					question_id: true,
					question: true,
					answer_1: true,
					answer_2: true,
					answer_3: true,
					answer_4: true,
				},
			});

			if (!questions || questions.length === 0) {
				return "No questions found for this pre-selection test.";
			}

			return {
				questions,
				duration: preSelectionTest.duration,
				testId: preSelectionTest.test_id,
			};
		} catch (error) {
			const err = error as Error;
			console.error("Error fetching pre-selection questions:", err.message);
			return `Error: ${err.message}`;
		}
	}

	// services/preSelectionTestService.ts
	async handlePreSelectionTest({
		testId,
		answers,
		token,
		applicationId, // Make sure to pass the applicationId from the client side
	}: {
		testId: number;
		answers: { question_id: number; chosen_answer: string }[];
		token: string;
		applicationId: number; // Pass applicationId here
	}): Promise<
		| {
				score: number;
				totalQuestions: number;
				completionStatus: string;
				newApplicationStatus: string;
		  }
		| string
	> {
		try {
			// Decode the token for verification
			const decodedToken = await this.authUtils.decodeToken(token);
			if (!decodedToken || !decodedToken.user_id) {
				return "Invalid token or user ID not found";
			}
			// Step 1: Fetch questions for the given testId
			const questions = await this.prisma.testQuestion.findMany({
				where: { testId },
			});

			if (!questions || questions.length === 0) {
				return "No questions found for this test.";
			}

			// Step 2: Validate all answers are for questions in this test
			const questionIds = questions.map((q) => q.question_id);
			const invalidAnswers = answers.filter(
				(a) => !questionIds.includes(a.question_id)
			);
			if (invalidAnswers.length > 0) {
				return "Some answers are invalid or do not belong to this test.";
			}

			// Step 3: Calculate score
			let score = 0;
			questions.forEach((question) => {
				const userAnswer = answers.find(
					(a) => a.question_id === question.question_id
				);
				if (
					userAnswer &&
					userAnswer.chosen_answer === question.correct_answer
				) {
					score += 4;
				}
			});

			// Fetch the passing grade for the pre-selection test
			const preSelectionTest = await this.prisma.preSelectionTest.findUnique({
				where: { test_id: testId }, // testId passed in the request body
			});

			if (!preSelectionTest) {
				return "Pre-selection test not found.";
			}

			const { passing_grade: passingGrade } = preSelectionTest;

			// Determine the completion status based on the score and passing grade
			const completionStatus = score >= passingGrade ? "pass" : "failed";

			// Step 4: Fetch the ResultPreSelection using applicationId
			const resultPreSelection = await this.prisma.resultPreSelection.findFirst(
				{
					where: { applicationId },
				}
			);

			if (!resultPreSelection) {
				return "ResultPreSelection not found for the provided applicationId.";
			}

			// Step 5: Update ResultPreSelection score with completion_id
			const updatedResult = await this.prisma.resultPreSelection.update({
				where: {
					completion_id: resultPreSelection.completion_id, // Use completion_id here
				},
				data: {
					completion_score: score,
					completion_status: completionStatus,
				},
			});

			console.log("Updated ResultPreSelection: ", updatedResult); // Add a log to confirm the update

			// Step 6: Update Application status
			const newApplicationStatus =
				completionStatus === "pass" ? "waitingSubmission" : "rejected";

			await this.prisma.application.update({
				where: { application_id: applicationId },
				data: {
					application_status: newApplicationStatus,
				},
			});

			console.log(
				`Application ${applicationId} updated with status: ${newApplicationStatus}`
			);
			// Return the score and total number of questions
			return {
				score,
				totalQuestions: questions.length,
				completionStatus, // Include completion status in the return
				newApplicationStatus,
			};
		} catch (error) {
			const err = error as Error;
			console.error("Error updating application:", err.message);
			return `Error: ${err.message}`;
		}
	}

	async updateResult({
		applicationId,
		token,
		testId,
		answers,
	}: {
		applicationId: number;
		token: string;
		testId: number;
		answers: { question_id: number; chosen_answer: string }[];
	}): Promise<
		| {
				updatedResult: ResultPreSelection;
				score: number;
				totalQuestions: number;
				completionStatus: string;
				newApplicationStatus: string;
		  }
		| string
	> {
		try {
			// Decode the token for verification
			const decodedToken = await this.authUtils.decodeToken(token);
			if (!decodedToken || !decodedToken.user_id) {
				return "Invalid token or user ID not found";
			}

			// Fetch the application
			const application = await this.prisma.application.findUnique({
				where: { application_id: applicationId },
			});

			if (!application) {
				return "Application not found";
			}

			// Fetch the ResultPreSelection entry for the applicationId
			const resultPreSelection = await this.prisma.resultPreSelection.findFirst(
				{
					where: { applicationId },
				}
			);

			if (!resultPreSelection) {
				return "ResultPreSelection not found for the provided applicationId.";
			}

			// Check if the end_date is available
			if (!resultPreSelection.end_date) {
				return "End date not available. Unable to proceed with the test.";
			}

			// Get the current time and check if the test has expired
			const currentTime = new Date();
			if (currentTime > resultPreSelection.end_date) {
				// Test has expired, cannot proceed further
				return "Test time has expired. You can no longer submit your answers.";
			}

			// Fetch the questions for the pre-selection test
			const questions = await this.prisma.testQuestion.findMany({
				where: { testId },
			});

			if (!questions || questions.length === 0) {
				return "No questions found for this test.";
			}

			// Validate the answers for the questions in the test
			const questionIds = questions.map((q) => q.question_id);
			const invalidAnswers = answers.filter(
				(a) => !questionIds.includes(a.question_id)
			);
			if (invalidAnswers.length > 0) {
				return "Some answers are invalid or do not belong to this test.";
			}

			// Calculate the score based on the answers
			let score = 0;
			questions.forEach((question) => {
				const userAnswer = answers.find(
					(a) => a.question_id === question.question_id
				);
				if (
					userAnswer &&
					userAnswer.chosen_answer === question.correct_answer
				) {
					score += 4; // Assuming correct answers earn 4 points
				}
			});

			// Fetch the pre-selection test details, including passing grade
			const preSelectionTest = await this.prisma.preSelectionTest.findUnique({
				where: { test_id: testId },
			});

			if (!preSelectionTest) {
				return "Pre-selection test not found.";
			}

			const { passing_grade: passingGrade } = preSelectionTest;
			const completionStatus = score >= passingGrade ? "pass" : "failed";

			// Update the ResultPreSelection with the calculated score and status
			const updatedResult = await this.prisma.resultPreSelection.update({
				where: { completion_id: resultPreSelection.completion_id },
				data: {
					completion_score: score,
					completion_status: completionStatus,
				},
			});

			// Update the application status based on the test result
			const newApplicationStatus =
				completionStatus === "pass" ? "waitingSubmission" : "rejected";

			await this.prisma.application.update({
				where: { application_id: applicationId },
				data: {
					application_status: newApplicationStatus,
				},
			});

			// Return the updated result and other relevant details
			return {
				updatedResult,
				score,
				totalQuestions: questions.length,
				completionStatus,
				newApplicationStatus,
			};
		} catch (error) {
			const err = error as Error;
			console.error("Error updating test result:", err.message);
			return `Error: ${err.message}`;
		}
	}

	async getTestTime({
		applicationId,
		token,
	}: {
		applicationId: number;
		token: string;
	}): Promise<{ startDate: Date; endDate: Date } | string> {
		try {
			// Decode the token for verification
			const decodedToken = await this.authUtils.decodeToken(token);
			if (!decodedToken || !decodedToken.user_id) {
				return "Invalid token or user ID not found.";
			}

			// Fetch the application based on applicationId
			const application = await this.prisma.application.findUnique({
				where: { application_id: applicationId },
			});

			if (!application) {
				return "Application not found.";
			}

			// Fetch the ResultPreSelection based on applicationId
			const resultPreSelection = await this.prisma.resultPreSelection.findFirst(
				{
					where: { applicationId },
				}
			);

			if (!resultPreSelection) {
				return "ResultPreSelection not found for the provided applicationId.";
			}

			// Ensure both start_date and end_date are available
			const { start_date: startDate, end_date: endDate } = resultPreSelection;

			if (!startDate || !endDate) {
				return "Start date or end date not available for this test.";
			}

			// Return the start and end date
			return {
				startDate,
				endDate,
			};
		} catch (error) {
			const err = error as Error;
			console.error("Error fetching test start and end date:", err.message);
			return `Error: ${err.message}`;
		}
	}

	async updateCompletionScore({
		applicationId,
		token,
		testId,
		answers,
	}: {
		applicationId: number;
		token: string;
		testId: number;
		answers: { question_id: number; chosen_answer: string }[];
	}): Promise<
		| {
				updatedResult: ResultPreSelection;
				score: number;
				totalQuestions: number;
		  }
		| string
	> {
		try {
			// Decode the token for verification
			const decodedToken = await this.authUtils.decodeToken(token);
			if (!decodedToken || !decodedToken.user_id) {
				return "Invalid token or user ID not found";
			}

			// Fetch the ResultPreSelection entry for the applicationId
			const resultPreSelection = await this.prisma.resultPreSelection.findFirst(
				{
					where: { applicationId },
				}
			);

			if (!resultPreSelection) {
				return "ResultPreSelection not found for the provided applicationId.";
			}

			// Fetch the questions for the pre-selection test
			const questions = await this.prisma.testQuestion.findMany({
				where: { testId },
			});

			if (!questions || questions.length === 0) {
				return "No questions found for this test.";
			}

			// Validate the answers for the questions in the test
			const questionIds = questions.map((q) => q.question_id);
			const invalidAnswers = answers.filter(
				(a) => !questionIds.includes(a.question_id)
			);
			if (invalidAnswers.length > 0) {
				return "Some answers are invalid or do not belong to this test.";
			}

			// Calculate the score based on the answers
			let score = 0;
			questions.forEach((question) => {
				const userAnswer = answers.find(
					(a) => a.question_id === question.question_id
				);
				if (
					userAnswer &&
					userAnswer.chosen_answer === question.correct_answer
				) {
					score += 4; // Assuming correct answers earn 4 points
				}
			});

			// Update only the score in ResultPreSelection
			const updatedResult = await this.prisma.resultPreSelection.update({
				where: { completion_id: resultPreSelection.completion_id },
				data: {
					completion_score: score,
				},
			});

			// Return the updated result and the calculated score
			return {
				updatedResult,
				score,
				totalQuestions: questions.length,
			};
		} catch (error) {
			const err = error as Error;
			console.error("Error updating completion score:", err.message);
			return `Error: ${err.message}`;
		}
	}
}

// async handlePageLeave({
// 	applicationId,
// 	testId,
// 	answers, // Pass the current progress if available
// }: {
// 	applicationId: number;
// 	testId: number;
// 	answers: { question_id: number; chosen_answer: string }[]; // Optional
// }): Promise<string> {
// 	try {
// 		const resultPreSelection = await this.prisma.resultPreSelection.findFirst(
// 			{
// 				where: { applicationId },
// 			}
// 		);

// 		if (!resultPreSelection) {
// 			return "ResultPreSelection not found for the provided applicationId.";
// 		}

// 		// Update `isRefreshed` to `true`
// 		await this.prisma.resultPreSelection.update({
// 			where: {
// 				completion_id: resultPreSelection.completion_id,
// 			},
// 			data: {
// 				isRefreshed: true,
// 			},
// 		});

// 		// Optional: Calculate and save score for answered questions
// 		if (answers && answers.length > 0) {
// 			const questions = await this.prisma.testQuestion.findMany({
// 				where: { testId },
// 			});

// 			if (questions && questions.length > 0) {
// 				let score = 0;
// 				questions.forEach((question) => {
// 					const userAnswer = answers.find(
// 						(a) => a.question_id === question.question_id
// 					);
// 					if (
// 						userAnswer &&
// 						userAnswer.chosen_answer === question.correct_answer
// 					) {
// 						score += 4; // Adjust scoring logic if needed
// 					}
// 				});

// 				await this.prisma.resultPreSelection.update({
// 					where: {
// 						completion_id: resultPreSelection.completion_id,
// 					},
// 					data: {
// 						completion_score: score,
// 					},
// 				});
// 			}
// 		}

// 		return "isRefreshed has been updated to true, and progress has been saved.";
// 	} catch (error) {
// 		const err = error as Error;
// 		console.error("Error marking isRefreshed:", err.message);
// 		return `Error: ${err.message}`;
// 	}
// }

// async submitTestAfterReturn({
// 	testId,
// 	answers,
// 	token,
// 	applicationId,
// }: {
// 	testId: number;
// 	answers: { question_id: number; chosen_answer: string }[];
// 	token: string;
// 	applicationId: number;
// }): Promise<
// 	| {
// 			score: number;
// 			totalQuestions: number;
// 			completionStatus: string;
// 			newApplicationStatus: string;
// 	  }
// 	| string
// > {
// 	try {
// 		// Decode the token
// 		const decodedToken = await this.authUtils.decodeToken(token);
// 		if (!decodedToken || !decodedToken.user_id) {
// 			return "Invalid token or user ID not found";
// 		}

// 		// Fetch the ResultPreSelection record
// 		const resultPreSelection = await this.prisma.resultPreSelection.findFirst(
// 			{
// 				where: { applicationId },
// 			}
// 		);

// 		if (!resultPreSelection) {
// 			return "ResultPreSelection not found for the provided applicationId.";
// 		}

// 		const {
// 			start_date: startDate,
// 			end_date: endDate,
// 			isRefreshed,
// 		} = resultPreSelection;

// 		if (!startDate || !endDate) {
// 			return "Test period not defined (startDate or endDate is null).";
// 		}

// 		const currentTime = new Date();
// 		if (currentTime < startDate || currentTime > endDate) {
// 			return "The test period has expired.";
// 		}

// 		// Handle submission if isRefreshed is true
// 		if (isRefreshed) {
// 			await this.prisma.resultPreSelection.update({
// 				where: { completion_id: resultPreSelection.completion_id },
// 				data: { isRefreshed: false },
// 			});
// 		}

// 		// Proceed to handle the test submission logic (similar to handlePreSelectionTest)
// 		const questions = await this.prisma.testQuestion.findMany({
// 			where: { testId },
// 		});

// 		if (!questions || questions.length === 0) {
// 			return "No questions found for this test.";
// 		}

// 		let score = 0;
// 		questions.forEach((question) => {
// 			const userAnswer = answers.find(
// 				(a) => a.question_id === question.question_id
// 			);
// 			if (
// 				userAnswer &&
// 				userAnswer.chosen_answer === question.correct_answer
// 			) {
// 				score += 4;
// 			}
// 		});

// 		const preSelectionTest = await this.prisma.preSelectionTest.findUnique({
// 			where: { test_id: testId },
// 		});

// 		if (!preSelectionTest) {
// 			return "Pre-selection test not found.";
// 		}

// 		const completionStatus =
// 			score >= preSelectionTest.passing_grade ? "pass" : "failed";
// 		const newApplicationStatus =
// 			completionStatus === "pass" ? "waitingSubmission" : "rejected";

// 		await this.prisma.resultPreSelection.update({
// 			where: { completion_id: resultPreSelection.completion_id },
// 			data: {
// 				completion_score: score,
// 				completion_status: completionStatus,
// 			},
// 		});

// 		await this.prisma.application.update({
// 			where: { application_id: applicationId },
// 			data: { application_status: newApplicationStatus },
// 		});

// 		return {
// 			score,
// 			totalQuestions: questions.length,
// 			completionStatus,
// 			newApplicationStatus,
// 		};
// 	} catch (error) {
// 		const err = error as Error;
// 		console.error("Error handling test submission:", err.message);
// 		return `Error: ${err.message}`;
// 	}
// }
