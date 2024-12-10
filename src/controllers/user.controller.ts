import { Request, response, Response } from "express";
import { UserService } from "../services/user.service";
import { AuthUtils } from "../utils/auth.utils";
import { CompanyGeneralInfo, UpdateImage } from "../models/models";

export class UserController {
  private userService: UserService;
  private authUtils: AuthUtils;

  constructor() {
    this.userService = new UserService();
    this.authUtils = new AuthUtils();
  }

  async getCompanyDetail(req: Request, res: Response) {
    const token = req.headers.authorization?.split(" ")[1] as string;
    const decodedToken = await this.authUtils.decodeToken(token as string);

    if (!decodedToken) {
      res.status(404).send("No token found.");
    } else {
      try {
        const response = await this.userService.getCompanyDetail(
          decodedToken.user_id,
        );
        if (response.success) {
          res.status(200).send({
            status: res.statusCode,
            data: response.companyResp,
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

  async updateCompanyDetail(req: Request, res: Response) {
    const token = req.headers.authorization?.split(" ")[1] as string;
    const {
      company_id,
      company_province,
      company_city,
      company_description,
      company_industry,
      company_size,
      company_name,
    }: CompanyGeneralInfo = req.body as CompanyGeneralInfo;

    const updateData: CompanyGeneralInfo = {
      company_id,
      company_province,
      company_description,
      company_industry,
      company_size,
      company_name,
      company_city,
    };
    const decodedToken = await this.authUtils.decodeToken(token as string);
    if (!decodedToken) {
      res.status(404).send("No token found.");
    } else {
      try {
        const response = await this.userService.updateCompanyDetail(
          decodedToken.user_id,
          updateData,
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

  async updatecompanyImage(req: Request, res: Response) {
    const token = req.headers.authorization?.split(" ")[1] as string;
    const { company_id } = req.body;
    const image = req.file ? req.file.path || "" : "";
    const updateImage: UpdateImage = {
      id: company_id,
      image: image,
    };

    const decodedToken = await this.authUtils.decodeToken(token as string);
    if (!decodedToken) {
      res.status(404).send("No token found.");
    } else {
      try {
        const response = await this.userService.updateCompanyImage(
          decodedToken.user_id,
          updateImage,
        );
        if (response.success) {
          res.status(200).send({
            status: res.statusCode,
            message: response.message,
            data: response.image,
          });
        } else {
          res.status(400).send({
            status: res.statusCode,
            message: response.message,
            detail: response.detail || "No detail availble",
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
