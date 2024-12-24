import { Request, Response, NextFunction } from "express";
import { PrismaClient } from "@prisma/client";
import { AuthUtils } from "../utils/auth.utils"; // Import AuthUtils

const prisma = new PrismaClient();
const authUtils = new AuthUtils(); // Instantiate AuthUtils

// Middleware to check if the company owns the Pre-selection Test and can edit the questions
export const authorizeQuestionOwner = async (
	req: Request,
	res: Response,
	next: NextFunction
) => {
	try {
		const { preSelectionTestId } = req.body; // assuming body has testQuestionId
		const authorizationHeader = req.headers.authorization ?? "";

		// Ensure the token is present and formatted correctly
		if (!authorizationHeader.startsWith("Bearer ")) {
			res.status(401).json({
				error:
					'Authorization token is required and must be in the format "Bearer <token>"',
			});
			return;
		}

		const token = authorizationHeader.split(" ")[1]; // Safely extract the token after "Bearer "

		// Step 1: Decode the token to get user details
		const decodedToken = await authUtils.decodeToken(token);
		if (!decodedToken || !decodedToken.user_id) {
			res.status(401).json({ message: "Invalid token or user ID not found" });
			return;
		}

		const userId = decodedToken.user_id;

		// Step 2: Verify that the user is associated with a company
		const company = await prisma.company.findFirst({
			where: { userId },
			select: { company_id: true },
		});

		if (!company) {
			res
				.status(401)
				.json({ message: "User is not associated with a company" });
			return;
		}

		// Step 3: Find the TestQuestion to ensure it exists
		const testQuestion = await prisma.testQuestion.findUnique({
			where: { question_id: preSelectionTestId},
			include: {
				preSelectionTest: {
					include: {
						jobPost: true, // Include the JobPost details to access companyId
					},
				},
			},
		});

		if (!testQuestion) {
			res.status(404).json({ message: "TestQuestion not found" });
			return;
		}

		// Step 4: Ensure that the PreSelectionTest's JobPost is owned by the company
		const preSelectionTest = testQuestion.preSelectionTest; // Already included in the query
		const jobPost = preSelectionTest.jobPost[0]; // Access the first JobPost in the array

		if (!jobPost) {
			res.status(404).json({ message: "JobPost not found" });
			return;
		}

		// Check if the JobPost's companyId matches the current user's companyId
		if (jobPost.companyId !== company.company_id) {
			res.status(403).json({
				message:
					"You are not authorized to edit this TestQuestion as your company doesn't own the PreSelectionTest",
			});
			return;
		}

		// If all checks pass, move on to the next handler
		next();
	} catch (error) {
		const err = error as Error;
		res
			.status(500)
			.json({ message: "Internal server error", error: err.message });
	}
};
