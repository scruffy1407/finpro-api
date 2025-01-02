import { PrismaClient } from "@prisma/client";
import { Request, Response } from "express";
import { AuthService } from "../services/auth.service";
import { sendEmailReset, sendEmailVerification } from "../config/nodeMailer";
import { Auth, LoginResponse, UserId } from "../models/models";
import { RoleType } from "@prisma/client";
import { AuthUtils } from "../utils/auth.utils";

const prisma = new PrismaClient();

export class AuthController {
  private authService: AuthService;
  private authUtils: AuthUtils;

  constructor() {
    this.authService = new AuthService();
    this.authUtils = new AuthUtils();
  }

  async requestResetPassword(req: Request, res: Response) {
    const { email } = req.body;
    console.log(email);

    try {
      const response = await this.authService.requestResetPassword(email);
      if (!response.success) {
        res.status(400).send({
          status: res.status,
          message: response.message,
        });
      } else {
        sendEmailReset(response.user as string, response.resetToken as string)
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

  async verifyEmail(req: Request, res: Response) {
    const { verificationToken } = req.params;

    try {
      const response = await this.authService.verifyEmail(verificationToken);
      if (response.success) {
        res.status(200).send({
          status: res.status,
          message: "Succesfully verify email",
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

  async register(req: Request, res: Response) {
    try {
      const { email, phone_number, name, password, user_role }: Auth = req.body;
      const bearerToken = req.headers.authorization?.split(" ")[1];

      if (user_role === RoleType.developer)
        if (!bearerToken) {
          res.status(401).json({
            success: false,
            message: "Unauthorized: Bearer token missing",
          });
          return;
        }

      const result = await this.authService.register(
        { email, phone_number, name, password, user_role },
        user_role,
        bearerToken,
      );

      if (!result.success) {
        res.status(400).json({
          success: false,
          message: result.message || "Registration failed",
        });
      } else {
        sendEmailVerification(
          result.user?.email as string,
          result.user?.verification_token as string,
        )
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
          });
      }
    } catch (error: any) {
      console.error("Register error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to register, please check your input",
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
          refresh_token: result.refreshToken || "",
          oauth_token: "",
          user: {
            ...result.user,
            user_role: result.user.role_type || "jobhunter",
            name: result.additionalInfo.name,
            photo: result.additionalInfo.photo,
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
      });
    }
  }

  // async refreshToken(req: Request, res: Response) {
  //   try {
  //     const { refreshToken }: { refreshToken: string } = req.body;
  //
  //     const data = await this.authService.refreshToken(refreshToken);
  //
  //     if (!data.success) {
  //       res.status(401).json({
  //         success: false,
  //         message: data.message || "Failed to refresh token",
  //       });
  //     } else {
  //       const response = {
  //         access_token: data.accessToken,
  //       };
  //       res.status(200).json({
  //         success: true,
  //         message: "Token successfully updated",
  //         data: response,
  //       });
  //     }
  //   } catch (error: any) {
  //     console.error("Refresh token error:", error);
  //     res.status(500).json({
  //       success: false,
  //       message: "Failed to refresh token",
  //       error: error.message,
  //     });
  //   }
  // }

  async logout(req: Request, res: Response) {
    try {
      const { user_id }: UserId = req.body;

      if (!user_id) {
        res.status(400).json({
          success: false,
          message: "User ID is required.",
        });
        return;
      }

      const result = await this.authService.logout(parseInt(user_id));

      if (!result.success) {
        res.status(404).json(result);
        return;
      }

      res.status(200).json({
        success: true,
        message: "Logged out successfully.",
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        success: false,
        message: "Internal server error.",
      });
    }
  }

  async refreshAccessToken(req: Request, res: Response) {
    const token = req.headers.authorization?.split(" ")[1] as string;
    console.log("CONTROLLER", token);
    const decodedToken = await this.authUtils.decodeToken(token as string);
    if (!decodedToken) {
      res.status(404).send("No token found.");
    } else {
      try {
        const response = await this.authService.refreshAccessToken(
          decodedToken.user_id,
          decodedToken.role_type as RoleType,
          token as string,
        );
        console.log(response);
        if (response.success) {
          res.status(200).send({
            status: res.statusCode,
            data: response.accessToken,
          });
        } else {
          res.status(400).send({
            status: res.statusCode,
            message: response.message,
          });
        }
      } catch (e) {
        console.log(e);
        res.status(500).send({
          status: res.statusCode,
          message: e,
        });
      }
    }
  }
  async validateToken(req: Request, res: Response) {
    const token = req.headers.authorization?.split(" ")[1] as string;
    const decodedToken = await this.authUtils.decodeToken(token as string);

    console.log(decodedToken);
    if (!decodedToken) {
      res.status(404).send("No token found.");
    } else {
      try {
        const response = await this.authService.validateToken(
          decodedToken.user_id,
          decodedToken.role_type as RoleType,
        );

        console.log("RESPONSE VALIDATE TOKEN :", response);

        if (response.success) {
          res.status(200).send({
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
}
