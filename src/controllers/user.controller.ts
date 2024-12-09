import { Request, Response } from "express";
import { UserService } from "../services/user.service";
import { AuthUtils } from "../utils/auth.utils";

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
      } catch (e) {}
    }
  }
}
