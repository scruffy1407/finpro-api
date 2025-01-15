import {
	Prisma,
	PrismaClient,
	RoleType,
	SkillAssessment,
} from "@prisma/client";
import { AuthUtils } from "../utils/auth.utils";
import { UserService } from "./baseUser/user.service";
import fs from "fs";

export class AssessmentTestService {
	private prisma: PrismaClient;
	private authUtils: AuthUtils;
	private userService: UserService;

	constructor() {
		this.prisma = new PrismaClient();
		this.authUtils = new AuthUtils();
		this.userService = new UserService();
	}

	async createAssessmentTest({
		skill_assessment_name,
		skill_badge,
		passing_grade = 75,
		duration = 30,
		token,
	}: {
		skill_assessment_name: string;
		skill_badge: string;
		passing_grade?: number;
		duration: number;
		token: string;
	}): Promise<{ assessmentTest: SkillAssessment } | string> {
		try {
			const decodedToken = await this.authUtils.decodeToken(token);
			if (!decodedToken || !decodedToken.user_id) {
				return "Invalid token or user ID not found";
			}

			const userId = decodedToken.user_id;

			const developer = await this.prisma.developer.findFirst({
				where: { userId: userId },
				select: { developer_id: true },
			});
			if (!developer || !developer.developer_id) {
				return "User is not associated with a developer";
			}

			const developerId = developer.developer_id;

			// ** Check if an assessment test with the same name already exists **
			const existingTest = await this.prisma.skillAssessment.findFirst({
				where: {
					skill_assessment_name,
					developerId, // Optional: Check within the developer's scope
				},
			});

			if (existingTest) {
				return `An assessment test with the name "${skill_assessment_name}" already exists.`;
			}

			let uploadedBadgeUrl: string = skill_badge;

			if (fs.existsSync(skill_badge) || isBase64(skill_badge)) {
				const uploadResult = await this.userService.uploadBadge(
					RoleType.developer,
					skill_badge
				);
				if (uploadResult.success && uploadResult.data) {
					uploadedBadgeUrl = uploadResult.data;
				} else {
					return uploadResult.message || "Failed to upload badge image";
				}
			}

			const assessmentTest = await this.prisma.skillAssessment.create({
				data: {
					skill_assessment_name: skill_assessment_name,
					skill_badge: uploadedBadgeUrl,
					passing_grade: passing_grade,
					duration: duration,
					developerId: developerId,
				},
			});

			return { assessmentTest };
		} catch (error) {
			const err = error as Error;
			return `Error : ${err.message}`;
		}

		function isBase64(str: string): boolean {
			const base64Regex = /^([A-Za-z0-9+\/=]|\r\n|\n|\r)*$/;
			return base64Regex.test(str) && str.length % 4 === 0; // Checks if it looks like a valid base64 string
		}
	}

	//untuk create
	//cant delete if there is the one that already have the badge

	async deleteAssessmentTest(
		skill_assessment_id: number
	): Promise<SkillAssessment | string> {
		try {
			const assessmentTest = await this.prisma.skillAssessment.findUnique({
				where: { skill_assessment_id: skill_assessment_id },
			});

			if (!assessmentTest) {
				return "Asessment test not found";
			}

			if (assessmentTest.deleted === true) {
				return "The selected Pre-Selection test is already deleted";
			}

			const updatedAssessmentTest = await this.prisma.skillAssessment.update({
				where: { skill_assessment_id: skill_assessment_id },
				data: { deleted: true },
			});
			return updatedAssessmentTest;
		} catch (error) {
			const err = error as Error;
			return `Error : ${err.message}`;
		}
	}

	async updateAssessmentTest({
		skill_assessment_id,
		skill_assessment_name,
		skill_badge,
		passing_grade,
		duration,
		token,
	}: {
		skill_assessment_id: number;
		skill_assessment_name?: string;
		skill_badge?: string;
		passing_grade?: number;
		duration?: number;
		token: string;
	}): Promise<{ updatedAssessmentTest: SkillAssessment } | string> {
		try {
			// Decode token and validate user
			const decodedToken = await this.authUtils.decodeToken(token);
			if (!decodedToken || !decodedToken.user_id) {
				return "Invalid token or user ID not found";
			}

			const userId = decodedToken.user_id;

			// Find the developer linked to the user
			const developer = await this.prisma.developer.findFirst({
				where: { userId: userId },
				select: { developer_id: true },
			});
			if (!developer || !developer.developer_id) {
				return "User is not associated with a developer";
			}

			const developerId = developer.developer_id;

			// Find the existing assessment test
			const existingTest = await this.prisma.skillAssessment.findUnique({
				where: { skill_assessment_id: skill_assessment_id },
			});

			if (!existingTest) {
				return "Assessment test not found.";
			}

			// Check if a new name conflicts with an existing test (if name is being updated)
			if (
				skill_assessment_name &&
				skill_assessment_name !== existingTest.skill_assessment_name
			) {
				const duplicateTest = await this.prisma.skillAssessment.findFirst({
					where: {
						skill_assessment_name,
						developerId,
					},
				});

				if (duplicateTest) {
					return `An assessment test with the name "${skill_assessment_name}" already exists.`;
				}
			}

			// Handle badge upload (if a new badge is provided)
			let updatedBadgeUrl: string = existingTest.skill_badge;

			if (
				skill_badge &&
				(fs.existsSync(skill_badge) || isBase64(skill_badge))
			) {
				const uploadResult = await this.userService.uploadBadge(
					RoleType.developer,
					skill_badge
				);

				if (uploadResult.success && uploadResult.data) {
					updatedBadgeUrl = uploadResult.data;
				} else {
					return uploadResult.message || "Failed to upload badge image";
				}
			}

			// Update the assessment test in the database
			const updatedAssessmentTest = await this.prisma.skillAssessment.update({
				where: { skill_assessment_id: skill_assessment_id },
				data: {
					...(skill_assessment_name && { skill_assessment_name }),
					...(skill_badge && { skill_badge: updatedBadgeUrl }),
					...(passing_grade !== undefined && { passing_grade }),
					...(duration !== undefined && { duration }),
				},
			});

			return { updatedAssessmentTest };
		} catch (error) {
			const err = error as Error;
			return `Error: ${err.message}`;
		}

		function isBase64(str: string): boolean {
			const base64Regex = /^([A-Za-z0-9+\/=]|\r\n|\n|\r)*$/;
			return base64Regex.test(str) && str.length % 4 === 0;
		}
	}

