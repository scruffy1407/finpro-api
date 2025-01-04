import { Request, Response } from "express";
import { CompanyAdmin } from "../services/companyadmin.service";
import { ApplicationStatus } from "@prisma/client";
import { AuthUtils } from "../utils/auth.utils";

export class CompanyAdminController {
  private companyAdminService: CompanyAdmin;
  private authUtils: AuthUtils;

  constructor() {
    this.companyAdminService = new CompanyAdmin();
    this.authUtils = new AuthUtils();
    this.getCompanyApplicants = this.getCompanyApplicants.bind(this);
    this.getJobApplicants = this.getJobApplicants.bind(this);
    this.getApplicationDetails = this.getApplicationDetails.bind(this);
    this.updateApplicationStatus = this.updateApplicationStatus.bind(this);
    this.deleteJob = this.deleteJob.bind(this);
    this.toggleJobStatus = this.toggleJobStatus.bind(this);
    this.getJobPostInformation = this.getJobPostInformation.bind(this);
    this.getJobStatus = this.getJobStatus.bind(this);
  }

  async getCompanyApplicants(req: Request, res: Response) {
    const token = req.headers.authorization?.split(" ")[1] as string;
    const decodedToken = await this.authUtils.decodeToken(token as string);

    if (!decodedToken?.user_id) {
      res.status(400).json({ success: false, message: "User ID is missing." });
    } else {
      try {
        const applicants = await this.companyAdminService.getCompanyApplicants(
          decodedToken?.user_id as number
        );
        res.status(200).json({ success: true, data: applicants });
      } catch (error) {
        console.error("Error fetching applicants:", error);
        res
          .status(500)
          .json({ success: false, message: "Failed to fetch applicants." });
      }
    }
  }

  async getJobPostInformation(req: Request, res: Response) {
    const { jobId } = req.params;
    const token = req.headers.authorization?.split(" ")[1] as string;

    if (!token) {
      res.status(400).json({ success: false, message: "Token is missing." });
      return;
    }

    try {
      const decodedToken = await this.authUtils.decodeToken(token);
      if (!decodedToken?.user_id) {
        res.status(400).json({
          success: false,
          message: "User ID is missing or invalid in token.",
        });
        return;
      }

      const jobPostInfo = await this.companyAdminService.getJobPostInformation(
        Number(jobId),
        Number(decodedToken?.user_id)
      );

      if (!jobPostInfo) {
        res.status(401).json({
          success: false,
          message:
            "Unauthorized to access this job post or job post not found.",
        });
        return;
      }

      res.status(200).json({ success: true, data: jobPostInfo });
    } catch (error: any) {
      console.error("Error fetching job post information:", error);

      if (error.message.includes("Unauthorized")) {
        res.status(401).json({
          success: false,
          message: "Unauthorized to access this job post.",
        });
      } else {
        res.status(500).json({
          success: false,
          message: "Failed to fetch job post information.",
        });
      }
    }
  }

  async getJobApplicants(req: Request, res: Response) {
    const { jobId } = req.params;
    const token = req.headers.authorization?.split(" ")[1] as string;
    const decodedToken = await this.authUtils.decodeToken(token as string);

    if (!decodedToken?.user_id) {
      res.status(400).json({ success: false, message: "User ID is missing." });
    } else {
      try {
        const applicants = await this.companyAdminService.getJobApplicants(
          Number(jobId),
          Number(decodedToken?.user_id)
        );
        if (applicants.success) {
          res.status(200).json({ status: res.statusCode, data: applicants });
        } else {
          res
            .status(401)
            .json({ success: res.statusCode, message: applicants.message });
        }
      } catch (error) {
        console.error("Error fetching applicants:", error);
        res
          .status(500)
          .json({ success: false, message: "Failed to fetch applicants." });
      }
    }
  }

  async getApplicationDetails(req: Request, res: Response) {
    const { id } = req.params;
    const token = req.headers.authorization?.split(" ")[1] as string;
    const decodedToken = await this.authUtils.decodeToken(token as string);

    if (!decodedToken?.user_id) {
      res.status(400).json({ success: false, message: "User ID is missing." });
    } else {
      try {
        const details = await this.companyAdminService.getApplicationDetails(
          Number(id),
          decodedToken?.user_id as number
        );
        if (!details) {
          res.status(404).json({
            success: false,
            message: "Application details not found.",
          });
        } else {
          res.status(200).json({ success: true, data: details });
        }
      } catch (error) {
        console.error("Error fetching application details:", error);
        res.status(500).json({
          success: false,
          message: "Failed to fetch application details.",
        });
      }
    }
  }

