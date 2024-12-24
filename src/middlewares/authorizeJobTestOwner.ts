import { Request, Response, NextFunction } from "express";
import { PrismaClient } from "@prisma/client";
import { AuthUtils } from "../utils/auth.utils"; // Import AuthUtils

const prisma = new PrismaClient();
const authUtils = new AuthUtils(); // Instantiate AuthUtils

// Middleware to authorize the company to delete the pre-selection test
export const authorizeJobTestOwner = async (
	req: Request,
	res: Response,
	next: NextFunction
): Promise<void> => {
	try {
		// Get the token from the Authorization header
		const token = req.headers.authorization?.split(" ")[1];

		if (!token) {
			res.status(401).json({ error: "Not authenticated" });
			return; // Ensure we return here after sending the response
		}

		// Decode the token using the AuthUtils
		const decodedToken = await authUtils.decodeToken(token);

		// If decoding failed or the token is invalid, return an error
		if (!decodedToken || !decodedToken.user_id) {
			res.status(401).json({ error: "Invalid token" });
			return; // Ensure we return here after sending the response
		}

		const userId = decodedToken.user_id; // Assuming the decoded token has user_id

		// Step 3: Find the user's associated company
		const userCompany = await prisma.company.findFirst({
			where: { userId: userId },
			include: { jobPost: true }, // Include job posts related to the user
		});

		if (!userCompany) {
			res
				.status(403)
				.json({ message: "User is not associated with any company" });
			return; // Return here to stop further processing
		}

		// Step 4: Extract testId from request params
		const { testId } = req.params;

		// Step 5: Find the pre-selection test and check its association with the company's job posts
		const preSelectionTest = await prisma.preSelectionTest.findFirst({
			where: { test_id: Number(testId) },
			include: { jobPost: true },
		});

		if (!preSelectionTest || preSelectionTest.jobPost.length === 0) {
			res.status(404).json({
				message: "Pre-selection test not found or no job posts associated",
			});
			return; // Return here to stop further processing
		}

		// Debug log: Check the pre-selection test and job posts
		console.log("Pre-selection test:", preSelectionTest);
		console.log("User's company:", userCompany);

		// Step 6: Check if the job post belongs to the user's company
		const isAuthorized = preSelectionTest.jobPost.some((jobPost) => {
			console.log(
				"Comparing jobPost.companyId:",
				jobPost.companyId,
				"with userCompany.company_id:",
				userCompany.company_id
			);
			return jobPost.companyId === userCompany.company_id;
		});

		// Debug log: Check the result of authorization check
		console.log("Is authorized:", isAuthorized);

		if (!isAuthorized) {
			res.status(403).json({
				message: "You are not authorized to delete this pre-selection test",
			});
			return; // Return here to stop further processing
		}

		// Step 7: If authorized, continue to the next middleware or route handler
		next();
	} catch (error) {
		console.error(
			"Error in authorizeCompanyForPreSelectionTest middleware:",
			error
		);
		res.status(500).json({ message: "Internal server error" });
	}
};
