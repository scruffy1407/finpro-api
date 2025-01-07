import { Request, Response } from "express";
import { PreSelectionTestService } from "../services/preSelectionTest.service";

export class PreSelectionTestController {
	private preSelectionTestService: PreSelectionTestService;

	constructor() {
		this.preSelectionTestService = new PreSelectionTestService();
	}

	// Method to handle the creation of the Pre-selection Test
	public async createPreSelectionTest(
		req: Request,
		res: Response
	): Promise<void> {
		try {
			// Extract the data from the request body
			const { testName, image, passingGrade, duration } = req.body;

			// Extract the token from the Authorization header
			const authorizationHeader = req.headers.authorization ?? ""; // If it's undefined, set it to an empty string

			// Ensure the token is present and formatted correctly (e.g., "Bearer <token>")
			if (!authorizationHeader.startsWith("Bearer ")) {
				res.status(401).json({
					error:
						'Authorization token is required and must be in the format "Bearer <token>"',
				});
			}

			const token = authorizationHeader.split(" ")[1]; // Safely extract the token after "Bearer "

			// Call the service method to create the pre-selection test, passing the token
			const result = await this.preSelectionTestService.createPreSelectionTest({
				testName,
				image,
				passingGrade,
				duration,
				token, // Pass the token here
			});

			// Check if the result is a string (error) or an object (success)
			if (typeof result === "string") {
				res.status(400).json({ error: result });
			}

			//  success response with the result
			res.status(201).json({
				message: "Pre-selection test created successfully!",
				data: result,
			});
		} catch (error) {
			// console.error(error);
			res.status(500).json({ error: "Internal server error" });
		}
	}

	// Method to delete a Pre-selection Test
	async deletePreSelectionTest(req: Request, res: Response): Promise<void> {
		const { testId } = req.params; // Assuming testId is passed as a parameter

		if (!testId) {
			res.status(400).json({ message: "Test ID is required" });
		}

		try {
			// Call the service method to delete the pre-selection test
			const result = await this.preSelectionTestService.deletePreSelectionTest(
				Number(testId)
			);

			if (typeof result === "string") {
				// If result is a string, it's an error message
				res.status(400).json({ message: result });
			}

			// If result is not a string, return the success response
			res.status(200).json({
				message: "Pre-selection test deleted successfully",
				updatedPreSelectionTest: result,
			});
		} catch (error) {
			const err = error as Error;
			res.status(500).json({ message: `Error: ${err.message}` });
		}
	}

	async updatePreSelectionTest(req: Request, res: Response): Promise<void> {
		try {
			//define where i will get the parameter's form :
			const { testName, image, passingGrade, duration } = req.body;
			const { testId } = req.params;

			// Convert testId to a number
			const testIdNumber = parseInt(testId, 10); // Convert to a number (base 10)

			// Ensure the testId is a valid number
			if (isNaN(testIdNumber)) {
				res.status(400).json({ error: "Invalid testId format" });
				return; // Exit if the testId is not a valid number
			}

			//Why there is no token ? because it will going to be send by different variable scope

			//define if we're going to use a token or needed a token for doing things.

			const authorizationHeader = req.headers.authorization ?? "";

			// Ensure the token is present and formatted correctly
			if (!authorizationHeader.startsWith("Bearer ")) {
				res.status(401).json({
					error:
						'Authorization token is required and must be in the format "Bearer <token>"',
				});
			}

			const token = authorizationHeader.split(" ")[1];

			//after get everything, call the service :

			const result = await this.preSelectionTestService.updatePreSelectionTest({
				testId: testIdNumber,
				testName,
				image,
				passingGrade,
				duration,
				token,
			});

			// check if the result is a string of error

			if (typeof result === "string") {
				res.status(400).json({ error: result });
				return;
			}

			//check if success

			res.status(201).json({
				message: "Pre-selection test updated successfully",
				data: result,
			});
		} catch (error) {
			const err = error as Error;
			res.status(500).json({ message: `Error : ${err.message} ` });
		}
	}

	async createTest(req: Request, res: Response): Promise<void> {
		try {
			const { testId } = req.params; // Get testId from URL parameter
			const { questions } = req.body; // Get the questions from the request body

			// Ensure the questions array is provided
			if (!questions || !Array.isArray(questions)) {
				res
					.status(400)
					.json({ error: "Questions must be an array of 25 items." });
				return;
			}

			// Validate the length of the questions array
			if (questions.length !== 25) {
				res
					.status(400)
					.json({ error: "You must provide exactly 25 questions." });
				return;
			}

			// Call the service to create the questions
			const createdQuestions = await this.preSelectionTestService.createTest(
				Number(testId),
				questions
			);

			// If the result is a string, it's an error message
			if (typeof createdQuestions === "string") {
				// Respond with 400 Bad Request and the error message
				res.status(400).json({ error: createdQuestions });
				return;
			}

			// Send success response with created questions
			res.status(201).json({
				message: "Test questions created successfully",
				data: createdQuestions,
			});
		} catch (error) {
			const err = error as Error;
			res.status(500).json({ message: `Error: ${err.message}` });
		}
	}

