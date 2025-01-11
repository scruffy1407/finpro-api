import { PrismaClient } from "@prisma/client";
import { formatDate } from "../../utils/dateFormatter";

export class CertificateService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  async getCertificateData(userId: number) {
    try {
      return await this.prisma.baseUsers.findUnique({
        where: { user_id: userId },
        include: {
          jobHunter: {
            include: {
              skillAssessmentCompletion: {
                where: {
                  completion_status: 'pass',
                },
                include: {
                  skillAssessment: true,
                  certificate: true,
                },
              },
            },
          },
        },
      });
    } catch (error) {
      console.error("Error fetching user data:", error);
      return { success: false, message: "Failed to fetch user data." };
    }
  }

  async verifyCertficate(certificateCode: string) {
    try {
      const certificate = await this.prisma.certificate.findUnique({
        where: {
          certificate_unique_id: certificateCode,
        },
        include: {
          skillAssessmentCompletion: true,
        },
      });

      if (!certificate) {
        return { success: true, code: "NO_EXIST" };
      }

      const jobHunter = await this.prisma.jobHunter.findUnique({
        where: {
          job_hunter_id: certificate.skillAssessmentCompletion.jobHunterId,
        },
      });

      return {
        success: true,
        code: "OK",
        data: {
          name: jobHunter?.name,
          testName: certificate.certificate_name,
          issueDate: formatDate(certificate.certificate_date),
        },
      };
    } catch (e) {
      return { success: false, message: "Failed to Get Certificate" };
    }
  }
}
