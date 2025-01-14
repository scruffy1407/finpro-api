import { PrismaClient } from "@prisma/client";
export class DeveloperService {
  private prisma: PrismaClient;
  constructor() {
    this.prisma = new PrismaClient();
  }

  async getUsers(
    limit: number = 15,
    page: number = 1,
    userId: number,
    subscriptionId: number,
  ) {
    try {
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
      if (user.role_type !== "developer") {
        return {
          success: false,
          message: "Role type not allowed",
        };
      }

      const whereConditions: any = {};

      console.log("SUBS FILTER", subscriptionId);

      if (subscriptionId) {
        const checkSubs = await this.prisma.subscriptionTable.findUnique({
          where: {
            subscription_id: subscriptionId,
          },
        });

        if (!checkSubs) {
          return {
            success: false,
            message: "Subscription does not exist",
          };
        }
        whereConditions.jobHunterSubscription = {
          is: { subscriptionId: subscriptionId }, // Use "some" for list relations
        };
      }

      const totalCount = await this.prisma.jobHunter.count({
        where: whereConditions,
      });
      const totalPages = Math.ceil(totalCount / limit);
      if (page > totalPages) {
        return {
          success: true,
          data: {
            listUser: [],
            currentPage: page,
            totalPages: totalPages,
            totalCount,
          },
          message: "No more user are available.",
        };
      }

      const skip = (page - 1) * limit;

      const listUser = await this.prisma.jobHunter.findMany({
        where: whereConditions,
        skip: skip,
        take: limit,
        select: {
          name: true,
          email: true,
          gender: true,
          photo: true,
          jobHunterSubscription: true,
        },
      });

      return {
        success: true,
        data: {
          listUser,
          totalCount,
          totalPages,
          currentPage: page,
        },
      };
    } catch (e) {
      console.log(e);
      return {
        success: false,
        message: e,
      };
    }
  }
}
