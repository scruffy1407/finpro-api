import {
	Prisma,
	PrismaClient,
	RoleType,
	SkillAssessment,
} from "@prisma/client";
import { AuthUtils } from "../utils/auth.utils";
import { UserService } from "./baseUser/user.service";
import fs from "fs";
import e from "express";

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
			//Decode the token for verification
			const decodedToken = await this.authUtils.decodeToken(token);
			if (!decodedToken || !decodedToken.user_id) {
				return "invalid token or user ID not found";
			}

			const jobHunter = await this.prisma.jobHunter.findUnique({
				where: { userId: decodedToken.user_id },
				include: {
					jobHunterSubscription: {
						include: {
							subscriptionTable: true, // Include the related subscriptionTable
						},
					},
				},
			});

			if (!jobHunter) {
				return "Job hunter not found";
			}

			// Check if the user has an active subscription
			const subscription = jobHunter?.jobHunterSubscription;
			if (!subscription || !subscription.subscription_active) {
				return "You must have an active subscription to join this assessment test.";
			}

			const subscriptionType = subscription.subscriptionTable.subscription_type;

			// Check limits based on subscription type
			if (subscriptionType === "standard") {
				const existingCompletions =
					await this.prisma.skillAsessmentCompletion.count({
						where: { jobHunterId: jobHunter.job_hunter_id },
					});

				if (existingCompletions >= 2) {
					return "Standard subscription allows joining up to 2 assessments only.";
				}
			} else if (
				subscriptionType !== "professional" &&
				subscriptionType !== "free"
			) {
				return "Invalid subscription type.";
			}

			const jobHunterId = jobHunter.job_hunter_id;

			//ensure the assessmentTest is exist
			const assessmentTest = await this.prisma.skillAssessment.findUnique({
				where: { skill_assessment_id: skill_assessment_id },
			});

			if (!assessmentTest) {
				return "No mentioned AssessementTest available";
			}

			const existingResult =
				await this.prisma.skillAsessmentCompletion.findFirst({
					where: {
						skillAssessmentId: skill_assessment_id,
						jobHunterId: jobHunterId,
					},
				});

			if (existingResult) {
				return "You have already joined this Assessment test.";
			}

			const durationInMinutes = assessmentTest.duration;
			console.log("Duration in minutes:", durationInMinutes); // Check the duration value

			const startDate = new Date();
			console.log("Start Date (Local Time):", startDate);

			const startMilliseconds = startDate.getTime();
			console.log("Start Date (Milliseconds):", startMilliseconds); // Log start in milliseconds

			const endDate = new Date(startMilliseconds + durationInMinutes * 60000);
			console.log("End Date (Local Time):", endDate);
			console.log("End Date (Milliseconds):", endDate.getTime()); // Log end in milliseconds

			const skillAssessmentCompletion =
				await this.prisma.skillAsessmentCompletion.create({
					data: {
						skillAssessmentId: skill_assessment_id,
						jobHunterId,
						completion_score: 0,
						start_date: startDate,
						end_date: endDate,
						completion_date: startDate,
						completion_status: "ongoing",
						isRefreshed: false,
					},
				});
			return {
				skillAssessmentCompletion,
			};
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
	}): Promise<{ questions: any[] } | string> {
		try {
			const decodedToken = await this.authUtils.decodeToken(token);
			if (!decodedToken || !decodedToken.user_id) {
				return "Invalid tokeb or user ID not found";
			}

			const jobHunter = await this.prisma.jobHunter.findUnique({
				where: { userId: decodedToken.user_id },
			});

			if (!jobHunter) {
				return "Job hunter not found";
			}

			const jobHunterId = jobHunter.job_hunter_id;

			//ensure the assessmentTest is exist
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
				return "current status is not on-Going it is either completed as pass or fail";
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
					skill_assessment_question_id: "asc", // Sorting by ID in ascending order
				},
			});

			if (!questions || questions.length === 0) {
				return "No questions found for this pre-selection test.";
			}

			return { questions };
		} catch (error) {
			const err = error as Error;
			return `Error fetchinq questions: ${err.message}`;
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

			//fetch the Result
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

			const currentTime = new Date(); // Current date and time
			if (currentTime > skillAsessmentCompletion.end_date) {
				console.log("Test time has expired.");
				console.log(currentTime);
				console.log("LAH KOK BEGINI DAAH");
				console.log(skillAsessmentCompletion.end_date);
				return "Test time has expired. You can no longer submit your answers.";
			}

			//fetch the questions for the pre-Selection test
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

			// Calculate the score based on the answers

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

			// Fetch the pre-selection test details, including passing grade
			const assessmentTest = await this.prisma.skillAssessment.findUnique({
				where: { skill_assessment_id: skillAssessmentId },
			});

			if (!assessmentTest) {
				return "Pre-selection test not found.";
			}

			const { passing_grade: passingGrade } = assessmentTest;
			const completionStatus = score >= passingGrade ? "pass" : "failed";

			//update the ResultPreSelection with the calculated score and status
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

			// If passed, create a certificate
			let certificate;
			if (completionStatus === "pass") {
				let uniqueId;
				let isUnique = false;

				// Generate unique certificate ID
				while (!isUnique) {
					uniqueId = this.generateUniqueId();
					const existingCertificate = await this.prisma.certificate.findUnique({
						where: { certificate_unique_id: uniqueId },
					});
					isUnique = !existingCertificate; // Ensure the ID is unique
				}

				// Create the certificate
				certificate = await this.prisma.certificate.create({
					data: {
						skillAssessmentCompletionId:
							skillAsessmentCompletion.skill_assessment_completion_id,
						certificate_unique_id: uniqueId as string,
						certificate_name: `Certificate of Completion for Skill Assessment ${skillAssessmentId}`,
						certificate_issuer: "PathWay .Corp", // Replace with your issuer name
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

	// async handleAssessmentTest({
	// 	skillAssessmentId,
	// 	answers,
	// 	token,
	// }: {
	// 	skillAssessmentId: number;
	// 	answers: { skill_assessment_question_id: number; chosen_answer: string }[];
	// 	token: string;
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
	// 		const decodedToken = await this.authUtils.decodeToken(token);
	// 		if (!decodedToken || !decodedToken.user_id) {
	// 			return "Invalid token or UserId not found";
	// 		}

	// 		//step 1 : fetch questions for the given testId
	// 		const questions = await this.prisma.skillAsessmentQuestion.findMany({
	// 			where: { skillAssessmentId },
	// 		});

	// 		if (!questions || questions.length === 0) {
	// 			return "No Questions found for this test.";
	// 		}

	// 		//step2 : validate all answers are for questions in this test
	// 		const questionIds = questions.map((q) => q.skill_assessment_question_id);
	// 		const invalidAnswers = answers.filter(
	// 			(a) => !questionIds.includes(a.skill_assessment_question_id)
	// 		);
	// 		if (invalidAnswers.length > 0) {
	// 			return "Some answers are invalid or do not belong to this test.";
	// 		}

	// 		//step 3 : calculate score
	// 		let score = 0;
	// 		questions.forEach((question) => {
	// 			const userAnswer = answers.find(
	// 				(a) =>
	// 					a.skill_assessment_question_id ===
	// 					question.skill_assessment_question_id
	// 			);
	// 			if (
	// 				userAnswer &&
	// 				userAnswer.chosen_answer === question.correct_answer
	// 			) {
	// 				score += 4;
	// 			}
	// 		});

	//         //fetch the passing grade for the pre-selection test
	//         const assessmentTest = await this.prisma.skillAssessment.findUnique({
	//             where : {skill_assessment_id : skillAssessmentId},
	//         });

	//         if(!assessmentTest) {
	//             return "Assessment test not found"
	//         }

	//         const {passing_grade : passingGrade} = assessmentTest

	//         const completion_status = score
	// 	} catch (error) {}
	// }
}
