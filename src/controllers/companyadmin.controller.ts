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
    this.getApplicants = this.getApplicants.bind(this);
    this.getApplicationDetails = this.getApplicationDetails.bind(this);
    this.updateApplicationStatus = this.updateApplicationStatus.bind(this);
  }

  async getApplicants(req: Request, res: Response) {
    const token = req.headers.authorization?.split(" ")[1] as string;
    const decodedToken = await this.authUtils.decodeToken(token as string);

    if (!decodedToken?.user_id) {
      res.status(400).json({ success: false, message: "User ID is missing." });
    }

    try {
      const applicants = await this.companyAdminService.getApplicants(
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

  async getApplicationDetails(req: Request, res: Response) {
    const { id } = req.params;

    const token = req.headers.authorization?.split(" ")[1] as string;
    const decodedToken = await this.authUtils.decodeToken(token as string);
    try {
      const details = await this.companyAdminService.getApplicationDetails(
        Number(id),
        decodedToken?.user_id as number
      );
      if (!details) {
        res
          .status(404)
          .json({ success: false, message: "Application not found." });
      }
      res.status(200).json({ success: true, data: details });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Failed to fetch application details.",
      });
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
          res.status(404).json({
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
          console.error("Error updating application status:", error);
          res.status(500).json({
            success: false,
            message: "Failed to update application status.",
          });
        }
      }
    }
  }
}
