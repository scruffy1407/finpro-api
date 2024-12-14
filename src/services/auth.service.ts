import jwt, { JwtPayload } from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { PrismaClient, RoleType, RegisterBy } from "@prisma/client";
import { Auth } from "../models/models";
import { AuthUtils } from "../utils/auth.utils";
import {
  registerSchema,
  loginSchema,
  validatePassword,
} from "../validators/auth.validator";
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

    const resetToken = await this.AuthUtils.generateResetToken(
      validatedData.email,
    );

    // Create Base user
    try {
      baseUser = await this.prisma.baseUsers.create({
        data: {
          email: validatedData.email,
          phone_number: validatedData.phone_number,
          password: hashedPassword,
          role_type: role,
          verification_token: resetToken,
        },
      });
    } catch (error) {
      console.error("Error creating user", error);
      return {
        success: false,
        message: "Error occurred during registration.",
      };
    }

    if (role === RoleType.jobhunter) {
      const jobHunter = await this.createJobHunter(
        baseUser,
        validatedData.name,
      ); // create Job Hunter
      if (!jobHunter.success) {
        await this.prisma.baseUsers.delete({
          where: {
            user_id: baseUser.user_id,
          },
        });
        return {
          success: false,
          message: "Failed To Create Account",
        };
      }
    } else if (role === RoleType.company) {
      const company = await this.createCompany(baseUser, validatedData.name);
      if (!company.success) {
        await this.prisma.baseUsers.delete({
          where: {
            user_id: baseUser.user_id,
          },
        });
        return {
          success: false,
          message: "Failed To Create Account",
        };
      }
    } else if (role === RoleType.developer) {
      const developer = await this.createDeveloper(
        baseUser,
        validatedData.name,
      );
      if (!developer.success) {
        await this.prisma.baseUsers.delete({
          where: {
            user_id: baseUser.user_id,
          },
        });
        return {
          success: false,
          message: "Failed To Create Account",
        };
      }
    }
    return { success: true, user: baseUser };
  }
  async createJobHunter(baseUser: any, name: string) {
    try {
      const jobHunterSubscription = await this.createJobHunterSubscription();
      await this.prisma.jobHunter.create({
        data: {
          email: baseUser.email,
          name: name,
          password: baseUser.password,
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
      return {
        success: true,
        message: "Success create Job Hunter",
      };
    } catch (e) {
      return {
        success: false,
        message: "Failed to create Job Hunter",
      };
    }
  }

  async createCompany(baseUser: any, companyName: string) {
    try {
      await this.prisma.company.create({
        data: {
          company_name: companyName,
          baseUser: {
            connect: { user_id: baseUser.user_id },
          },
        },
      });
      return {
        success: true,
        message: "Company Successfully Created",
      };
    } catch (e) {
      return {
        success: false,
        message: "Failed to create company",
      };
    }
  }

  async createDeveloper(baseUser: any, developerName: string) {
    try {
      await this.prisma.developer.create({
        data: {
          developer_name: developerName,
          baseUser: {
            connect: { email: baseUser.email },
          },
        },
      });
      return {
        success: true,
        message: "Developer created",
      };
    } catch (e) {
      return {
        success: false,
        message: "Failed to create developer",
      };
    }
  }

  async createJobHunterSubscription() {
    return this.prisma.jobHunterSubscription.create({
      data: {
        subscription_active: false,
        subscriptionTable: {
          connect: { subscription_id: 1 }, // 1 = Free, 2 = Standard, 3 = Premium
        },
      },
    });
  }

  async requestResetPassword(email: string) {
    const getUser = await this.prisma.baseUsers.findUnique({
      where: { email },
    });

    if (!getUser) {
      return {
        success: false,
        user: null,
        message: "User not found",
      };
    }
    if (getUser.register_by === "google") {
      return {
        success: false,
        user: getUser,
        message: "GOOGLE",
      };
    }

    const resetToken = await this.AuthUtils.generateResetToken(email);
    await this.prisma.baseUsers.update({
      where: { email },
      data: { reset_password_token: resetToken },
    });

    return { success: true, user: getUser.email, resetToken };
  }

  async verifyResetToken(token: string) {
    const result = (await this.AuthUtils.decodeToken(token)) as JwtPayload;
    if (result) {
      const checkUserEmail = await this.prisma.baseUsers.findUnique({
        where: { email: result.email },
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
    }
  }

  async verifyEmail(token: string) {
    const result = (await this.AuthUtils.decodeToken(token)) as JwtPayload;
    if (result) {
      const checkUserEmail = await this.prisma.baseUsers.findUnique({
        where: { email: result.email },
      });
      if (
        checkUserEmail &&
        checkUserEmail.verification_token &&
        checkUserEmail.verification_token === token
      ) {
        await this.prisma.baseUsers.update({
          where: { email: result.email },
          data: { verification_token: null, verified: true },
        });
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
        message: `This account was registered using email. Please use the appropriate login method.`,
      };
    }

    if (!validatedData.user_role) {
      return { success: false, message: "Role type is required." };
    }

    if (user.role_type !== validatedData.user_role) {
      return {
        success: false,
        message: "Please logged in using the appropriate role.",
      };
    }

    const { accessToken, refreshToken } =
      await this.AuthUtils.generateLoginToken(user.user_id, user.role_type);

    await this.prisma.baseUsers.update({
      where: { email: validatedData.email },
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
        where: { user_id: decoded.id },
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
        { expiresIn: "3d" },
      );

      return { success: true, accessToken };
    } catch (error) {
      return { success: false, message: "Invalid refresh token" };
    }
  }

  async logout(user_id: number) {
    const user = await this.prisma.baseUsers.findUnique({
      where: { user_id },
    });

    if (!user) {
      return {
        success: false,
        message: "User is not found.",
      };
    }

    await this.prisma.baseUsers.update({
      where: { user_id },
      data: {
        access_token: null,
        refresh_token: null,
      },
    });

    return { success: true, message: "Logged out successfully." };
  }

  async refreshAccessToken(
    user_id: number,
    user_role: RoleType,
    token: string,
  ) {
    // Decode refresh token to get id
    // check if the user of the token is available in data base
    // if the user available, check whether the token is match
    // generate a new access token

    // Check user is available based on id
    const user = await this.prisma.baseUsers.findUnique({
      where: {
        user_id: user_id,
      },
    });
    if (!user) {
      return {
        success: false,
        message: "User not found",
      };
    }

    // Check if the refresh token is match wiyh the user
    if (user.refresh_token !== token) {
      return {
        success: false,
        message: "Invalid Refresh Token",
      };
    }

    // generate new token
    const accessToken = await this.AuthUtils.generateAccessToken(
      user_id,
      user_role,
    );

    await this.prisma.baseUsers.update({
      where: {
        user_id: user_id,
      },
      data: {
        access_token: accessToken as string,
      },
    });

    return { success: true, data: accessToken };
  }

  // /api/auth/validate-token
  async validateToken(user_id: number, role_type: RoleType) {
    // Check user is available based on id
    console.log(role_type);
    const user = await this.prisma.baseUsers.findUnique({
      where: {
        user_id: user_id,
      },
      include: {
        company: role_type === RoleType.company ? true : false,
        jobHunter: role_type === RoleType.jobhunter ? true : false,
      },
    });
    if (!user) {
      return {
        success: false,
        message: "User not found",
      };
    } else {
      return {
        success: true,
        data: user,
      };
    }
  }
}
