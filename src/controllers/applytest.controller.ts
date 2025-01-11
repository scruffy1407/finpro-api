import { Request, Response } from "express";
import { ApplyTestService } from "../services/applytest.service";
import { PreSelectionTestService } from "../services/preSelectionTest.service";

export class JobHunterTestController {
	private applyTestService: ApplyTestService;
	private preSelectionTestService: PreSelectionTestService;

	constructor() {
		this.applyTestService = new ApplyTestService();
		this.preSelectionTestService = new PreSelectionTestService();
	}

	// Method to handle the joining of the pre-selection test
	public joinPreSelectionTest = async (
		req: Request,
		res: Response
	): Promise<void> => {
		const { jobId } = req.params;

		// Extract token from the Authorization header
		const token = req.headers.authorization?.split(" ")[1];

		if (!token) {
			// If no token, respond with a 400 error and exit
			res.status(400).json({ error: "Token is required" });
			return; // Ensure we stop further execution
		}

		try {
			// Call the service to join the pre-selection test
			const result = await this.applyTestService.joinPreSelectionTest({
				jobId: parseInt(jobId),
				token,
			});

			// If result is a string, it means it's an error message
			if (typeof result === "string") {
				res.status(400).json({ error: result });
			} else {
				// If result is an object, return the result and application
				res.status(200).json({
					resultPreSelection: result.resultPreSelection,
					application: result.application,
				});
			}
		} catch (error) {
			res.status(500).json({ error: "Internal Server Error" });
		}
	};

	async getPreSelectionQuestions(req: Request, res: Response): Promise<void> {
		try {
			const { jobId } = req.params;

			// Extract token from the Authorization header
			const token = req.headers.authorization?.split(" ")[1];
			// Validate token and jobId

			if (!token || !jobId) {
				res.status(400).json({ message: "Token and Job ID are required." });
				return;
			}

			const result = await this.applyTestService.getPreSelectionQuestions({
				token,
				jobId: parseInt(jobId), // Parse the jobId to number
			});

			if (typeof result === "string") {
				// Return an error message if result is a string
				res.status(400).json({ message: result });
			} else {
				// Return the fetched questions
				res.status(200).json({
					questions: result.questions,
					duration: result.duration,
					testId: result.testId,
				});
			}
		} catch (error) {
			console.error("Error in PreSelectionTestController:", error);
			res.status(500).json({ message: "Internal server error" });
		}
	}

	// Handle the pre-selection test
	async handlePreSelectionTest(req: Request, res: Response): Promise<void> {
		const { testId, jobHunterId, answers, applicationId } = req.body;

		// Extract token from the Authorization header
		const token = req.headers.authorization?.split(" ")[1];

		if (!token) {
			// If no token, respond with a 400 error and exit
			res.status(400).json({ error: "Token is required" });
			return; // Ensure we stop further execution
		}

		// Validate the incoming data
		if (
			!testId ||
			!jobHunterId ||
			!Array.isArray(answers) ||
			answers.length === 0
		) {
			res.status(400).json({
				message:
					"Invalid input data. Please provide valid testId, jobHunterId, and answers.",
			});
			return;
		}

		try {
			// Call the service method to handle the pre-selection test logic
			const result = await this.applyTestService.handlePreSelectionTest({
				testId,
				answers,
				token,
				applicationId,
			});

			// Return the result to the client
			if (typeof result === "string") {
				// If the result is a string, it indicates an error message
				res.status(400).json({ message: result });
			} else {
				// If the result is an object, return the score and total number of questions
				res.status(200).json(result);
			}
		} catch (error) {
			const err = error as Error;
			res.status(500).json({ message: `Error: ${err.message}` });
		}
	}

