import { PrismaClient } from "@prisma/client";
import { AuthUtils } from "../utils/auth.utils";
import nodemailer from "nodemailer";
import cron from "node-cron";
import fs from "fs";
import path from "path";
import { sendEmailVerification } from "../config/nodeMailer";

export class ResendEmailService {
  private prisma: PrismaClient;
  private AuthUtils: AuthUtils;

  constructor() {
    this.prisma = new PrismaClient();
    this.AuthUtils = new AuthUtils();
    this.setupCronJob();
  }

  async resendVerificationEmail(email: string) {
    const user = await this.prisma.baseUsers.findUnique({
      where: { email },
    });

    if (!user) {
      return { success: false, message: "User not found." };
    }

    if (user.verified) {
      return { success: false, message: "User is already verified." };
    }

    const maxAttempts = 3;
    const cooldownPeriod = 5 * 60 * 1000;
    const now = new Date();

    if (
      (user.email_verification_attempts ?? 0) >= maxAttempts &&
      new Date(user.last_attempt_time as Date).getTime() + cooldownPeriod >
        now.getTime()
    ) {
      return {
        success: false,
        message:
          "Maximum verification attempts reached. Please try again in 5 minutes.",
      };
    }

    const resetToken = await this.AuthUtils.generateResetToken(email);

    try {
      await this.prisma.baseUsers.update({
        where: { email },
        data: {
          verification_token: resetToken,
          email_verification_attempts:
            (user.email_verification_attempts ?? 0) + 1,
          last_attempt_time: new Date(),
        },
      });

      // await this.sendEmail(email, resetToken);
      await sendEmailVerification(email, resetToken);

      return { success: true };
    } catch (error) {
      console.error("Error sending verification email:", error);
      return { success: false, message: "Failed to send verification email." };
    }
  }

  private async sendEmail(email: string, token: string) {
    const transporter = nodemailer.createTransport({
      service: "Gmail",
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASS,
      },
    });

    const verificationLink = `${process.env.CLIENT_URL}/verify-email?token=${token}`;

    const htmlTemplate = fs.readFileSync(
      path.join(__dirname, "../../src/config/views/verifyEmail.html"),
      "utf8",
    );
    const htmlContent = htmlTemplate.replace(
      "{{verificationLink}}",
      verificationLink,
    );

    await transporter.sendMail({
      from: process.env.GMAIL_USER,
      to: email,
      subject: "Verify Your Email",
      html: htmlContent,
    });
  }

  private setupCronJob() {
    cron.schedule("*/5 * * * *", async () => {
      try {
        const timeLimit = new Date(Date.now() - 5 * 60 * 1000);

        await this.prisma.baseUsers.updateMany({
          where: {
            last_attempt_time: { lte: timeLimit },
          },
          data: {
            email_verification_attempts: 0,
          },
        });
      } catch (error) {
        console.error("Error resetting email verification attempts:", error);
      }
    });
  }
}
