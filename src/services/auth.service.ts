import jwt, { JwtPayload } from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { PrismaClient, RoleType, RegisterBy } from "@prisma/client";
import { Auth, AuthUtils } from "../models/models";
import { registerSchema, loginSchema, validatePassword } from "../validators/auth.validator";
import environment from "dotenv";

environment.config();

const JWT_SECRET = process.env.JWT_SECRET as string;
const DEVELOPER_ACCESS_TOKEN = process.env.DEVELOPER_ACCESS_TOKEN as string;

export class AuthService {
  private prisma: PrismaClient;
  private AuthUtils: AuthUtils;

  constructor() {
    this.prisma = new PrismaClient();
    this.AuthUtils = new AuthUtils();
  }

  async register(data: Auth, role: RoleType, bearerToken?: string) {
    const validatedData = registerSchema.parse(data);

    if (role === RoleType.developer) {
      if (!bearerToken || bearerToken !== DEVELOPER_ACCESS_TOKEN) {
        return {
          success: false,
          message: "Unauthorized to create a developer role.",
        };
      }
    }

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
    const checkPassword = validatePassword(password);
    if (!checkPassword) {
      return { success: false, message: "Invalid Password" };
    }

    const result = (await this.AuthUtils.decodeToken(token)) as JwtPayload;
    const hashedPassword = await bcrypt.hash(password, 10);

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

    if (user.register_by !== RegisterBy.email) {
      return {
        success: false,
        message: `This account was registered using ${user.register_by}. Please use appropriate login method.`,
      };
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