	// Method to handle the result update
	public updateResult = async (req: Request, res: Response): Promise<void> => {
		const { applicationId, testId, answers } = req.body;

		// Extract token from the Authorization header
		const token = req.headers.authorization?.split(" ")[1];

		if (!token) {
			// If no token, respond with a 400 error and exit
			res.status(400).json({ error: "Token is required" });
			return;
		}

		// Validate the incoming data
		if (
			!applicationId ||
			!testId ||
			!Array.isArray(answers) ||
			answers.length === 0
		) {
			res.status(400).json({
				message:
					"Invalid input data. Please provide valid applicationId, testId, and answers.",
			});
			return;
		}

		try {
			// Call the service method to update the result
			const result = await this.applyTestService.updateResult({
				applicationId,
				token,
				testId,
				answers,
			});

			// Return the result to the client
			if (typeof result === "string") {
				// If the result is a string, it indicates an error message
				res.status(400).json({ message: result });
			} else {
				// If the result is an object, return the score and other details
				res.status(200).json({
					updatedResult: result.updatedResult,
					score: result.score,
					totalQuestions: result.totalQuestions,
					completionStatus: result.completionStatus,
					newApplicationStatus: result.newApplicationStatus,
				});
			}
		} catch (error) {
			const err = error as Error;
			res.status(500).json({ message: `Error: ${err.message}` });
		}
	};

	// Method to get test start and end date based on applicationId
	public getTestTime = async (req: Request, res: Response): Promise<void> => {
		const { applicationId } = req.params;

		// Extract token from the Authorization header
		const token = req.headers.authorization?.split(" ")[1];

		if (!token) {
			// If no token, respond with a 400 error and exit
			res.status(400).json({ error: "Token is required" });
			return;
		}

		try {
			// Call the service method to get test time
			const result = await this.applyTestService.getTestTime({
				applicationId: parseInt(applicationId),
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
			console.error("Error fetching test time:", error);
			res.status(500).json({ error: "Internal Server Error" });
		}
	};
	// Method to update only the completion score
	public updateCompletionScore = async (
		req: Request,
		res: Response
	): Promise<void> => {
		const { applicationId, testId, answers } = req.body;

		// Extract token from the Authorization header
		const token = req.headers.authorization?.split(" ")[1];

		if (!token) {
			// If no token, respond with a 400 error and exit
			res.status(400).json({ error: "Token is required" });
			return;
		}

		// Validate the incoming data
		if (
			!applicationId ||
			!testId ||
			!Array.isArray(answers) ||
			answers.length === 0
		) {
			res.status(400).json({
				message:
					"Invalid input data. Please provide valid applicationId, testId, and answers.",
			});
			return;
		}

		try {
			// Call the service method to update only the completion score
			const result = await this.applyTestService.updateCompletionScore({
				applicationId,
				token,
				testId,
				answers,
			});

			// Return the result to the client
			if (typeof result === "string") {
				// If the result is a string, it indicates an error message
				res.status(400).json({ message: result });
			} else {
				// If the result is an object, return the updated score details
				res.status(200).json({
					updatedResult: result.updatedResult,
					score: result.score,
					totalQuestions: result.totalQuestions,
				});
			}
		} catch (error) {
			const err = error as Error;
			res.status(500).json({ message: `Error: ${err.message}` });
		}
	};
}

// async handlePageLeave(req: Request, res: Response): Promise<void> {
// 	try {
// 		const { applicationId, testId, answers } = req.body;

// 		// Validate applicationId
// 		if (!applicationId || typeof applicationId !== "number") {
// 			res.status(400).json({ error: "Invalid or missing applicationId." });
// 			return;
// 		}

// 		// Validate testId if it's provided (Optional but good practice)
// 		if (testId && typeof testId !== "number") {
// 			res.status(400).json({ error: "Invalid testId." });
// 			return;
// 		}

// 		// Handle page leave with service call
// 		const result = await this.applyTestService.handlePageLeave({
// 			applicationId,
// 			testId,
// 			answers, // Pass answers only if provided
// 		});

// 		// Handle success or error responses
// 		if (result.startsWith("Error")) {
// 			res.status(500).json({ error: result });
// 		} else {
// 			res.status(200).json({ message: result });
// 		}
// 	} catch (error) {
// 		console.error("Controller Error:", error);
// 		res.status(500).json({ error: "Internal Server Error." });
// 	}
// }
