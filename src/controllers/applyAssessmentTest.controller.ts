import { Request, Response } from "express";
import { ApplyAssessmentTestService } from "../services/applyAssessmentTest.service";

export class ApplyAssessmentTestController {
	private applyAssessmentTestService: ApplyAssessmentTestService;

	constructor() {
		this.applyAssessmentTestService = new ApplyAssessmentTestService();
	}
	async joinAssessmentTest(req: Request, res: Response): Promise<void> {
		const { skill_assessment_idUnq } = req.params; // Retrieve skill_assessment_id from params
		const token = req.headers.authorization?.split(" ")[1] || ""; // Assuming Bearer token format

		// Validate input
		if (!skill_assessment_idUnq || !token) {
			res.status(400).json({
				message: "Missing skill_assessment_id or authorization token",
			});
			return;
		}

		try {
			const result = await this.applyAssessmentTestService.joinAssessmentTest({
				skill_assessment_idUnq: parseInt(skill_assessment_idUnq), // Convert param to number
				token,
			});

			if (typeof result === "string") {
				// If the service returns a string, it indicates an error message
				res.status(400).json({ message: result });
				return; // Exit early
			}

			// If result is an object, send success response
			res.status(201).json({
				message: "Successfully joined the assessment test",
				data: result.skillAssessmentCompletion,
			});
		} catch (error) {
			const err = error as Error;
			// Log error for debugging
			console.error("Error joining assessment test:", err.message);

			// Send internal server error response
			res.status(500).json({
				message:
					"An unexpected error occurred while joining the assessment test",
			});
		}
	}

	async getAssessmentQuestions(req: Request, res: Response): Promise<void> {
		const { skill_assessment_idUnq } = req.params; // Extract from params
		const token = req.headers.authorization?.split(" ")[1]; // Assuming Bearer token format

		if (!skill_assessment_idUnq || !token) {
			res.status(400).json({
				message: "Missing skill_assessment_iUnq or authorization token",
			});
			return;
		}

		const skillAssessmentIdNumber = Number(skill_assessment_idUnq); // Convert string to number

		if (isNaN(skillAssessmentIdNumber)) {
			res.status(400).json({
				message: "Invalid skill_assessment_idUnq, must be a number",
			});
			return;
		}

		try {
			const result =
				await this.applyAssessmentTestService.getAssessmentQuestions({
					skill_assessment_idUnq: skillAssessmentIdNumber,
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
				questions: result.questions, // Directly include questions array at top level
				duration: result.duration, // Include the duration
				testId: result.testId, // Include the testId
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

	public getSkillAssessmentTime = async (
		req: Request,
		res: Response
	): Promise<void> => {
		const { skillAssessmentIdUnq } = req.params;

		// Parse skillAssessmentId to an integer
		const skillAssessmentIdParsed = parseInt(skillAssessmentIdUnq);

		if (isNaN(skillAssessmentIdParsed)) {
			res.status(400).json({ error: "Invalid skillAssessmentId provided." });
			return;
		}

		// Extract token from the Authorization header
		const token = req.headers.authorization?.split(" ")[1];

		if (!token) {
			// If no token, respond with a 400 error and exit
			res.status(400).json({ error: "Token is required" });
			return;
		}

		try {
			// Call the service method to get skill assessment time
			const result =
				await this.applyAssessmentTestService.getSkillAssessmentTime({
					skillAssessmentIdUnq: parseInt(skillAssessmentIdUnq),
					token,
				});

			// If result is a string, it means it's an error message
			if (typeof result === "string") {
				res.status(400).json({ error: result });
			} else {
				// If result is an object, return the start and end date
				res.status(200).json({
					startDate: result.startDate,
					endDate: result.endDate,
				});
			}
		} catch (error) {
			console.error("Error fetching skill assessment time:", error);
			res.status(500).json({ error: "Internal Server Error" });
		}
	};

	public async getSkillAssessmentById(
		req: Request,
		res: Response
	): Promise<void> {
		try {
			const { skillAssessmentIdUnq } = req.params;

			if (!skillAssessmentIdUnq) {
				res.status(400).json({ error: "Skill Assessment ID is required" });
				return;
			}

			const authorizationHeader = req.headers.authorization ?? "";
			if (!authorizationHeader.startsWith("Bearer ")) {
				res.status(401).json({
					error:
						'Authorization token is required and must be in the format "Bearer <token>"',
				});
				return;
			}

			const token = authorizationHeader.split(" ")[1];
			const result =
				await this.applyAssessmentTestService.getSkillAssessmentById(
					token,
					Number(skillAssessmentIdUnq)
				);

			if (typeof result === "string" || result?.error) {
				res.status(400).json({ error: result.error || result });
				return;
			}

			res.status(200).json({
				message: "Skill assessment fetched successfully",
				data: result,
			});
		} catch (error) {
			const err = error as Error;
			res.status(500).json({ error: `Error: ${err.message}` });
		}
	}
}
