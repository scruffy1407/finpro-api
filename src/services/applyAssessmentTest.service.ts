import { PrismaClient } from "@prisma/client";
import { AuthUtils } from "../utils/auth.utils";

interface SkillAssessmentCompletionProps {
	skill_assessment_completion_id: number;
	skillAssessmentId: number;
	jobHunterId: number;
	completion_status?: string;
	completion_score?: number;
	completion_date?: Date;
	isRefreshed?: boolean;
}

interface Certificateprops {
	certificate_id: number;
	skillAssessmentCompletionId: number;
	certificate_unique_id: string;
	certificate_name: string;
	certificate_issuer: string;
	certificate_date: Date;
	created_at: Date;
}

export class ApplyAssessmentTestService {
	private prisma: PrismaClient;
	private authUtils: AuthUtils;
	private generateUniqueId(): string {
		const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
		const numbers = "0123456789";

		const randomLetters = Array.from({ length: 3 }, () =>
			letters.charAt(Math.floor(Math.random() * letters.length))
		).join("");

		const randomNumbers = Array.from({ length: 3 }, () =>
			numbers.charAt(Math.floor(Math.random() * numbers.length))
		).join("");

		return `${randomLetters}${randomNumbers}`;
	}

	constructor() {
		this.prisma = new PrismaClient();
		this.authUtils = new AuthUtils();
	}

	async joinAssessmentTest({
		skill_assessment_id,
		token,
	}: {
		skill_assessment_id: number;
		token: string;
	}): Promise<
		| string
		| {
				skillAssessmentCompletion: SkillAssessmentCompletionProps;
		  }
	> {
		try {
			const decodedToken = await this.authUtils.decodeToken(token);
			if (!decodedToken || !decodedToken.user_id) {
				return "Invalid token or user ID not found";
			}

			const jobHunter = await this.prisma.jobHunter.findUnique({
				where: { userId: decodedToken.user_id },
				include: {
					jobHunterSubscription: {
						include: {
							subscriptionTable: true,
						},
					},
				},
			});

			if (!jobHunter) {
				return "Job hunter not found";
			}

			const subscription = jobHunter?.jobHunterSubscription;
			if (!subscription || !subscription.subscription_active) {
				return "You must have an active subscription to join this assessment test.";
			}

			const subscriptionType = subscription.subscriptionTable.subscription_type;
			const currentAssessmentCount = jobHunter.assesment_count ?? 0; // Default to 0 if null

			if (subscriptionType === "free") {
				return "You must upgrade your subscription to join this assessment test.";
			}
			if (subscriptionType === "standard" && currentAssessmentCount >= 2) {
				return "Standard subscription allows joining up to 2 assessments only. Please Upgrade your Subscription";
			} else if (
				subscriptionType !== "professional" &&
				subscriptionType !== "standard"
			) {
				return "Invalid subscription type.";
			}

			const assessmentTest = await this.prisma.skillAssessment.findUnique({
				where: { skill_assessment_id: skill_assessment_id },
			});

			if (!assessmentTest) {
				return "No mentioned Assessment Test available";
			}

			// Check if the user has completed this skill assessment before with a "failed" status
			const lastCompletion =
				await this.prisma.skillAsessmentCompletion.findFirst({
					where: {
						skillAssessmentId: skill_assessment_id,
						jobHunterId: jobHunter.job_hunter_id,
						completion_status: "failed",
					},
					orderBy: {
						completion_date: "desc", // Get the latest completion record
					},
				});

			if (lastCompletion) {
				const currentDate = new Date();
				const lastEndDate = new Date(lastCompletion.end_date);
				const daysPassed =
					(currentDate.getTime() - lastEndDate.getTime()) / (1000 * 3600 * 24);

				if (daysPassed < 7) {
					return `You can retake this test in ${7 - Math.floor(daysPassed)} days.`;
				}
			}

			// const existingResult =
			// 	await this.prisma.skillAsessmentCompletion.findFirst({
			// 		where: {
			// 			skillAssessmentId: skill_assessment_id,
			// 			jobHunterId: jobHunter.job_hunter_id,
			// 		},
			// 	});

			// if (existingResult) {
			// 	return "You have already joined this Assessment test.";
			// }

			const durationInMinutes = assessmentTest.duration;
			const startDate = new Date();
			const startMilliseconds = startDate.getTime();
			const endDate = new Date(startMilliseconds + durationInMinutes * 60000);

			// Create new SkillAssessmentCompletion entry
			const skillAssessmentCompletion =
				await this.prisma.skillAsessmentCompletion.create({
					data: {
						skillAssessmentId: skill_assessment_id,
						jobHunterId: jobHunter.job_hunter_id,
						completion_score: 0,
						start_date: startDate,
						end_date: endDate,
						completion_date: startDate,
						completion_status: "ongoing",
						isRefreshed: false,
					},
				});

			// Increment assessment_count
			await this.prisma.jobHunter.update({
				where: { job_hunter_id: jobHunter.job_hunter_id },
				data: {
					assesment_count: {
						increment: 1,
					},
				},
			});

			return { skillAssessmentCompletion };
		} catch (error) {
			const err = error as Error;
			return err.message;
		}
	}

