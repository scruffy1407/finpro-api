import { Request, Response } from "express";
import { AuthService } from "../services/auth.service";
import sendEmail from "../config/nodeMailer";
import { Auth, LoginResponse } from "../models/models";

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

  async register(req: Request, res: Response) {
    try {
      const { email, name, password, user_role }: Auth = req.body;
      const bearerToken = req.headers.authorization?.split(" ")[1];

      if (!bearerToken) {
        res.status(401).json({
          success: false,
          message: "Unauthorized: Bearer token missing",
        });
        return;
      }

      const result = await this.authService.register(
        { email, name, password, user_role },
        user_role,
        bearerToken
      );

      if (!result.success) {
        res.status(400).json({
          success: false,
          message: result.message || "Registration failed",
        });
      } else {
        res.status(201).json({
          success: true,
          message: "Successfully registered",
          data: result.user,
        });
      }
    } catch (error: any) {
      console.error("Register error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to register, please check your input",
        error: error.message,
      });
    }
  }

  async login(req: Request, res: Response) {
    try {
      const { email, password, user_role }: Auth = req.body;

      const result = await this.authService.login({
        email,
        password,
        user_role,
      });

      if (!result.success || !result.user) {
        res.status(401).json({
          success: false,
          message: result.message || "Failed to login: User not found",
        });
      } else {
        const loginResponse: LoginResponse = {
          access_token: result.accessToken || "",
          refresh_token: result.user.refresh_token || "",
          oauth_token: "",
          user: {
            ...result.user,
            user_role: result.user.role_type || "jobhunter",
          },
        };

        res.status(200).json({
          success: true,
          message: "Successfully logged in",
          data: loginResponse,
        });
      }
    } catch (error: any) {
      console.error("Login error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to login",
        error: error.message,
      });
    }
  }

  async refreshToken(req: Request, res: Response) {
    try {
      const { refreshToken }: { refreshToken: string } = req.body;

      const data = await this.authService.refreshToken(refreshToken);

      if (!data.success) {
        res.status(401).json({
          success: false,
          message: data.message || "Failed to refresh token",
        });
      } else {
        const response = {
          access_token: data.accessToken,
        };

        res.status(200).json({
          success: true,
          message: "Token successfully updated",
          data: response,
        });
      }
    } catch (error: any) {
      console.error("Refresh token error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to refresh token",
        error: error.message,
      });
    }
  }
}
