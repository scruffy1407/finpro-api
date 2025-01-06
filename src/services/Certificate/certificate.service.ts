import { PrismaClient } from "@prisma/client";
import { formatDate } from "../../utils/dateFormatter";

export class CertificateService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  async verifyCertficate(certificateCode: string) {
    console.log(certificateCode);
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
      return { success: false, message: "failed to  get certificate" };
    }
  }
}
