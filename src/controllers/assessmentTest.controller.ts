import { Request, Response } from "express";
import { AssessmentTestService } from "../services/assessmentTest.service";

export class AssessmentTestController {
	private assessmentTestService: AssessmentTestService;

	constructor() {
		this.assessmentTestService = new AssessmentTestService();
	}

	public async createAssessmentTest(
		req: Request,
		res: Response
	): Promise<void> {
		try {
			const { skill_assessment_name, passing_grade, duration } = req.body;
			const passingGradeInt = parseInt(passing_grade as string, 10);
			const durationInt = parseInt(duration as string, 10);
			const skill_badge = req.file ? req.file.path : "default-badge-url";

			if (!skill_badge) {
				res.status(400).json({ error: "Skill badge image is required." });
				return;
			}

			const authorizationHeader = req.headers.authorization ?? "";
			if (!authorizationHeader.startsWith("Bearer ")) {
				res.status(401).json({
					error:
						"Authorization token is required and must be in the format of 'Bearer <token>'",
				});
				return;
			}

			const token = authorizationHeader.split(" ")[1];

			const result = await this.assessmentTestService.createAssessmentTest({
				skill_assessment_name,
				skill_badge,
				passing_grade: passingGradeInt,
				duration: durationInt,
				token,
			});

			if (typeof result === "string") {
				res.status(400).json({ error: result });
				return;
			}

			res.status(201).json({
				message: "Assessment test created successfully!",
				data: result.assessmentTest,
			});
		} catch (error) {
			console.error("Error:", error);
			res.status(500).json({ error: "Internal server error" });
		}
	}

	public async deleteAssessmentTest(
		req: Request,
		res: Response
	): Promise<void> {
		const { skill_assessment_id } = req.params;

		if (!skill_assessment_id) {
			res.status(400).json({ message: "Test ID is required" });
		}

		try {
			const result = await this.assessmentTestService.deleteAssessmentTest(
				Number(skill_assessment_id)
			);

			if (typeof result === "string") {
				res.status(400).json({ message: result });
			}

			res.status(200).json({
				message: "Assessment test deleted succesfully ",
			});
		} catch (error) {
			const err = error as Error;
			res.status(500).json({ message: `Error: ${err.message}` });
		}
	}

	async updateSkillAssessment(req: Request, res: Response): Promise<void> {
		try {
			const {
				skill_assessment_id,
				skill_assessment_name,
				passing_grade,
				duration,
			} = req.body;

			const skill_badge = req.file ? req.file.path : "default-badge-url"; // Fallback URL

			if (!skill_badge) {
				res.status(400).json({ error: "Skill badge image is required." });
			}
			const skill_assessment_idInt = parseInt(
				skill_assessment_id as string,
				10
			);

			const passingGradeInt = parseInt(passing_grade as string, 10);
			const durationInt = parseInt(duration as string, 10);

			const token = req.headers.authorization?.split(" ")[1]; // Extract the token from the Authorization header
			if (!token) {
				res.status(401).json({ error: "Authorization token is required" });
				return;
			}
			if (!skill_assessment_idInt) {
				res.status(400).json({ error: "Skill assessment ID is required" });
				return;
			}
			const result = await this.assessmentTestService.updateAssessmentTest({
				skill_assessment_id: skill_assessment_idInt,
				skill_assessment_name,
				skill_badge,
				passing_grade: passingGradeInt,
				duration: durationInt,
				token,
			});
			if (typeof result === "string") {
				res.status(400).json({ error: result });
			} else {
				res.status(200).json({
					message: "Assessment test updated successfully",
					data: result.updatedAssessmentTest,
				});
			}
		} catch (error) {
			const err = error as Error;
			res
				.status(500)
				.json({ error: "An unexpected error occurred", details: err.message });
		}
	}

	async getSkillAssessmentList(req: Request, res: Response): Promise<void> {
		try {
			const limit = parseInt(req.query.limit as string) || 6;
			const offset = parseInt(req.query.offset as string) || 0;
			const name = req.query.name as string | undefined;
			const sortOrder = req.query.sortOrder as string | undefined;

			const result = await this.assessmentTestService.getSkillAssessmentList(
				limit,
				offset,
				name,
				sortOrder
			);

			if (result.error) {
				res.status(500).json({ error: result.error });
			}
			res.status(200).json(result);
		} catch (error) {
			const err = error as Error;
			res.status(500).json({
				error: "An unexpected error occurred: " + err.message,
			});
		}
	}

