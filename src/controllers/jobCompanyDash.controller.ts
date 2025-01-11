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

  public async getJobDashList(req: Request, res: Response) {
    try {
      const token = req.headers.authorization?.split(" ")[1];
      if (!token) {
        res.status(400).json({ error: "Token is required" });
        return;
      }
      const decodedToken = await this.authUtils.decodeToken(token);
      if (!decodedToken) {
        res.status(401).json({ error: "Invalid or expired token" });
        return;
      }
      const limit = Number(req.query.limit) || 10;
      const page = Number(req.query.page) || 1;
      const offset = (page - 1) * limit;
      const status = req.query.status ? Boolean(req.query.status) : undefined;
      const salaryShow = req.query.salaryShow
        ? Boolean(req.query.salaryShow)
        : undefined;
      const sortOrder = (req.query.sortOrder as string) || "desc";
      const job_title = req.query.job_title as string | undefined;
      const jobDashList = await this.jobCompanyDashService.getJobDashList(
        limit,
        offset,
        Number(decodedToken.user_id),
        status,
        salaryShow,
        sortOrder,
        job_title
      );
      res.json(jobDashList);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
}
