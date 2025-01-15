import { PrismaClient } from "@prisma/client";
import { Request, Response } from "express";
import { ResendEmailService } from "../services/resendemail.service";

const prisma = new PrismaClient();

export class ResendEmailController {
  private resendEmailService: ResendEmailService;

  constructor() {
    this.resendEmailService = new ResendEmailService();
    this.resendEmailVerification = this.resendEmailVerification.bind(this);
  }

  async resendEmailVerification(req: Request, res: Response) {
    try {
      const { email } = req.body;

      if (!email) {
        res.status(400).json({
          success: false,
          message: "Email is required.",
        });
        return;
      }

      const result = await this.resendEmailService.resendVerificationEmail(email);

      if (!result.success) {
        res.status(400).json(result);
        return;
      }

      res.status(200).json({
        success: true,
        message: "Verification email sent successfully.",
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        success: false,
        message: "Internal server error.",
      });
    }
  }
}
