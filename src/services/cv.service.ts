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
  ): Promise<{ canGenerate: boolean }> {
    try {
      const user = await this.prisma.jobHunter.findUnique({
        where: { userId },
        include: {
          jobHunterSubscription: { include: { subscriptionTable: true } },
        },
      });
  
      if (!user) {
        console.error(`User not found`);
        return { canGenerate: false };
      }
  
      const subscriptionId = user.jobHunterSubscription?.subscriptionId ?? null;
      
      if (subscriptionId === 1) {
        return { canGenerate: false };
      }

      return { canGenerate: true };
    } catch (error) {
      console.error("Error checking CV generation eligibility:", error);
      return { canGenerate: false };
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