	async updateTest(req: Request, res: Response): Promise<void> {
		console.log("Controller method reached."); // Debugging line

		try {
			const { testId } = req.params;
			const { questions } = req.body;

			// Ensure questions array is provided and has the correct structure
			if (!questions || !Array.isArray(questions)) {
				res.status(400).json({ error: "Questions must be an array." });
				return;
			}

			// Validate the length of the questions array (up to 25 questions)
			if (questions.length !== 25) {
				res
					.status(400)
					.json({ error: "You must provide exactly 25 questions." });
				return;
			}

			// Validate each questionId is present
			for (const question of questions) {
				if (!question.questionId) {
					res
						.status(400)
						.json({ error: "Each question must have a valid 'questionId'." });
					return;
				}
			}

			// Extract the token from the Authorization header
			const authorizationHeader = req.headers.authorization ?? "";
			if (!authorizationHeader.startsWith("Bearer ")) {
				res.status(401).json({
					error:
						'Authorization token is required and must be in the format "Bearer <token>"',
				});
				return;
			}

			const token = authorizationHeader.split(" ")[1];

			// Call the service to update the questions in the pre-selection test
			const result = await this.preSelectionTestService.updateTestQuestions({
				preSelectionTestId: Number(testId),
				questions,
				token,
			});

			// Check the result status from the service
			if (result.status === "error") {
				res.status(400).json({ error: result.message });
				return;
			}

			// Send success response
			res.status(200).json({
				message: result.message,
				data: result, // Add result data if needed
			});
		} catch (error) {
			const err = error as Error;
			res.status(500).json({ message: `Error: ${err.message}` });
		}
	}

	public async getPreSelectionTestsByCompanyController(
		req: Request,
		res: Response
	): Promise<void> {
		try {
			// Extract the token from the Authorization header
			const authorizationHeader = req.headers.authorization ?? ""; // Fallback to an empty string
			if (!authorizationHeader.startsWith("Bearer ")) {
				res.status(401).json({
					error:
						'Authorization token is required and must be in the format "Bearer <token>"',
				});
				return;
			}

			const token = authorizationHeader.split(" ")[1]; // Extract the token

			// Call the service method to get pre-selection tests by company
			const result =
				await this.preSelectionTestService.getPreSelectionTestsByCompany(token);

			// Check if the result is an error message
			if (typeof result === "string" || result?.error) {
				res.status(400).json({ error: result.error || result });
				return;
			}

			// Return the fetched tests
			res.status(200).json({
				message: "Pre-selection tests fetched successfully",
				data: result,
			});
		} catch (error) {
			const err = error as Error;
			res.status(500).json({ error: `Error: ${err.message}` });
		}
	}

	// Method to handle fetching Pre-selection Test by ID
	public async getPreSelectionTestById(
		req: Request,
		res: Response
	): Promise<void> {
		try {
			const { testId } = req.params; // Extract testId from the URL parameters

			if (!testId) {
				res.status(400).json({ error: "Test ID is required" });
				return;
			}

			// Extract the token from the Authorization header
			const authorizationHeader = req.headers.authorization ?? ""; // If undefined, set to an empty string

			// Ensure the token is present and formatted correctly
			if (!authorizationHeader.startsWith("Bearer ")) {
				res.status(401).json({
					error:
						'Authorization token is required and must be in the format "Bearer <token>"',
				});
				return;
			}

			const token = authorizationHeader.split(" ")[1]; // Safely extract the token after "Bearer "

			// Call the service method to fetch the pre-selection test by testId
			const result = await this.preSelectionTestService.getPreSelectionTestById(
				token,
				Number(testId) // Pass the token and testId as a number
			);

			// Check if the result is a string (error) or an object (success)
			if (typeof result === "string" || result?.error) {
				res.status(400).json({ error: result.error || result });
				return;
			}

			// Return the fetched pre-selection test (testId and testName)
			res.status(200).json({
				message: "Pre-selection test fetched successfully",
				data: result,
			});
		} catch (error) {
			const err = error as Error;
			res.status(500).json({ error: `Error: ${err.message}` });
		}
	}

	// Method to fetch Pre-selection Test by ID, ensuring company access
	public async getTestByPreTestId(req: Request, res: Response): Promise<void> {
		try {
			const { testId } = req.params; // Get testId from URL parameter

			if (!testId) {
				res.status(400).json({ error: "Test ID is required." });
				return;
			}

			// Extract the token from the Authorization header
			const authorizationHeader = req.headers.authorization ?? ""; // If it's undefined, set it to an empty string

			if (!authorizationHeader.startsWith("Bearer ")) {
				res.status(401).json({
					error:
						'Authorization token is required and must be in the format "Bearer <token>"',
				});
				return;
			}

			const token = authorizationHeader.split(" ")[1]; // Safely extract the token after "Bearer "

			// Call the service to fetch the test by testId, passing the token to retrieve companyId
			const result = await this.preSelectionTestService.getTestByPreTestId(
				Number(testId), // Convert testId to a number
				token // Pass the token to the service
			);

			// If the result is an error, return the error response
			if (typeof result === "string" || result?.error) {
				res.status(400).json({ error: result.error || result });
				return;
			}

			// Return the fetched pre-selection test with questions
			res.status(200).json({
				message: "Pre-selection test fetched successfully",
				data: result,
			});
		} catch (error) {
			const err = error as Error;
			res.status(500).json({ error: `Error: ${err.message}` });
		}
	}

	// Method to handle the soft delete of a Pre-selection Test
	public async softDeletePreSelectionTest(
		req: Request,
		res: Response
	): Promise<void> {
		const { testId } = req.params; // Assuming testId is passed as a parameter

		if (!testId) {
			res.status(400).json({ message: "Test ID is required" });
			return;
		}

		try {
			// Call the service method to soft delete the pre-selection test
			const result =
				await this.preSelectionTestService.softDeletePreSelectionTest(
					Number(testId)
				);

			if (typeof result === "string") {
				// If result is a string, it's an error message
				res.status(400).json({ message: result });
				return;
			}

			// If result is not a string, return the success response
			res.status(200).json({
				message: "Pre-selection test soft deleted successfully",
				updatedPreSelectionTest: result,
			});
		} catch (error) {
			const err = error as Error;
			res.status(500).json({ message: `Error: ${err.message}` });
		}
	}
}
