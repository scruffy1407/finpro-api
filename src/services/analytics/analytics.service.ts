import { PrismaClient } from "@prisma/client";

export class AnalyticsService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  // Get User Demographics - Age, Gender, Locations
  async getUserGender() {
    return await this.prisma.jobHunter.groupBy({
      by: ["gender"],
      _count: {
        _all: true,
      },
    });
  }

  async getUserLocationProvince() {
    return await this.prisma.jobHunter.groupBy({
      by: ["location_province"],
      _count: {
        _all: true,
      },
    });
  }

  async getUserLocationCity() {
    return await this.prisma.jobHunter.groupBy({
      by: ["location_city"],
      _count: {
        _all: true,
      },
    });
  }

  async getUserAgeGroups() {
    const users = await this.prisma.jobHunter.findMany({
      select: { dob: true },
    });

    const ageGroupLabels = [
      { label: "18 to 24", min: 18, max: 24 },
      { label: "25 to 34", min: 25, max: 34 },
      { label: "35 to 44", min: 35, max: 44 },
      { label: "45 to 54", min: 45, max: 54 },
      { label: "55 to 64", min: 55, max: 64 },
      { label: "65 or over", min: 65, max: Infinity },
    ];

    const currentYear = new Date().getFullYear();
    const ageGroups: Record<string, number> = {};

    users.forEach((user) => {
      if (user.dob) {
        const age = currentYear - new Date(user.dob).getFullYear();
        const group = ageGroupLabels.find(
          ({ min, max }) => age >= min && age <= max
        );
        if (group) {
          ageGroups[group.label] = (ageGroups[group.label] || 0) + 1;
        }
      }
    });
    return ageGroups;
  }

  // Salary Trends
  async getSalaryTrends() {
    const jobPosts = await this.prisma.jobPost.findMany({
      where: {
        salary_show: true,
      },
      include: {
        category: true,
        company: {
          include: {
            city: {
              include: {
                province: true,
              },
            },
          },
        },
      },
    });
    interface CategoryGroup {
      category: string;
      salaryMinTotal: number;
      salaryMaxTotal: number;
      count: number;
      locations: Set<string>;
    }

    const groupedByCategory = jobPosts.reduce<Record<string, CategoryGroup>>(
      (acc, post) => {
        const categoryName = post.category.category_name;
        if (!acc[categoryName]) {
          acc[categoryName] = {
            category: categoryName,
            salaryMinTotal: 0,
            salaryMaxTotal: 0,
            count: 0,
            locations: new Set(),
          };
        }
        acc[categoryName].salaryMinTotal += post.salary_min.toNumber();
        if (post.salary_max !== null) {
          acc[categoryName].salaryMaxTotal += post.salary_max.toNumber();
        }
        acc[categoryName].count += 1;

        const location = `${post.company.city?.name}, ${post.company.city?.province?.name}`;
        acc[categoryName].locations.add(location);
        return acc;
      },
      {}
    );

    const salaryTrends = Object.values(groupedByCategory).map(
      (categoryGroup: CategoryGroup) => ({
        category: categoryGroup.category,
        salaryMin: (categoryGroup.salaryMinTotal / categoryGroup.count).toFixed(
          2
        ),
        salaryMax: (categoryGroup.salaryMaxTotal / categoryGroup.count).toFixed(
          2
        ),
        location: Array.from(categoryGroup.locations).join(", "),
      })
    );
    return salaryTrends;
  }

  // Applicant Interest
  async getPopularCategory() {
    const categories = await this.prisma.jobPost.groupBy({
      by: ["categoryId"],
      where: {
        applyJob: {
          some: {},
        },
      },
      _count: {
        _all: true,
      },
    });

    const categoryDetails = await Promise.all(
      categories.map(async (category) => {
        const details = await this.prisma.category.findUnique({
          where: { category_id: category.categoryId },
          select: { category_name: true },
        });
        return {
          categoryName: details?.category_name,
          jobPostCount: category._count._all,
        };
      })
    );

    return categoryDetails;
  }

  // Additional Data - Total Users, Jobs, Subscription
  async getAdditionalData() {
    const totalUsers = await this.prisma.baseUsers.count();
    const totalJobs = await this.prisma.jobPost.count();
    const activeSubscriptions = await this.prisma.jobHunterSubscription.count({
      where: {
        subscription_active: true,
      },
    });

    return {
      totalUsers,
      totalJobs,
      activeSubscriptions,
    };
  }
}