	async getAssessmentQuestions({
		skill_assessment_id,
		token,
	}: {
		token: string;
		skill_assessment_id: number;
	}): Promise<{ questions: any[]; duration: number; testId: number } | string> {
		try {
			const decodedToken = await this.authUtils.decodeToken(token);
			if (!decodedToken || !decodedToken.user_id) {
				return "Invalid token or user ID not found";
			}

			const jobHunter = await this.prisma.jobHunter.findUnique({
				where: { userId: decodedToken.user_id },
			});

			if (!jobHunter) {
				return "Job hunter not found";
			}
			const jobHunterId = jobHunter.job_hunter_id;
			const assessmentTest = await this.prisma.skillAssessment.findUnique({
				where: { skill_assessment_id: skill_assessment_id },
			});

			if (!assessmentTest) {
				return "No mentioned AssessementTest available";
			}

			const areonTest = await this.prisma.skillAsessmentCompletion.findFirst({
				where: {
					completion_status: "ongoing",
				},
			});

			if (!areonTest) {
				return "Current status is not ongoing; it is either completed as pass or fail";
			}

			const questions = await this.prisma.skillAsessmentQuestion.findMany({
				where: { skillAssessmentId: skill_assessment_id },
				select: {
					skill_assessment_question_id: true,
					question: true,
					answer_1: true,
					answer_2: true,
					answer_3: true,
					answer_4: true,
				},
				orderBy: {
					skill_assessment_question_id: "asc",
				},
			});

			if (!questions || questions.length === 0) {
				return "No questions found for this pre-selection test.";
			}

			// Return the questions, duration, and testId
			return {
				questions: questions.map((q) => ({
					question_id: q.skill_assessment_question_id,
					question: q.question,
					answer_1: q.answer_1,
					answer_2: q.answer_2,
					answer_3: q.answer_3,
					answer_4: q.answer_4,
				})),
				duration: assessmentTest.duration, // Include the duration from the assessment
				testId: assessmentTest.skill_assessment_id, // Include the skillAssessmentId
			};
		} catch (error) {
			const err = error as Error;
			return `Error fetching questions: ${err.message}`;
		}
	}

	async updateResult({
		token,
		skillAssessmentId,
		answers,
		jobHunterId,
	}: {
		token: string;
		skillAssessmentId: number;
		answers: {
			skill_assessment_question_id: number;
			chosen_answer: string;
		}[];
		jobHunterId: number;
	}): Promise<
		| {
				updatedResult: SkillAssessmentCompletionProps;
				score: number;
				totalQuestions: number;
				completionStatus: string;
				certificate?: {
					certificate_id: number;
					certificate_unique_id: string;
					certificate_name: string;
				};
		  }
		| string
	> {
		try {
			const decodedToken = await this.authUtils.decodeToken(token);
			if (!decodedToken || !decodedToken.user_id) {
				return "Invalid token or UserId not found";
			}
			const skillAsessmentCompletion =
				await this.prisma.skillAsessmentCompletion.findFirst({
					where: { skillAssessmentId, jobHunterId },
				});

			if (!skillAsessmentCompletion) {
				return "result of skillAssessment not found";
			}

			if (!skillAsessmentCompletion.end_date) {
				return "End date not available. Unable to proceed with the test.";
			}


			const questions = await this.prisma.skillAsessmentQuestion.findMany({
				where: { skillAssessmentId },
			});

			if (!questions || questions.length === 0) {
				return "No questions found for this test.";
			}

			const questionIds = questions.map((q) => q.skill_assessment_question_id);
			const invalidAnswers = answers.filter(
				(a) => !questionIds.includes(a.skill_assessment_question_id)
			);

			if (invalidAnswers.length > 0) {
				return "Some answers are invalid or do not belong to this test.";
			}
			let score = 0;
			questions.forEach((question) => {
				const userAnswer = answers.find(
					(a) =>
						a.skill_assessment_question_id ===
						question.skill_assessment_question_id
				);
				if (
					userAnswer &&
					userAnswer.chosen_answer === question.correct_answer
				) {
					score += 4;
				}
			});
			const assessmentTest = await this.prisma.skillAssessment.findUnique({
				where: { skill_assessment_id: skillAssessmentId },
			});

			if (!assessmentTest) {
				return "Pre-selection test not found.";
			}

			const { passing_grade: passingGrade } = assessmentTest;
			const completionStatus = score >= passingGrade ? "pass" : "failed";
			const updatedResult = await this.prisma.skillAsessmentCompletion.update({
				where: {
					skill_assessment_completion_id:
						skillAsessmentCompletion.skill_assessment_completion_id,
				},
				data: {
					completion_score: score,
					completion_status: completionStatus,
				},
			});
			let certificate;
			if (completionStatus === "pass") {
				let uniqueId;
				let isUnique = false;
				while (!isUnique) {
					uniqueId = this.generateUniqueId();
					const existingCertificate = await this.prisma.certificate.findUnique({
						where: { certificate_unique_id: uniqueId },
					});
					isUnique = !existingCertificate;
				}
				certificate = await this.prisma.certificate.create({
					data: {
						skillAssessmentCompletionId:
							skillAsessmentCompletion.skill_assessment_completion_id,
						certificate_unique_id: uniqueId as string,
						certificate_name: `Certificate of Completion for Skill Assessment ${skillAssessmentId}`,
						certificate_issuer: "PathWay .Corp",
						certificate_date: new Date(),
					},
				});
			}
			return {
				updatedResult,
				score,
				totalQuestions: questions.length,
				completionStatus,
				certificate,
			};
		} catch (error) {
			const err = error as Error;
			console.error("Error updating test result:", err.message);
			return `Error: ${err.message}`;
		}
	}

