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
			const decodedToken = await this.authUtils.decodeToken(token);
			if (!decodedToken || !decodedToken.user_id) {
				return "Invalid token or user ID not found";
			}
			const jobPost = await this.prisma.jobPost.findUnique({
				where: { job_id: jobId },
				include: {
					preSelectionTest: true,
				},
			});

			if (!jobPost) {
				return "Job post not found";
			}
			const jobHunter = await this.prisma.jobHunter.findUnique({
				where: { userId: decodedToken.user_id },
			});
			if (!jobHunter) {
				return "Job hunter not found";
			}

			const jobHunterId = jobHunter.job_hunter_id;
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

			const lastResult = await this.prisma.resultPreSelection.findFirst({
				where: {
					application: {
						jobHunterId: jobHunterId,
						jobId: jobId,
					},
					completion_status: "failed", 
				},
				orderBy: {
					completion_date: "desc", 
				},
			});

			if (lastResult) {

				if (!lastResult.end_date) {
					return "Error: Last result's end date is missing or null.";
				}

				const currentDate = new Date();
				const lastEndDate = new Date(lastResult.end_date); 

				if (isNaN(lastEndDate.getTime())) {
					return "Error: Last result's end date is invalid.";
				}

				const daysPassed =
					(currentDate.getTime() - lastEndDate.getTime()) / (1000 * 3600 * 24);

				if (daysPassed < 7) {
					return `You cannot join the pre-selection test again until 7 days have passed since your last failure. Please wait ${7 - Math.floor(daysPassed)} day(s).`;
				}
			}

			const existingResult = await this.prisma.resultPreSelection.findFirst({
				where: {
					application: {
						jobHunterId: jobHunterId,
						jobId: jobId,
					},
				},
			});
			const application = await this.prisma.application.create({
				data: {
					jobHunterId,
					jobId,
					application_status: "onTest",
					expected_salary: 0,
					resume: "",
				},
			});
			const preSelectionTest = jobPost?.preSelectionTest;

			if (!preSelectionTest) {
				return "PreSelection Test Detail is not found";
			}

			const durationInMinutes = preSelectionTest.duration;
			const startDate = new Date();
			const endDate = new Date(startDate.getTime() + durationInMinutes * 60000);
			const resultPreSelection = await this.prisma.resultPreSelection.create({
				data: {
					applicationId: application.application_id,
					completion_score: 0,
					start_date: startDate,
					end_date: endDate,
					completion_date: startDate,
					completion_status: "ongoing",
					isRefreshed: false,
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
			const application = await this.prisma.application.findFirst({
				where: {
					jobHunterId: jobHunterId,
					jobId: jobId,
					application_status: "onTest",
				},
			});

			if (!application) {
				return "You have not joined this pre-selection test or your application status is not 'onTest'. Please join the test first.";
			}
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

	async handlePreSelectionTest({
		testId,
		answers,
		token,
		applicationId,
	}: {
		testId: number;
		answers: { question_id: number; chosen_answer: string }[];
		token: string;
		applicationId: number;
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
			const decodedToken = await this.authUtils.decodeToken(token);
			if (!decodedToken || !decodedToken.user_id) {
				return "Invalid token or user ID not found";
			}
			const questions = await this.prisma.testQuestion.findMany({
				where: { testId },
			});

			if (!questions || questions.length === 0) {
				return "No questions found for this test.";
			}
			const questionIds = questions.map((q) => q.question_id);
			const invalidAnswers = answers.filter(
				(a) => !questionIds.includes(a.question_id)
			);
			if (invalidAnswers.length > 0) {
				return "Some answers are invalid or do not belong to this test.";
			}
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
			const preSelectionTest = await this.prisma.preSelectionTest.findUnique({
				where: { test_id: testId },
			});
			if (!preSelectionTest) {
				return "Pre-selection test not found.";
			}
			const { passing_grade: passingGrade } = preSelectionTest;
			const completionStatus = score >= passingGrade ? "pass" : "failed";
			const resultPreSelection = await this.prisma.resultPreSelection.findFirst(
				{
					where: { applicationId },
				}
			);

			if (!resultPreSelection) {
				return "ResultPreSelection not found for the provided applicationId.";
			}
			const updatedResult = await this.prisma.resultPreSelection.update({
				where: {
					completion_id: resultPreSelection.completion_id,
				},
				data: {
					completion_score: score,
					completion_status: completionStatus,
				},
			});
			const newApplicationStatus =
				completionStatus === "pass" ? "waitingSubmission" : "rejected";

			await this.prisma.application.update({
				where: { application_id: applicationId },
				data: {
					application_status: newApplicationStatus,
				},
			});
			return {
				score,
				totalQuestions: questions.length,
				completionStatus,
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
			const decodedToken = await this.authUtils.decodeToken(token);
			if (!decodedToken || !decodedToken.user_id) {
				return "Invalid token or user ID not found";
			}
			const application = await this.prisma.application.findUnique({
				where: { application_id: applicationId },
			});

			if (!application) {
				return "Application not found";
			}
			const resultPreSelection = await this.prisma.resultPreSelection.findFirst(
				{
					where: { applicationId },
				}
			);
			if (!resultPreSelection) {
				return "ResultPreSelection not found for the provided applicationId.";
			}
			if (!resultPreSelection.end_date) {
				return "End date not available. Unable to proceed with the test.";
			}
			const currentTime = new Date();
			if (currentTime > resultPreSelection.end_date) {
				return "Test time has expired. You can no longer submit your answers.";
			}
			const questions = await this.prisma.testQuestion.findMany({
				where: { testId },
			});

			if (!questions || questions.length === 0) {
				return "No questions found for this test.";
			}
			const questionIds = questions.map((q) => q.question_id);
			const invalidAnswers = answers.filter(
				(a) => !questionIds.includes(a.question_id)
			);
			if (invalidAnswers.length > 0) {
				return "Some answers are invalid or do not belong to this test.";
			}
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
			const preSelectionTest = await this.prisma.preSelectionTest.findUnique({
				where: { test_id: testId },
			});

			if (!preSelectionTest) {
				return "Pre-selection test not found.";
			}

			const { passing_grade: passingGrade } = preSelectionTest;
			const completionStatus = score >= passingGrade ? "pass" : "failed";
			const updatedResult = await this.prisma.resultPreSelection.update({
				where: { completion_id: resultPreSelection.completion_id },
				data: {
					completion_score: score,
					completion_status: completionStatus,
				},
			});
			const newApplicationStatus =
				completionStatus === "pass" ? "waitingSubmission" : "rejected";

			await this.prisma.application.update({
				where: { application_id: applicationId },
				data: {
					application_status: newApplicationStatus,
				},
			});
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
			const decodedToken = await this.authUtils.decodeToken(token);
			if (!decodedToken || !decodedToken.user_id) {
				return "Invalid token or user ID not found.";
			}
			const application = await this.prisma.application.findUnique({
				where: { application_id: applicationId },
			});

			if (!application) {
				return "Application not found.";
			}
			const resultPreSelection = await this.prisma.resultPreSelection.findFirst(
				{
					where: { applicationId },
				}
			);

			if (!resultPreSelection) {
				return "ResultPreSelection not found for the provided applicationId.";
			}
			const { start_date: startDate, end_date: endDate } = resultPreSelection;

			if (!startDate || !endDate) {
				return "Start date or end date not available for this test.";
			}
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
			const decodedToken = await this.authUtils.decodeToken(token);
			if (!decodedToken || !decodedToken.user_id) {
				return "Invalid token or user ID not found";
			}
			const resultPreSelection = await this.prisma.resultPreSelection.findFirst(
				{
					where: { applicationId },
				}
			);

			if (!resultPreSelection) {
				return "ResultPreSelection not found for the provided applicationId.";
			}
			const questions = await this.prisma.testQuestion.findMany({
				where: { testId },
			});

			if (!questions || questions.length === 0) {
				return "No questions found for this test.";
			}
			const questionIds = questions.map((q) => q.question_id);
			const invalidAnswers = answers.filter(
				(a) => !questionIds.includes(a.question_id)
			);
			if (invalidAnswers.length > 0) {
				return "Some answers are invalid or do not belong to this test.";
			}
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

			const updatedResult = await this.prisma.resultPreSelection.update({
				where: { completion_id: resultPreSelection.completion_id },
				data: {
					completion_score: score,
				},
			});
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
