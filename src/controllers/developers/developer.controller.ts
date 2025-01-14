import { Request, Response } from "express";
import { DeveloperService } from "../../services/developers/developer.service";
import { AuthUtils } from "../../utils/auth.utils";

export class DeveloperController {
  private developerSevice: DeveloperService;
  private authUtils: AuthUtils;
  constructor() {
    this.developerSevice = new DeveloperService();
    this.authUtils = new AuthUtils();
  }

  async getUsers(req: Request, res: Response) {
    const token = req.headers.authorization?.split(" ")[1] as string;
    const decodedToken = await this.authUtils.decodeToken(token);
    const { subsId, limit, page } = req.query;

    if (!decodedToken) {
      res.status(400).send({
        status: res.statusCode,
        message: "Invalid token",
      });
    } else {
      const response = await this.developerSevice.getUsers(
        Number(limit),
        Number(page),
        decodedToken.user_id,
        Number(subsId),
      );
      if (response.success) {
        const data = response.data;
        res.status(200).send({
          status: res.statusCode,
          data,
        });
      } else {
        res.status(400).send({
          status: res.statusCode,
          message: response.message,
        });
      }
      try {
      } catch (e) {
        res.status(500).send({
          status: res.statusCode,
          message: "Something went wrong in the server",
          detail: e,
        });
      }
    }
  }
}
