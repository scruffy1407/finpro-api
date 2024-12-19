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
			const { jobPostId, testName, image, passingGrade, duration } = req.body;

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
				jobPostId,
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
}
