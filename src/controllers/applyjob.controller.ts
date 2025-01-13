import { Request, Response } from "express";
import { ApplyJob } from "../services/applyjob.service";
import { Decimal } from "@prisma/client/runtime/library";
import { ApplicationStatus } from "../models/models";
import { AuthUtils } from "../utils/auth.utils";

class ApplyJobController {
  private applyJobService: ApplyJob;
  private authUtils: AuthUtils;

  constructor() {
    this.applyJobService = new ApplyJob();
    this.authUtils = new AuthUtils();
    this.applyJob = this.applyJob.bind(this);
    this.getAllApplications = this.getAllApplications.bind(this);
    this.createBookmark = this.createBookmark.bind(this);
    this.removeBookmarks = this.removeBookmarks.bind(this);
    this.getAllBookmarks = this.getAllBookmarks.bind(this);
  }

  async applyJob(req: Request, res: Response): Promise<void> {
    const { jobHunterId, jobId, expected_salary } = req.body;
    const file = req.file;
    const accessToken = req.headers.authorization?.split(" ")[1];
    if (!accessToken) {
      res
        .status(401)
        .send({ success: false, error: "Access token is required" });
      return;
    }

    if (!file) {
      res
        .status(400)
        .send({ success: false, error: "Resume file is required" });
      return;
    }

    const response = await this.applyJobService.applyJob(
      {
        jobHunterId: Number(jobHunterId),
        jobId: Number(jobId),
        resume: "",
        expected_salary: new Decimal(expected_salary),
        application_status: ApplicationStatus.ON_REVIEW,
      },
      file,
      accessToken,
    );

    if (response.success) {
      res
        .status(response.statusCode)
        .send({ success: true, data: response.data });
    } else {
      res
        .status(response.statusCode)
        .send({ success: false, message: response.message });
    }
  }

  async getAllApplications(req: Request, res: Response) {
    const { jobHunterId } = req.params;

    try {
      const applications = await this.applyJobService.getAllApplications(
        Number(jobHunterId),
      );
      res.status(200).send({ success: true, applications });
    } catch (error) {
      console.error(error);
      res
        .status(500)
        .send({ success: false, error: "Failed to fetch your applied jobs" });
    }
  }

  async getUserApplication(req: Request, res: Response) {
    const token = req.headers.authorization?.split(" ")[1] as string;
    const decodedToken = await this.authUtils.decodeToken(token);
    const { offset = 0, limit = 6, status } = req.query;
    if (!decodedToken) {
      res.status(400).send({
        status: 400,
        message: "Invalid Token",
      });
    } else {
      try {
        const response = await this.applyJobService.getUserApplications(
          Number(limit),
          Number(offset),
          decodedToken.user_id,
          status as string,
        );

        if (response.success) {
          res.status(200).send({
            status: res.statusCode,
            message: response.message,
            data: response.applicationUser,
          });
        } else {
          res.status(400).send({
            status: res.statusCode,
            message: response.message,
          });
        }
      } catch (e) {
        res.status(500).send({
          status: res.statusCode,
          message: e,
        });
      }
    }
  }

  async createBookmark(req: Request, res: Response) {
    const { jobPostId } = req.body;
    const token = req.headers.authorization?.split(" ")[1] as string;

    try {
      const decodedToken = await this.authUtils.decodeToken(token);
      if (!decodedToken) {
        res
          .status(401)
          .send({ success: false, message: "Unauthorized. No token found." });
        return;
      }

      const result = await this.applyJobService.createBookmark(
        Number(decodedToken.user_id),
        Number(jobPostId),
      );

      if (!result.success) {
        res.status(400).send({ success: false, message: result.message });
        return; // Prevent sending a duplicate response
      }

      res.status(201).send({ success: true, bookmark: result.bookmark });
    } catch (error) {
      console.error("Error creating bookmark:", error);
      res
        .status(500)
        .send({ success: false, message: "Failed to create bookmark" });
    }
  }

  async removeBookmarks(req: Request, res: Response) {
    const { wishlist_id } = req.body;
    const token = req.headers.authorization?.split(" ")[1] as string;
    const decodedToken = await this.authUtils.decodeToken(token as string);
    if (!decodedToken) {
      res
        .status(401)
        .send({ success: false, message: "Unauthorized. No token found." });
    } else {
      try {
        const result = await this.applyJobService.removeBookmarks(
          Number(decodedToken.user_id),
          Number(wishlist_id),
        );

        if (!result.success) {
          res.status(404).send({ success: false, message: result.message });
          return;
        }
        res.status(201).send({ success: true, message: result.message });
      } catch (error) {
        console.error(error);
        res
          .status(500)
          .send({ success: false, error: "Failed to remove bookmark" });
      }
    }
  }

  async getAllBookmarks(req: Request, res: Response) {
    const token = req.headers.authorization?.split(" ")[1] as string;
    const decodedToken = await this.authUtils.decodeToken(token as string);
    if (!decodedToken) {
      res
        .status(401)
        .send({ success: false, message: "Unauthorized. No token found." });
    } else {
      try {
        const bookmarks = await this.applyJobService.getAllBookmarks(
          Number(decodedToken.user_id),
        );
        res.status(200).send({ success: true, bookmarks });
      } catch (error) {
        console.error(error);
        res
          .status(500)
          .send({ success: false, error: "Failed to fetch bookmarks" });
      }
    }
  }

  async verifyApplyJob(req: Request, res: Response) {
    try {
      const { apply, job } = req.query;
      if (apply !== "true" || !apply) {
        res.status(400).send({
          status: res.statusCode,
          message: "Failed to request verify",
        });
        return;
      }

      if (!job) {
        res.status(400).send({
          status: res.statusCode,
          message: "Failed to request verify",
        });
        return;
      }

      const token = req.headers.authorization?.split(" ")[1] as string;
      const decodedToken = await this.authUtils.decodeToken(token);

      if (!decodedToken) {
        res.status(400).send({
          status: res.statusCode,
          message: "Invalid Token",
        });
        return;
      }

      const response = await this.applyJobService.verifyApplyJob(
        Number(job),
        decodedToken.user_id as number,
      );

      if (response.success) {
        res.status(200).send({
          status: res.statusCode,
          message: "Confirm apply",
        });
      } else {
        res.status(400).send({
          status: res.statusCode,
          message: response.message,
        });
      }
    } catch (error) {
      console.error("Error in verifyApplyJob:", error);
      res.status(500).send({
        status: 500,
        message: "Internal Server Error",
      });
    }
  }

  async getDetailApplicant(req: Request, res: Response) {
    const token = req.headers.authorization?.split(" ")[1] as string;
    const decodedToken = await this.authUtils.decodeToken(token);
    const { applicantId } = req.query;

    if (!decodedToken) {
      res.status(400).send({
        status: res.statusCode,
        message: "Invalid Token",
      });
      return;
    } else {
      try {
        const response = await this.applyJobService.getDetailApplicant(
          decodedToken.user_id,
          Number(applicantId),
        );
        if (response.success) {
          res.status(200).send({
            status: res.statusCode,
            data: response.jobHunterDetail,
          });
          return;
        } else {
          res.status(400).send({
            status: res.statusCode,
            message: response.message,
          });
          return;
        }
      } catch (e) {
        res.status(500).send({
          status: res.statusCode,
          message: e,
        });
      }
    }
  }
}

export default new ApplyJobController();
