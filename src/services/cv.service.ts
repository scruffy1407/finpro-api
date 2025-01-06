import { PrismaClient } from "@prisma/client";

export class CVService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  async getCVData(userId: number) {
    try {
      return await this.prisma.baseUsers.findUnique({
        where: { user_id: userId },
        include: {
          jobHunter: {
            include: {
              jobHunterSubscription: true,
              workExperience: true,
              education: true,
            },
          },
        },
      });
    } catch (error) {
      console.error("Error fetching user data:", error);
      return { success: false, message: "Failed to fetch user data." };
    }
  }

  async canGenerateCV(
    userId: number
  ): Promise<{ canGenerate: boolean; remaining: number }> {
    try {
      const user = await this.prisma.jobHunter.findUnique({
        where: { userId },
        include: {
          jobHunterSubscription: { include: { subscriptionTable: true } },
        },
      });

      if (!user) {
        console.error(`User is not found`);
        return { canGenerate: false, remaining: 0 };
      }

      const subscriptionActive =
        user.jobHunterSubscription?.subscription_active ?? false;

      if (!subscriptionActive) {
        return {
          canGenerate: false,
          remaining: 0,
        };
      }

      const subscriptionType =
        user.jobHunterSubscription?.subscriptionTable?.subscription_type;
      const cvGeneratedCount = user.cv_generated_count ?? 0;

      let limit = 0;

      switch (subscriptionType) {
        case "free":
          limit = 0;
          break;
        case "standard":
          limit = 2;
          break;
        case "professional":
          limit = Infinity;
          break;
        default:
          limit = 0;
      }

      const remaining =
        limit === Infinity ? Infinity : Math.max(0, limit - cvGeneratedCount);

      return {
        canGenerate: remaining > 0,
        remaining,
      };
    } catch (error) {
      console.error("Error checking CV generation eligibility:", error);
      return { canGenerate: false, remaining: 0 };
    }
  }

  async incrementCVCount(userId: number): Promise<void> {
    try {
      await this.prisma.jobHunter.update({
        where: { userId },
        data: { cv_generated_count: { increment: 1 } },
      });
    } catch (error) {
      console.error("Error incrementing CV generation count:", error);
    }
  }
}
