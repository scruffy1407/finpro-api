import { Request, Response } from "express";
import { CVService } from "../services/cv.service";
import { AuthUtils } from "../utils/auth.utils";

export class CVController {
  private cvService: CVService;
  private authUtils: AuthUtils;

  constructor() {
    this.cvService = new CVService();
    this.authUtils = new AuthUtils();
    this.getCVData = this.getCVData.bind(this);
    this.getCVQuota = this.getCVQuota.bind(this);
    this.generateCV = this.generateCV.bind(this);
  }

  async getCVData(req: Request, res: Response) {
    const token = req.headers.authorization?.split(" ")[1] as string;
    const decodedToken = await this.authUtils.decodeToken(token);

    if (!decodedToken) {
      res.status(401).send({ success: false, message: "Unauthorized. No token found." });
      return;
    }
    try {
      const userId = Number(decodedToken.user_id);
      const cvdata = await this.cvService.getCVData(userId);
      res.status(200).send({ success: true, cvdata });
    } catch (error) {
      console.error(error);
      res.status(500).send({ success: false, message: "Failed to fetch CV data." });
    }
  }

  async getCVQuota(req: Request, res: Response) {
    const token = req.headers.authorization?.split(" ")[1] as string;
    const decodedToken = await this.authUtils.decodeToken(token);

    if (!decodedToken) {
      res.status(401).send({ success: false, message: "Unauthorized. No token found." });
      return;
    }
    try {
      const userId = Number(decodedToken.user_id);
      const { remaining } = await this.cvService.canGenerateCV(userId);

      res.status(200).send({ success: true, remaining });
    } catch (error) {
      console.error(error);
      res.status(500).send({ success: false, message: "Failed to fetch CV quota." });
    }
  }

  async generateCV(req: Request, res: Response) {
    const token = req.headers.authorization?.split(" ")[1] as string;
    const decodedToken = await this.authUtils.decodeToken(token);
    if (!decodedToken) {
      res.status(401).send({ success: false, message: "Unauthorized. No token found." });
      return;
    }
    try {
      const userId = Number(decodedToken.user_id);
      const { canGenerate, remaining } = await this.cvService.canGenerateCV(userId);
      if (!canGenerate) {
        res.status(403).send({
          success: false,
          message: "CV generation limit reached.",
          remaining,
        });
        return;
      }
      await this.cvService.incrementCVCount(userId);
      res.status(200).send({
        success: true,
        message: "CV generated successfully.",
        remaining: remaining - 1,
      });
    } catch (error) {
      console.error(error);
      res.status(500).send({ success: false, message: "Failed to generate CV." });
    }
  }
}
