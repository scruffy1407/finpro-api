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

    // if (role === RoleType.developer) {
    //   if (!bearerToken || bearerToken !== DEVELOPER_ACCESS_TOKEN) {
    //     return {
    //       success: false,
    //       message: "Unauthorized to create a developer role.",
    //     };
    //   }
    // }

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
      );
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
          photo:
            "https://res.cloudinary.com/dgnce1xzd/image/upload/v1736786905/dummyProfile_bbwzus.png",
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
          logo: "https://res.cloudinary.com/dgnce1xzd/image/upload/v1734781490/orwyxtvz6a1zzwa6wk4j.png",
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
          connect: { subscription_id: 1 },
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

    let company_id = undefined;

    let user = null;

    if (validatedData.user_role === RoleType.jobhunter) {
      user = await this.prisma.baseUsers.findUnique({
        where: { email: validatedData.email },
        include: {
          jobHunter: {
            select: {
              jobHunterSubscription: true,
              job_hunter_id: true,
              photo: true,
              name: true,
            },
          },
        },
      });
    } else if (validatedData.user_role === RoleType.company) {
      user = await this.prisma.baseUsers.findUnique({
        where: { email: validatedData.email },
        include: {
          company: true,
        },
      });
    } else if (validatedData.user_role === RoleType.developer) {
      user = await this.prisma.baseUsers.findUnique({
        where: { email: validatedData.email },
        include: {
          developers: true,
        },
      });
    }

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
      await this.AuthUtils.generateLoginToken(
        user.user_id,
        user.role_type,
        user.verified,
        company_id,
      );

    await this.prisma.baseUsers.update({
      where: { email: validatedData.email },
      data: {
        access_token: accessToken,
        refresh_token: refreshToken,
      },
    });

    return { success: true, accessToken, refreshToken, user };
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
    if (user.refresh_token !== token) {
      return {
        success: false,
        message: "Invalid Refresh Token",
      };
    }

    const accessToken = await this.AuthUtils.generateAccessToken(
      user_id,
      user_role,
      user.verified,
    );

    await this.prisma.baseUsers.update({
      where: {
        user_id: user_id,
      },
      data: {
        access_token: accessToken as string,
      },
    });

    return { success: true, accessToken };
  }

  async validateToken(user_id: number, role_type: RoleType) {
    if (role_type === RoleType.company) {
      const user = await this.prisma.baseUsers.findUnique({
        where: {
          user_id: user_id,
        },
        include: {
          company: true,
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

    if (role_type === RoleType.jobhunter) {
      const user = await this.prisma.baseUsers.findUnique({
        where: {
          user_id: user_id,
        },
        include: {
          jobHunter: {
            select: {
              jobHunterSubscription: true,
              job_hunter_id: true,
              photo: true,
              name: true,
            },
          },
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

    if (role_type === RoleType.developer) {
      const user = await this.prisma.baseUsers.findUnique({
        where: {
          user_id: user_id,
        },
        include: {
          developers: true,
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
    return {
      success: false,
      message: "error",
    };
  }

  async reVerifyUser(userId: number) {
    const user = await this.prisma.baseUsers.findUnique({
      where: {
        user_id: userId,
      },
    });
    if (!user) {
      return {
        success: false,
        message: "User not found",
      };
    }

    if (user.verified) {
      return {
        success: false,
        message: "User already verified",
      };
    }

    const resetToken = await this.AuthUtils.generateResetToken(user.email);

    await this.prisma.baseUsers.update({
      where: {
        user_id: userId,
      },
      data: {
        verification_token: resetToken,
      },
    });

    return {
      success: true,
      user: {
        email: user.email,
        verification_token: resetToken,
      },
    };
  }
}
