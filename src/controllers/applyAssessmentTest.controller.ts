import { Request, Response } from "express";
import { ApplyAssessmentTestService } from "../services/applyAssessmentTest.service";

export class ApplyAssessmentTestController {
	private applyAssessmentTestService: ApplyAssessmentTestService;

	constructor() {
		this.applyAssessmentTestService = new ApplyAssessmentTestService();
	}
	async joinAssessmentTest(req: Request, res: Response): Promise<void> {
		const { skill_assessment_id } = req.body;
		const token = req.headers.authorization?.split(" ")[1] || ""; // Assuming Bearer token format

		if (!skill_assessment_id || !token) {
			res.status(400).json({
				message: "Missing skill_assessment_id or authorization token",
			});
		}
		try {
			const result = await this.applyAssessmentTestService.joinAssessmentTest({
				skill_assessment_id,
				token,
			});

			if (typeof result === "string") {
				// Handle error cases returned as string messages
				res.status(400).json({ message: result });
				return; // Exit early if result is a string
			}

			// Since we confirmed `result` is not a string, it must be the expected object
			res.status(201).json({
				message: "Successfully joined the assessment test",
				data: result.skillAssessmentCompletion,
			});
		} catch (error) {
			const err = error as Error;
			// Log error (can be extended to use a logging library)
			console.error("Error joining assessment test:", err.message);

			res.status(500).json({
				message:
					"An unexpected error occurred while joining the assessment test",
			});
		}
	}

	async getAssessmentQuestions(req: Request, res: Response): Promise<void> {
		const { skill_assessment_id } = req.body;
		const token = req.headers.authorization?.split(" ")[1]; // Assuming Bearer token format

		if (!skill_assessment_id || !token) {
			res.status(400).json({
				message: "Missing skill_assessment_id or authorization token",
			});
			return;
		}

		try {
			const result =
				await this.applyAssessmentTestService.getAssessmentQuestions({
					skill_assessment_id,
					token,
				});

			if (typeof result === "string") {
				// Handle error cases returned as string messages
				res.status(400).json({ message: result });
				return; // Exit early if result is a string
			}

			// Successful retrieval of questions
			res.status(200).json({
				message: "Successfully fetched assessment questions",
				data: result.questions,
			});
		} catch (error) {
			const err = error as Error;
			// Log error (can be extended to use a logging library)
			console.error("Error fetching assessment questions:", err.message);

			res.status(500).json({
				message:
					"An unexpected error occurred while fetching the assessment questions",
			});
		}
	}

	async updateResult(req: Request, res: Response): Promise<void> {
		try {
			const { skillAssessmentId, jobHunterId, answers } = req.body; // Extract required data from the request body
			const token = req.headers.authorization?.split(" ")[1]; // Extract token from Authorization header

			// Validate input
			if (!skillAssessmentId || !answers || !Array.isArray(answers) || !token) {
				res.status(400).json({
					message:
						"Skill assessment ID, token, and answers array are required.",
				});
				return;
			}

			// Call the service method
			const result = await this.applyAssessmentTestService.updateResult({
				token,
				skillAssessmentId,
				answers,
				jobHunterId,
			});

			// Handle service output
			if (typeof result === "string") {
				res.status(400).json({ message: result });
				return;
			}

			// Successful response
			res.status(200).json({
				message: "Skill assessment result updated successfully.",
				data: {
					updatedResult: result.updatedResult,
					score: result.score,
					totalQuestions: result.totalQuestions,
					completionStatus: result.completionStatus,
					certificate: result.certificate || null, // Include certificate if present
				},
			});
		} catch (error) {
			const err = error as Error;
			res.status(500).json({
				message: "An unexpected error occurred.",
				error: err.message,
			});
		}
	}
}
