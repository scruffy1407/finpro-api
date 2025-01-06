	import { Request, Response } from "express";
	import { JobCompanyDashService } from "../services/jobCompanyDash.service";
	import { AuthUtils } from "../utils/auth.utils";

	export class JobDashListController {
		private jobCompanyDashService: JobCompanyDashService;
		private authUtils: AuthUtils;

		constructor() {
			this.jobCompanyDashService = new JobCompanyDashService();
			this.authUtils = new AuthUtils();
		}

		// Controller method to handle the getJobDashList request
		public async getJobDashList(req: Request, res: Response) {
			try {
				// Step 1: Extract and verify the token
				const token = req.headers.authorization?.split(" ")[1];
				if (!token) {
					res.status(400).json({ error: "Token is required" });
					return;
				}

				// Step 2: Decode the token to get the payload
				const decodedToken = await this.authUtils.decodeToken(token);
				if (!decodedToken) {
					res.status(401).json({ error: "Invalid or expired token" });
					return;
				}

				// Step 3: Extract the companyId from the decoded token
				const companyId = decodedToken.company_id;
				if (!companyId) {
					res.status(400).json({ error: "Company ID is required in the token" });
					return;
				}

				// Step 4: Extract query parameters from the request
				const limit = Number(req.query.limit) || 10; // Default limit to 10
				const page = Number(req.query.page) || 1; // Page number, default to 1
				const offset = (page - 1) * limit; // Calculate the offset based on the page number
				const status = req.query.status ? Boolean(req.query.status) : undefined;
				const salaryShow = req.query.salaryShow
					? Boolean(req.query.salaryShow)
					: undefined;
				const sortOrder = (req.query.sortOrder as string) || "desc"; // Default to newest to oldest
				const job_title = req.query.job_title as string | undefined; // Extract job_title parameter


				// Step 5: Call the service method with the necessary parameters
				const jobDashList = await this.jobCompanyDashService.getJobDashList(
					limit,
					offset, // Pass offset to service method
					Number(companyId),
					status,
					salaryShow,
					sortOrder,
					job_title // Pass job_title for search
				);

				// Step 6: Send the response back with the job posts data
				res.json(jobDashList);
			} catch (error) {
				console.error(error);
				res.status(500).json({ error: "Internal server error" });
			}
		}
	}
