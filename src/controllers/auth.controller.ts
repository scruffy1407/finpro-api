import { Request, Response } from "express";
import { AuthService } from "../services/auth.service";
import { Auth, LoginResponse } from "../models/models";

export class AuthController {
  private authService: AuthService;

  constructor() {
    this.authService = new AuthService();
  }

  async register(req: Request, res: Response) {
    try {
      const { email, name, password, user_role }: Auth = req.body;

      const result = await this.authService.register(
        { email, name, password, user_role },
        user_role
      );

      if (!result.success) {
        res.status(400).json({
          success: false,
          message: result.message || "Registration failed",
        });
      }
      res.status(201).json({
        success: true,
        message: "Successfully registered",
        data: result.user,
      });
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
      }

      const response = {
        access_token: data.accessToken,
      };

      res.status(200).json({
        success: true,
        message: "Token successfully updated",
        data: response,
      });
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
