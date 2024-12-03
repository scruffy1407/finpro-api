import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { PrismaClient, RoleType } from "@prisma/client";
import { Auth } from "../models/models";
import { registerSchema, loginSchema } from "../validators/auth.validator";
import environment from "dotenv";

environment.config();

const JWT_SECRET = process.env.JWT_SECRET as string;

export class AuthService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
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
      return {
        success: false,
        message: "User with this email already exists.",
      };
    }

    if (role === RoleType.jobhunter) {
      const existingJobHunter = await this.prisma.jobHunter.findUnique({
        where: { email: validatedData.email },
      });
      if (existingJobHunter) {
        return {
          success: false,
          message: "User with this email already exists.",
        };
      }
    }

    const hashedPassword = await bcrypt.hash(validatedData.password, 10);

    let baseUser;

    try {
      baseUser = await this.prisma.baseUsers.create({
        data: {
          email: validatedData.email,
          password: hashedPassword,
          role_type: role,
        },
      });
    } catch (error) {
      console.error("Error creating user", error);
      return {
        success: false,
        message: "Error occured duting registration.",
      };
    }

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

  async login(data: Auth) {
    const validatedData = loginSchema.parse(data);

    const user = await this.prisma.baseUsers.findUnique({
      where: { email: validatedData.email },
    });

    if (
      !user ||
      !(await bcrypt.compare(validatedData.password, user.password))
    ) {
      return { success: false, message: "Invalid credentials" };
    }

    if (!validatedData.user_role) {
      return { success: false, message: "Role type is required." };
    }

    if (user.role_type !== validatedData.user_role) {
      return {
        success: false,
        message: "You do not have permission to perform this action.",
      };
    }

    const accessToken = jwt.sign(
      { id: user.user_id, role: user.role_type },
      JWT_SECRET,
      {
        expiresIn: "3d",
      }
    );

    const refreshToken = jwt.sign(
      { id: user.user_id, role: user.role_type },
      JWT_SECRET,
      {
        expiresIn: "7d",
      }
    );

    await this.prisma.baseUsers.update({
      where: {
        email: validatedData.email,
      },
      data: {
        access_token: accessToken,
        refresh_token: refreshToken,
      },
    });

    return { success: true, accessToken, user };
  }

  async refreshToken(token: string) {
    try {
      const decoded: any = jwt.verify(token, JWT_SECRET);
      const user = await this.prisma.baseUsers.findUnique({
        where: {
          user_id: decoded.id,
        },
      });

      if (!user) {
        return { success: false, message: "User not found" };
      }

      if (!user.refresh_token) {
        return { success: false, message: "User is not logged in" };
      }

      const accessToken = jwt.sign(
        { id: user.user_id, role: user.role_type },
        JWT_SECRET,
        { expiresIn: "3d" }
      );

      return { success: true, accessToken };
    } catch (error) {
      return { success: false, message: "Invalid refresh token" };
    }
  }
}
