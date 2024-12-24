import { Request, Response } from "express";
import { ApplyJob } from "../services/applyjob.service";
import { Decimal } from "@prisma/client/runtime/library";
import { ApplicationStatus } from "../models/models";

class ApplyJobController {
  private applyJobService: ApplyJob;

  constructor() {
    this.applyJobService = new ApplyJob();
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

    console.log("Received apply job request. Body:", req.body, "File:", file);

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

  async createBookmark(req: Request, res: Response) {
    const { jobHunterId, jobPostId } = req.body;

    try {
      const bookmark = await this.applyJobService.createBookmark(
        Number(jobHunterId),
        Number(jobPostId),
        new Date(),
      );

      res.status(201).send({ success: true, bookmark });
    } catch (error) {
      console.error(error);
      res
        .status(500)
        .send({ success: false, error: "Failed to create bookmark" });
    }
  }

  async removeBookmarks(req: Request, res: Response) {
    const { jobHunterId, jobPostId } = req.body;
    console.log("REQ BODY!", req.body);

    try {
      const result = await this.applyJobService.removeBookmarks(
        Number(jobHunterId),
        Number(jobPostId),
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

  async getAllBookmarks(req: Request, res: Response) {
    const { jobHunterId } = req.params;

    try {
      const bookmarks = await this.applyJobService.getAllBookmarks(
        Number(jobHunterId),
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

export default new ApplyJobController();
