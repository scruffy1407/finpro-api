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

	// Method to update a test question
	async updateTest(req: Request, res: Response): Promise<void> {
		const {
			preSelectionTestId,
			questionId,
			question,
			answer_1,
			answer_2,
			answer_3,
			answer_4,
			correct_answer,
		} = req.body;

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

		if (
			!preSelectionTestId ||
			!questionId ||
			!question ||
			!answer_1 ||
			!answer_2 ||
			!answer_3 ||
			!answer_4 ||
			!correct_answer
		) {
			res.status(400).json({ message: "All fields are required." });
		}

		try {
			// Call the service method to update the question
			const result = await this.preSelectionTestService.updateTestQuestions({
				preSelectionTestId,
				questionId,
				question,
				answer_1,
				answer_2,
				answer_3,
				answer_4,
				correct_answer,
				token, // Pass the token for validation if necessary
			});

			if (typeof result === "string") {
				res.status(400).json({ message: result }); // Return the error message if the service returned a string
			}

			// If the update is successful, return the updated question
			res.status(200).json(result);
		} catch (error) {
			const err = error as Error;
			res
				.status(500)
				.json({ message: "Internal Server Error", error: err.message });
		}
	}

	// Method to fetch Pre-Selection Tests by Company
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

	
}
