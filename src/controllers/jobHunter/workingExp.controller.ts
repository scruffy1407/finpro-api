import { Request, Response } from "express";
import { WorkingExpService } from "../../services/jobHunter/workingExp.service";
import { AuthUtils } from "../../utils/auth.utils";
import { WorkingExperience } from "../../models/models";

export class WorkingExpController {
  private workingExpService: WorkingExpService;
  private authUtils: AuthUtils;
  constructor() {
    this.workingExpService = new WorkingExpService();
    this.authUtils = new AuthUtils();
  }

  async getListWorkingExp(req: Request, res: Response) {
    const token = req.headers.authorization?.split(" ")[1] as string;
    const decodedToken = await this.authUtils.decodeToken(token as string);
    const wReviewString = req.query.review;
    const wReview = wReviewString === "true";
    console.log("REVIEW BOOLEAN", wReview);

    if (!decodedToken) {
      res.status(404).send("No token found.");
    } else {
      try {
        const response = await this.workingExpService.getListWorkingExperience(
          decodedToken.user_id,
          wReview,
        );
        console.log("INI DATA WORKING EXP:", response);
        if (response.success) {
          res.status(200).send({
            status: res.statusCode,
            data: response.data,
          });
        } else {
          res.status(400).send({
            status: res.statusCode,
            message: response.message,
            detail: response.detail || "No detail",
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

  async createWorkingExp(req: Request, res: Response) {
    const token = req.headers.authorization?.split(" ")[1] as string;
    const decodedToken = await this.authUtils.decodeToken(token as string);

    const workingExpData: WorkingExperience = req.body as WorkingExperience;
    console.log(workingExpData);

    if (!decodedToken) {
      res.status(404).send("No token found.");
    } else {
      try {
        const response = await this.workingExpService.createWorkingExperience(
          decodedToken.user_id,
          workingExpData,
        );
        if (response.success) {
          res.status(201).send({
            status: res.statusCode,
            data: response.data,
          });
        } else {
          res.status(400).send({
            status: res.statusCode,
            message: response.message,
            detail: response.detail || "No detail",
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

  async editWorkingExperience(req: Request, res: Response) {
    const token = req.headers.authorization?.split(" ")[1] as string;
    const decodedToken = await this.authUtils.decodeToken(token as string);
    const workExpId = Number(req.params.workExpId);
    const workingExpData: WorkingExperience = req.body as WorkingExperience;

    if (!decodedToken) {
      res.status(404).send("No token found.");
    } else {
      try {
        const response = await this.workingExpService.editWorkingExperience(
          decodedToken.user_id,
          workExpId,
          workingExpData,
        );
        if (response.success) {
          res.status(204).send({
            status: res.statusCode,
            data: response.data,
          });
        } else {
          res.status(400).send({
            status: res.statusCode,
            message: response.message,
            detail: response.detail || "No detail",
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

  async deleteWorkingExp(req: Request, res: Response) {
    const token = req.headers.authorization?.split(" ")[1] as string;
    const decodedToken = await this.authUtils.decodeToken(token as string);
    const workExpId = Number(req.params.workExpId);

    if (!decodedToken) {
      res.status(404).send("No token found.");
    } else {
      try {
        const response = await this.workingExpService.deleteWorkingExperience(
          decodedToken.user_id,
          workExpId,
        );
        if (response.success) {
          res.status(200).send({
            status: res.statusCode,
            message: response.message,
          });
        } else {
          res.status(400).send({
            status: res.statusCode,
            message: response.message,
            detail: response.detail || "No detail",
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
}
