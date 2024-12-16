import { Request, Response, NextFunction } from "express";
import { PrismaClient } from "@prisma/client";
import { AuthUtils } from "../utils/auth.utils"; // Import AuthUtils

const prisma = new PrismaClient();
const authUtils = new AuthUtils(); // Instantiate AuthUtils

export const authorizeJobPostOwner = async (
	req: Request,
	res: Response,
	next: NextFunction
): Promise<void> => {
	try {
		// Get the token from the Authorization header
		const token = req.headers.authorization?.split(" ")[1];

		if (!token) {
			res.status(401).json({ error: "Not authenticated" });
			return; // Ensure we return here, after sending the response
		}

		// Decode the token using the AuthUtils
		const decodedToken = await authUtils.decodeToken(token);

		// If decoding failed or the token is invalid, return an error
		if (!decodedToken || !decodedToken.user_id) {
			res.status(401).json({ error: "Invalid token" });
			return; // Ensure we return here after sending the response
		}

		const userId = decodedToken.user_id; // Assuming the decoded token has user_id

		// Fetch the company associated with this user
		const userCompany = await prisma.company.findUnique({
			where: {
				userId: userId,
			},
		});

		if (!userCompany) {
			res.status(403).json({ error: "User does not belong to any company" });
			return; // Ensure we return here after sending the response
		}

		const companyId = userCompany.company_id;

		// Fetch the job post using jobId from URL parameters
		const jobId = parseInt(req.params.jobId);
		if (isNaN(jobId)) {
			res.status(400).json({ error: "Invalid jobId" });
			return; // Ensure we return here after sending the response
		}

		const jobPost = await prisma.jobPost.findUnique({
			where: {
				job_id: jobId,
			},
		});

		if (!jobPost) {
			res.status(404).json({ error: "Job post not found" });
			return; // Ensure we return here after sending the response
		}

		// Check if the job post belongs to the user's company
		if (jobPost.companyId !== companyId) {
			res
				.status(403)
				.json({ error: "You are not authorized to edit this job post" });
			return; // Ensure we return here after sending the response
		}

		// If everything is fine, proceed to the next middleware/controller
		next(); // This is the correct flow when no response is sent.
	} catch (error) {
		console.error("Error in authorizeJobPostOwner middleware:", error);
		res.status(500).json({ error: "Internal server error" });
		return; // Ensure we return here after sending the response
	}
};