 async getSkillAssessmentListHomePage(
		req: Request,
		res: Response
	): Promise<void> {
		try {
			const limit = parseInt(req.query.limit as string) || 6;
			const offset = parseInt(req.query.offset as string) || 0;
			const name = req.query.name as string | undefined;
			const sortOrder = req.query.sortOrder as string | undefined;

			const result =
				await this.assessmentTestService.getSkillAssessmentListHomePage(
					limit,
					offset,
					name,
					sortOrder
				);

			if (result.error) {
				res.status(500).json({ error: result.error });
				return
			}
			res.status(200).json(result);
		} catch (error) {
			const err = error as Error;
			res.status(500).json({
				error: "An unexpected error occurred: " + err.message,
			});
		}
	}	


async createQuestions(req: Request, res: Response): Promise<void> {
		const { skillAssessmentId } = req.params;
		const { questions } = req.body;

		const skillAssessmentIdInt = parseInt(skillAssessmentId as string, 10);

		if (!skillAssessmentId || !Array.isArray(questions)) {
			res.status(400).json({ message: "Invalid input data." });
			return;
		}

		try {
			const result =
				await this.assessmentTestService.createSkillAssessmentQuestions(
					skillAssessmentIdInt,
					questions
				);
			if (typeof result === "string") {
				res.status(400).json({ message: result });
			} else {
				res.status(201).json({
					message: "Questions successfully added.",
					createdQuestionsCount: result.createdQuestionsCount,
				});
			}
		} catch (error) {
			const err = error as Error;
			res
				.status(500)
				.json({ message: `Internal Server Error: ${err.message}` });
		}
	}

	async updateSkillAssessmentQuestions(
		req: Request,
		res: Response
	): Promise<void> {
		try {
			const { skillAssessmentId, questions } = req.body;

			if (!skillAssessmentId || !Array.isArray(questions)) {
				res.status(400).json({
					status: "error",
					message:
						"Invalid request data. Please provide skillAssessmentId and questions array.",
				});
				return;
			}
			const result =
				await this.assessmentTestService.updateSkillAssessmentQuestions({
					skillAssessmentId,
					questions,
				});
			if (result.status === "error") {
				res.status(400).json(result);
			} else {
				res.status(200).json(result);
			}
		} catch (error) {
			const err = error as Error;
			res.status(500).json({
				status: "error",
				message: `Internal Server Error: ${err.message}`,
			});
		}
	}
	public async getAssessmentDash(req: Request, res: Response): Promise<void> {
		try {
			const result = await this.assessmentTestService.getAssessmentDash();
			if (result.error) {
				res.status(500).json({ error: result.error });
				return;
			}
			res.status(200).json(result);
		} catch (error) {
			const err = error as Error;
			res.status(500).json({
				error: "Error fetching assessment dashboard: " + err.message,
			});
		}
	}

	public async getQuestAssessById(req: Request, res: Response): Promise<void> {
		try {
			const { skill_assessment_id } = req.params;

			if (!skill_assessment_id) {
				res.status(400).json({ error: "Skill assessment ID is required." });
				return;
			}

			const skillAssessmentIdInt = parseInt(skill_assessment_id, 10);

			if (isNaN(skillAssessmentIdInt)) {
				res.status(400).json({ error: "Invalid skill assessment ID format." });
				return;
			}
			const result =
				await this.assessmentTestService.getQuestAssessById(
					skillAssessmentIdInt
				);

			if (typeof result === "string") {
				res.status(404).json({ error: result });
			} else {
				res.status(200).json(result);
			}
		} catch (error) {
			const err = error as Error;
			res.status(500).json({
				error: "An error occurred while fetching the skill assessment.",
				details: err.message,
			});
		}
	}

	public async getCompletionByJobHunterId(
		req: Request,
		res: Response
	): Promise<void> {
		try {
			const { jobHunterId } = req.params;

			if (!jobHunterId) {
				res.status(400).json({ error: "Job hunter ID is required." });
				return;
			}

			const jobHunterIdInt = parseInt(jobHunterId as string, 10);

			if (isNaN(jobHunterIdInt)) {
				res.status(400).json({ error: "Invalid job hunter ID." });
				return;
			}

			const result =
				await this.assessmentTestService.getSkillAssessmentCompletionByJobHunterId(
					jobHunterIdInt
				);

			if (result.error) {
				res.status(404).json({ error: result.error });
				return;
			}

			res.status(200).json({
				message: "Skill assessment completion data retrieved successfully.",
				data: result.data,
			});
		} catch (error) {
			const err = error as Error;
			res.status(500).json({
				error: "An unexpected error occurred.",
				details: err.message,
			});
		}
	}
}