	async getSkillAssessmentList(
		limit: number = 6,
		offset: number = 0,
		name?: string,
		sortOrder?: string
	) {
		try {
			// Construct filter conditions
			const whereConditions: any = {
				deleted: false,
			};

			if (name) {
				whereConditions.skill_assessment_name = {
					contains: name, // Partial match on name
					mode: "insensitive", // Case-insensitive search
				};
			}

			// Construct sorting criteria
			const orderBy: any[] = [];
			if (sortOrder === "asc") {
				orderBy.push({ skill_assessment_name: "asc" }); // Alphabetical sorting A-Z
			} else if (sortOrder === "desc") {
				orderBy.push({ skill_assessment_name: "desc" }); // Alphabetical sorting Z-A
			} else {
				orderBy.push({ created_at: "desc" }); // Default sorting by newest first
			}

			// Fetch skill assessments
			const skillAssessments = await this.prisma.skillAssessment.findMany({
				where: whereConditions,
				skip: offset,
				take: limit,
				orderBy: orderBy,
				select: {
					skill_assessment_id: true,
					skill_assessment_name: true,
					skill_badge: true,
					passing_grade: true,
					duration: true,
					created_at: true,
					updated_at: true,
				},
			});

			// Get the total count of skill assessments
			const totalCount = await this.prisma.skillAssessment.count({
				where: whereConditions,
			});

			// Return results with pagination info
			return {
				data: skillAssessments,
				pagination: {
					offset,
					limit,
					totalCount,
					hasMore: offset + limit < totalCount, // Determine if more data is available
				},
			};
		} catch (error) {
			const err = error as Error;
			return { error: "Error fetching skill assessments: " + err.message };
		}
	}