  async updateApplicationStatus(req: Request, res: Response) {
    const { application_id, application_status } = req.body;
    const token = req.headers.authorization?.split(" ")[1] as string;
    const decodedToken = await this.authUtils.decodeToken(token as string);
    if (
      !application_id ||
      !Object.values(ApplicationStatus).includes(application_status)
    ) {
      res
        .status(400)
        .json({ success: false, message: "Invalid application status." });
    } else {
      try {
        const result = await this.companyAdminService.updateApplicationStatus(
          Number(application_id),
          application_status as ApplicationStatus,
          decodedToken?.user_id as number
        );

        if (!result || result.count === 0) {
          res.status(401).json({
            success: false,
            message: "Application status can no longer be updated.",
          });
        } else {
          res.status(200).json({
            success: true,
            message: "Application status updated successfully.",
          });
        }
      } catch (error: any) {
        console.error("Error updating application status:", error);

        if (error.message.includes("no longer be updated")) {
          res.status(403).json({
            success: false,
            message: error.message,
          });
        } else if (error.message.includes("not found or unauthorized")) {
          res.status(404).json({
            success: false,
            message: error.message,
          });
        } else {
          res.status(500).json({
            success: false,
            message: "Failed to update application status.",
          });
        }
      }
    }
  }

  async getJobStatus(req: Request, res: Response): Promise<void> {
    const { jobId } = req.params;
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      res.status(400).json({ success: false, message: "Token is missing." });
      return;
    }
    try {
      const decodedToken = await this.authUtils.decodeToken(token as string);
      if (!decodedToken?.user_id) {
        res
          .status(400)
          .json({ success: false, message: "User ID is missing." });
        return;
      }
      if (isNaN(Number(jobId))) {
        res.status(400).json({ success: false, message: "Invalid jobId" });
        return;
      }
      const status = await this.companyAdminService.getJobStatus(
        Number(jobId),
        decodedToken?.user_id as number
      );
      if (!status) {
        res.status(200).json({
          status: false,
          message: "Job post is inactive or unavailable.",
        });
      } else {
        res.status(200).json({ status: true });
      }
    } catch (error) {
      console.error("Error fetching job status:", error);
      res
        .status(500)
        .json({ success: false, message: "Internal server error" });
    }
  }

  async deleteJob(req: Request, res: Response): Promise<void> {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      res.status(400).json({ success: false, message: "Token is missing." });
      return;
    }
    try {
      const decodedToken = await this.authUtils.decodeToken(token as string);
      const jobId = parseInt(req.params.jobId);
      if (isNaN(jobId)) {
        res.status(400).json({ success: false, message: "Invalid jobId" });
        return;
      }
      const result = await this.companyAdminService.deleteJob(
        jobId,
        decodedToken?.user_id as number
      );
      if (result === "Job post deleted successfully.") {
        res.status(200).json({ success: true, message: result });
      } else {
        res.status(400).json({ success: false, message: result });
      }
    } catch (error) {
      console.error("Error deleting job post:", error);
      res
        .status(500)
        .json({ success: false, message: "Internal server error" });
    }
  }

  async toggleJobStatus(req: Request, res: Response): Promise<void> {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      res.status(400).json({ error: "Token is missing." });
      return;
    }
    try {
      const decodedToken = await this.authUtils.decodeToken(token as string);
      const jobId = parseInt(req.params.jobId);
      const { status } = req.body;

      if (isNaN(jobId)) {
        res.status(400).json({ success: false, message: "Invalid jobId" });
        return;
      }
      if (typeof status !== "boolean") {
        res
          .status(400)
          .json({ success: false, message: "Status must be a boolean" });
        return;
      }
      const result = await this.companyAdminService.toggleJobStatus(
        jobId,
        status,
        decodedToken?.user_id as number
      );

      if (result.includes("updated")) {
        res.status(200).json({ success: true, message: result });
      } else {
        res.status(400).json({ success: false, message: result });
      }
    } catch (error) {
      console.error("Error toggling job status:", error);
      res
        .status(500)
        .json({ success: false, message: "Internal server error" });
    }
  }
}
