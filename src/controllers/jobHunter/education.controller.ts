import { Request, Response } from "express";
import { EducationService } from "../../services/jobHunter/education.service";
import { AuthUtils } from "../../utils/auth.utils";
import { EducationData } from "../../models/models";

export class EducationController {
  private educationService: EducationService;
  private authUtils: AuthUtils;

  constructor() {
    this.educationService = new EducationService();
    this.authUtils = new AuthUtils();
  }

  async getListEducation(req: Request, res: Response) {
    const token = req.headers.authorization?.split(" ")[1] as string;
    const decodedToken = await this.authUtils.decodeToken(token as string);

    if (!decodedToken) {
      res.status(404).send("No token found.");
    } else {
      try {
        const response = await this.educationService.getListEducation(
          decodedToken.user_id
        );
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

  async createEducation(req: Request, res: Response) {
    const token = req.headers.authorization?.split(" ")[1] as string;
    const decodedToken = await this.authUtils.decodeToken(token as string);
    const data = req.body;

    const createEducationData: EducationData = {
      education_degree: data.education_degree,
      education_description: data.educationDescription,
      education_name: data.educationName,
      cumulative_gpa: data.cumulativeGpa,
      graduation_date: data.educationDate,
      jobHunterId: data.jobHunterId,
    };

    if (!decodedToken) {
      res.status(404).send("No token found.");
    } else {
      try {
        const response = await this.educationService.createEducation(
          decodedToken.user_id,
          createEducationData
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

  async updateEducation(req: Request, res: Response) {
    const token = req.headers.authorization?.split(" ")[1] as string;
    const decodedToken = await this.authUtils.decodeToken(token as string);
    const education_id = Number(req.params.educationId);
    const updateEducationData: EducationData = {
      education_degree: req.body.education_degree,
      education_name: req.body.educationName,
      graduation_date: new Date(req.body.educationDate),
      updated_at: new Date(),
      education_description: req.body.educationDescription,
      cumulative_gpa: Number(req.body.cumulativeGpa),
      jobHunterId: Number(req.body.jobHunterId),
    };

    if (!decodedToken) {
      res.status(404).send("No token found.");
    } else {
      try {
        const response = await this.educationService.updateEducation(
          decodedToken.user_id,
          education_id,
          updateEducationData
        );
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

  async deleteEducation(req: Request, res: Response) {
    const token = req.headers.authorization?.split(" ")[1] as string;
    const decodedToken = await this.authUtils.decodeToken(token as string);
    const education_id = Number(req.params.educationId);

    if (!decodedToken) {
      res.status(404).send("No token found.");
    } else {
      try {
        const response = await this.educationService.deleteEducation(
          decodedToken.user_id,
          education_id
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
