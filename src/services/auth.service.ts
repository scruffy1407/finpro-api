import jwt, { JwtPayload } from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { PrismaClient, RoleType } from "@prisma/client";
import { Auth } from "../models/models";
import {
  registerSchema,
  resetPasswordSchema,
} from "../validators/auth.validator";
import { AuthUtils } from "../utils/auth.utils";

const JWT_SECRET = process.env.JWT_SECRET as string;

export class AuthService {
  private prisma: PrismaClient;
  private AuthUtils: AuthUtils;

  constructor() {
    this.prisma = new PrismaClient();
    this.AuthUtils = new AuthUtils();
  }

  async register(data: Auth, role: RoleType) {
    const validatedData = registerSchema.parse(data);

    const existingUser = await this.prisma.baseUsers.findFirst({
      where: {
        OR: [{ email: validatedData.email }],
      },
    });

    if (existingUser) {
      console.error("User with this email already exists.");
      return { success: false, message: "User already exists." };
    }

    const hashedPassword = await bcrypt.hash(validatedData.password, 10);

    const baseUser = await this.prisma.baseUsers.create({
      data: {
        email: validatedData.email,
        password: hashedPassword,
        role_type: role,
      },
    });

    if (role === RoleType.jobhunter) {
      const jobHunterSubscription =
        await this.prisma.jobHunterSubscription.create({
          data: {
            subscription_active: false,
            subscriptionTable: {
              connect: { subscription_id: 1 }, // 1 = Free, 2 = Standard, 3 = Premium
            },
          },
        });

      await this.prisma.jobHunter.create({
        data: {
          email: validatedData.email,
          name: validatedData.name,
          password: hashedPassword,
          baseUser: {
            connect: { user_id: baseUser.user_id },
          },
          jobHunterSubscription: {
            connect: {
              job_hunter_subscription_id:
                jobHunterSubscription.job_hunter_subscription_id,
            },
          },
        },
      });
    } else if (role === RoleType.company) {
      await this.prisma.company.create({
        data: {
          company_name: validatedData.name,
          baseUser: {
            connect: { user_id: baseUser.user_id },
          },
        },
      });
    } else if (role === RoleType.developer) {
      await this.prisma.developer.create({
        data: {
          developer_name: validatedData.name,
          baseUser: {
            connect: { email: baseUser.email },
          },
        },
      });
    }

    return { success: true, user: baseUser };
  }

  async requestResetPassword(email: string) {
    const getUser = await this.prisma.baseUsers.findUnique({
      where: {
        email: email,
      },
    });

    if (!getUser) {
      return {
        success: false,
        user: null,
        message: `User not found`,
      };
    }

    const resetToken = await this.AuthUtils.generateResetToken(email);
    console.log(resetToken);
    await this.prisma.baseUsers.update({
      where: {
        email: email,
      },
      data: {
        reset_password_token: resetToken,
      },
    });

    return { success: true, user: getUser.email, resetToken: resetToken };
  }

  async verifyResetToken(token: string) {
    //   Decode token
    const result = (await this.AuthUtils.decodeToken(token)) as JwtPayload;
    console.log(result.email);
    if (result) {
      const checkUserEmail = await this.prisma.baseUsers.findUnique({
        where: {
          email: result.email,
        },
      });
      if (
        checkUserEmail &&
        checkUserEmail.reset_password_token &&
        checkUserEmail.reset_password_token === token
      ) {
        return { success: true, message: "Available" };
      } else {
        return { success: false, message: "Invalid Token" };
      }
    } else {
      return {
        success: false,
        message: "User Not Found",
      };
    }
  }

  async resetPassword(password: string, token: string) {
    const validatePassword = resetPasswordSchema.parse(password);

    const result = (await this.AuthUtils.decodeToken(token)) as JwtPayload;
    const hashedPassword = await bcrypt.hash(validatePassword, 10);

    try {
      await this.prisma.baseUsers.update({
        where: {
          email: result.email,
          reset_password_token: token,
        },
        data: {
          password: hashedPassword,
          reset_password_token: null,
        },
      });
      return {
        success: true,
        message: "Password updated",
      };
    } catch (e) {
      return {
        success: false,
        message: "Failed to update password",
        detail: e,
      };
    }
  }
}