	async createSkillAssessmentQuestions(
		skillAssessmentId: number,
		questions: Array<any>
	): Promise<any> {
		try {
			// Step 1: Find the skill assessment by ID and check how many questions already exist
			const skillAssessment = await this.prisma.skillAssessment.findUnique({
				where: { skill_assessment_id: skillAssessmentId },
				include: { skillAssessmentQuestion: true }, // Include the existing questions
			});

			if (!skillAssessment) {
				return "Skill assessment not found.";
			}

			const existingQuestionsCount =
				skillAssessment.skillAssessmentQuestion.length;

			// Step 2: Check if there are already 25 questions
			if (existingQuestionsCount >= 25) {
				return "This skill assessment already has 25 questions. You cannot add more.";
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

			// Step 5: Create the questions
			const createdQuestions =
				await this.prisma.skillAsessmentQuestion.createMany({
					data: questions.map((question, index) => ({
						skillAssessmentId,
						number: (existingQuestionsCount + index + 1).toString(),
						question: question.question,
						answer_1: question.answer_1,
						answer_2: question.answer_2,
						answer_3: question.answer_3,
						answer_4: question.answer_4,
						correct_answer: question.correct_answer,
					})),
				});

			return {
				message: "Questions successfully added.",
				createdQuestionsCount: createdQuestions.count,
			};
		} catch (error) {
			const err = error as Error;
			return `Error creating questions: ${err.message}`;
		}
	}

	async updateSkillAssessmentQuestions({
		skillAssessmentId,
		questions,
	}: {
		skillAssessmentId: number;
		questions: {
			questionId: number;
			question: string;
			answer_1: string;
			answer_2: string;
			answer_3: string;
			answer_4: string;
			correct_answer: string;
		}[];
	}): Promise<any> {
		try {
			// Step 1: Check if the skill assessment exists
			const skillAssessment = await this.prisma.skillAssessment.findUnique({
				where: { skill_assessment_id: skillAssessmentId },
				include: { skillAssessmentQuestion: true }, // Include related questions
			});

			if (!skillAssessment) {
				return { status: "error", message: "Skill assessment not found." };
			}

			// Step 2: Initialize an array to collect update promises
			const updatePromises = [];

			// Step 3: Process each question in the provided array
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

				// Check for missing or invalid questionId
				if (!questionId) {
					updatePromises.push(Promise.reject("Invalid questionId."));
					continue;
				}

				// Find the specific question to update
				const questionToUpdate =
					await this.prisma.skillAsessmentQuestion.findUnique({
						where: { skill_assessment_question_id: questionId },
					});

				if (!questionToUpdate) {
					updatePromises.push(
						Promise.reject(`Question with ID ${questionId} not found.`)
					);
					continue;
				}

				// Validate that the correct_answer matches one of the provided options
				if (
					![answer_1, answer_2, answer_3, answer_4].includes(correct_answer)
				) {
					updatePromises.push(
						Promise.reject(
							`Correct answer must be one of the provided options for question ID ${questionId}.`
						)
					);
					continue;
				}

				// Add the update operation to the promises array
				updatePromises.push(
					this.prisma.skillAsessmentQuestion.update({
						where: { skill_assessment_question_id: questionId },
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

			// Step 4: Execute all updates and handle errors
			const updateResults = await Promise.allSettled(updatePromises);

			// Extract any errors
			const errors = updateResults
				.filter((result) => result.status === "rejected")
				.map((result) => (result as PromiseRejectedResult).reason);

			if (errors.length > 0) {
				return {
					status: "error",
					message: `Error(s) occurred while updating questions: ${errors.join(", ")}`,
				};
			}

			// Step 5: Return success response
			return {
				status: "success",
				message: "All questions updated successfully.",
			};
		} catch (error) {
			const err = error as Error;
			return {
				status: "error",
				message: `Error updating questions: ${err.message}`,
			};
		}
	}

	async getAssessmentDash() {
		try {
			// Fetch all skill assessments and count related questions
			const assessments = await this.prisma.skillAssessment.findMany({
				where: {
					deleted: false, // Fetch only non-deleted assessments
				},
				include: {
					_count: {
						select: { skillAssessmentQuestion: true }, // Count related questions
					},
				},
			});

			// Return the fetched data
			return { data: assessments };
		} catch (error) {
			const err = error as Error;
			return { error: "Error fetching assessments: " + err.message };
		}
	}

	async getQuestAssessById(skillAssessmentId: number): Promise<any> {
		try {
			// Fetch the assessment test details along with associated questions
			const assessmentTest = await this.prisma.skillAssessment.findUnique({
				where: { skill_assessment_id: skillAssessmentId },
				include: {
					skillAssessmentQuestion: {
						select: {
							skill_assessment_question_id: true,
							number: true,
							question: true,
							answer_1: true,
							answer_2: true,
							answer_3: true,
							answer_4: true,
							correct_answer: true,
							created_at: true,
							updated_at: true,
						},
						orderBy: {
							skill_assessment_question_id: "asc", // Order questions by skill_assessment_question_id in ascending order
						},
					},
				},
			});

			if (!assessmentTest) {
				return { error: "Skill assessment not found." };
			}

			// Return the details of the assessment test and its questions
			return {
				assessmentTest: {
					skill_assessment_id: assessmentTest.skill_assessment_id,
					skill_assessment_name: assessmentTest.skill_assessment_name,
					skill_badge: assessmentTest.skill_badge,
					passing_grade: assessmentTest.passing_grade,
					duration: assessmentTest.duration,
					deleted: assessmentTest.deleted,
					created_at: assessmentTest.created_at,
					updated_at: assessmentTest.updated_at,
					questions: assessmentTest.skillAssessmentQuestion,
				},
			};
		} catch (error) {
			const err = error as Error;
			return { error: `Error fetching skill assessment: ${err.message}` };
		}
	}

	async getSkillAssessmentCompletionByJobHunterId(
		jobHunterId: number
	): Promise<any> {
		try {
			// Fetch skill assessment completion records for the given job hunter
			const completions = await this.prisma.skillAsessmentCompletion.findMany({
				where: { jobHunterId },
				include: {
					skillAssessment: true, // Include related skill assessment details
				},
			});

			if (!completions || completions.length === 0) {
				return {
					status: "error",
					message:
						"No skill assessment completion records found for this job hunter.",
				};
			}

			// Format the response to include relevant details
			const formattedCompletions = completions.map((completion) => ({
				completionId: completion.skill_assessment_completion_id,
				skillAssessmentId: completion.skillAssessmentId,
				skillAssessmentName: completion.skillAssessment.skill_assessment_name,
				completionStatus: completion.completion_status,
				completionScore: completion.completion_score,
				completionDate: completion.completion_date,
				startDate: completion.start_date,
				endDate: completion.end_date,
				isRefreshed: completion.isRefreshed,
			}));

			return {
				status: "success",
				data: formattedCompletions,
			};
		} catch (error) {
			const err = error as Error;
			return {
				status: "error",
				message: `Error fetching skill assessment completion records: ${err.message}`,
			};
		}
	}

	
}
