import { Request, Response } from "express";
import { AuthService } from "../services/auth.service";
import sendEmail from "../config/nodeMailer";

export class AuthController {
  private authService: AuthService;
  constructor() {
    this.authService = new AuthService();
  }

  async requestResetPassword(req: Request, res: Response) {
    const { email } = req.body;

    try {
      const response = await this.authService.requestResetPassword(email);
      console.log(response);

      if (!response.success) {
        res.status(404).send({
          status: res.status,
          message: response.message,
        });
      } else {
        sendEmail(response.user as string, response.resetToken as string)
          .then(() => {
            res.status(200).send({
              status: res.status,
              message: "Email sent successfully",
            });
          })
          .catch((err) => {
            res.status(400).send({
              status: res.status,
              message: err.message,
            });
            console.log(err);
          });
      }
    } catch (e) {
      console.log(e);
    }
  }

  async verifyResetToken(req: Request, res: Response) {
    const token = req.headers.authorization?.split(" ")[1] as string;

    try {
      const response = await this.authService.verifyResetToken(token);
      if (response.success) {
        res.status(200).send({
          status: res.status,
        });
      } else {
        res.status(401).send({
          status: res.status,
          message: response.message,
        });
      }
    } catch (e) {
      console.log(e);
    }
  }

  async resetPassword(req: Request, res: Response) {
    const token = req.headers.authorization?.split(" ")[1] as string;
    const { newPassword } = req.body;

    try {
      const response = await this.authService.resetPassword(newPassword, token);
      if (response.success) {
        res.status(200).send({
          status: res.status,
          message: response.message,
        });
      } else {
        res.status(400).send({
          status: res.status,
          message: response.message,
          detail: response.detail,
        });
      }
    } catch (e) {
      console.log(e);
      res.status(500).send({
        status: res.status,
        message: "Internal server error",
      });
    }
  }
}