	async getSkillAssessmentTime({
		skillAssessmentId,
		token,
	}: {
		skillAssessmentId: number;
		token: string;
	}): Promise<{ startDate: Date; endDate: Date } | string> {
		try {
			// Decode the token and validate it
			const decodedToken = await this.authUtils.decodeToken(token);
			if (!decodedToken || !decodedToken.user_id) {
				return "Invalid token or user ID not found.";
			}

			// Check if the skill assessment exists
			const skillAssessment = await this.prisma.skillAssessment.findUnique({
				where: { skill_assessment_id: skillAssessmentId },
			});

			if (!skillAssessment) {
				return "Skill Assessment not found.";
			}
			const jobHunter = await this.prisma.jobHunter.findUnique({
				where: { userId: decodedToken.user_id },
			});

			if (!jobHunter) {
				return "Job hunter not found";
			}

			// Fetch the completion record for the given skill assessment and user
			const completionRecord =
				await this.prisma.skillAsessmentCompletion.findFirst({
					where: {
						skillAssessmentId,
						jobHunterId: jobHunter.job_hunter_id, // Use job_hunter_id here
					},
				});

			if (!completionRecord) {
				return "Completion record not found for the provided skillAssessmentId and user.";
			}

			const { start_date: startDate, end_date: endDate } = completionRecord;

			if (!startDate || !endDate) {
				return "Start date or end date not available for this assessment.";
			}

			return {
				startDate,
				endDate,
			};
		} catch (error) {
			const err = error as Error;
			console.error("Error fetching skill assessment time:", err.message);
			return `Error: ${err.message}`;
		}
	}

	async getSkillAssessmentById(
		token: string,
		skillAssessmentId: number
	): Promise<any> {
		try {
			const decodedToken = await this.authUtils.decodeToken(token);
			if (!decodedToken || !decodedToken.user_id) {
				return { error: "Invalid token or user ID not found" };
			}
			const userId = decodedToken.user_id;

			const skillAssessment = await this.prisma.skillAssessment.findUnique({
				where: {
					skill_assessment_id: skillAssessmentId,
				},
				select: {
					skill_assessment_id: true,
					skill_assessment_name: true,
					skill_badge: true,
					passing_grade: true,
					duration: true,
					developer: {
						select: {
							developer_id: true,
						},
					},
				},
			});

			if (!skillAssessment) {
				return { error: "Skill assessment not found" };
			}

			return {
				skill_assessment_id: skillAssessment.skill_assessment_id,
				skill_assessment_name: skillAssessment.skill_assessment_name,
				skill_badge: skillAssessment.skill_badge,
				passing_grade: skillAssessment.passing_grade,
				duration: skillAssessment.duration,
				developer_id: skillAssessment.developer.developer_id,
			};
		} catch (error) {
			const err = error as Error;
			return { error: "Error fetching skill assessment: " + err.message };
		}
	}
}
