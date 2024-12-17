import { Request, Response } from "express";
import { JobHunterService } from "../../services/jobHunter/jobHunter.service";
import { AuthUtils } from "../../utils/auth.utils";
import { JobHunterGeneralInfo, UpdateImage } from "../../models/models";

export class JobHunterController {
  private jobHunterService: JobHunterService;
  private authUtils: AuthUtils;
  constructor() {
    this.jobHunterService = new JobHunterService();
    this.authUtils = new AuthUtils();
  }

  async getUserDetail(req: Request, res: Response) {
    const token = req.headers.authorization?.split(" ")[1] as string;
    const decodedToken = await this.authUtils.decodeToken(token as string);

    if (!decodedToken) {
      res.status(404).send("No token found.");
    } else {
      try {
        const response = await this.jobHunterService.getUserDetail(
          decodedToken.user_id,
        );
        if (response.success) {
          res.status(200).send({
            status: res.statusCode,
            data: response.jobHunterResp,
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

  async updateUserProfile(req: Request, res: Response) {
    const token = req.headers.authorization?.split(" ")[1] as string;
    const decodedToken = await this.authUtils.decodeToken(token as string);

    const {
      jobHunterId,
      dob,
      gender,
      name,
      locationProvince,
      locationCity,
      expectedSalary,
      summary,
      cityId,
    } = req.body as JobHunterGeneralInfo;

    const updateData: JobHunterGeneralInfo = {
      jobHunterId,
      dob,
      gender,
      name,
      locationProvince,
      locationCity,
      expectedSalary,
      summary,
      cityId,
    };

    if (!decodedToken) {
      res.status(404).send("No token found.");
    } else {
      try {
        const response = await this.jobHunterService.updateUserProfile(
          decodedToken.user_id,
          updateData,
        );
        if (response.success) {
          res.status(200).send({
            status: res.statusCode,
            data: response.updateUser,
          });
        } else {
          res.status(400).send({
            status: res.statusCode,
            message: response.message,
            detail: response.detail || "No Detail",
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

  async updateUserImage(req: Request, res: Response) {
    const token = req.headers.authorization?.split(" ")[1] as string;
    const decodedToken = await this.authUtils.decodeToken(token as string);

    const { job_hunter_id } = req.body;
    const image = req.file ? req.file.path || "" : "";
    const updateImage: UpdateImage = {
      id: Number(job_hunter_id),
      image: image,
    };

    if (!decodedToken) {
      res.status(404).send("No token found.");
    } else {
      try {
        const response = await this.jobHunterService.updateUserImage(
          decodedToken.user_id,
          updateImage,
        );
        if (response.success) {
          res.status(201).send({
            status: res.statusCode,
            data: image,
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
