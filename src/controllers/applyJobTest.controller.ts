import { Request, Response } from "express";
import { ApplyJobTest } from "../services/applyJobTest.service";

export class ApplyJobTestController {
  private applyJobTestService: ApplyJobTest;

  constructor() {
    this.applyJobTestService = new ApplyJobTest();
  }

  async editApplication(req: Request, res: Response): Promise<void> {
    const { applicationId, expected_salary } = req.body;
    const file = req.file;
    const accessToken = req.headers.authorization?.split(" ")[1];
    // Access token validation
    if (!accessToken) {
      res
        .status(401)
        .send({ success: false, error: "Access token is required" });
      return;
    }

    // File validation
    if (!file) {
      res
        .status(400)
        .send({ success: false, error: "Resume file is required" });
      return;
    }

    // Validate required fields
    if (!applicationId || !expected_salary) {
      res.status(400).send({
        success: false,
        error: "Application ID and expected salary are required",
      });
      return;
    }

    try {
      const updatedApplication = await this.applyJobTestService.editApplication(
        Number(applicationId),
        expected_salary,
        file,
        accessToken
      );
      if ("error" in updatedApplication) {
        res.status(400).send({
          success: false,
          message: updatedApplication.error,
        });
        return;
      }
      res.status(200).send({ success: true, updatedApplication });
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error("Unexpected error:", error);
        res.status(500).send({
          success: false,
          message: "Failed to edit application, please try again",
        });
      }
    }
  }
}
