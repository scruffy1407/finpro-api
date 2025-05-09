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

    const { id } = req.body;
    const image = req.file ? req.file.path || "" : "";
    const updateImage: UpdateImage = {
      id: Number(id),
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
          res.status(200).send({
            status: res.statusCode,
            data: response.image,
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

  async validateUserJoinJob(req: Request, res: Response) {
    const token = req.headers.authorization?.split(" ")[1] as string;
    const decodedToken = await this.authUtils.decodeToken(token as string);
    const jobId = req.params.jobId;

    if (!decodedToken) {
      res.status(400).send("No token found.");
    } else {
      try {
        const response = await this.jobHunterService.validateUserJoinJob(
          decodedToken.user_id as number,
          Number(jobId),
        );
        if (response.success && response.code === "NOT_JOIN") {
          res.status(200).send({
            status: res.statusCode,
            code: "NOT_JOIN",
          });
        } else if (response.success && response.code === "JOIN") {
          res.status(200).send({
            status: res.statusCode,
            code: "JOIN",
            data: response.data,
          });
        } else {
          res.status(400).send({
            status: res.statusCode,
            message: response.message,
            code: response.code || "NO_CODE",
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
