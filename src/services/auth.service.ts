import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { PrismaClient, RoleType } from "@prisma/client";
import { Auth } from "../models/models";
import { registerSchema } from "../validators/auth.validator";

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
}
