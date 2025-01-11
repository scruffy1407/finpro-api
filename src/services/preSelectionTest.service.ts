// services/preSelectionTestService.ts
import { PrismaClient, JobPost, PreSelectionTest } from "@prisma/client";
import { AuthUtils } from "../utils/auth.utils";

export class PreSelectionTestService {
  private prisma: PrismaClient;
  private authUtils: AuthUtils;

  constructor() {
    this.prisma = new PrismaClient();
    this.authUtils = new AuthUtils();
  }
  async createPreSelectionTest({
    testName,
    image = "",
    passingGrade = 85,
    duration = 30,
    token,
  }: {
    testName: string;
    image?: string;
    passingGrade?: number;
    duration?: number;
    token: string;
  }): Promise<{ preSelectionTest: PreSelectionTest } | string> {
    try {
      const decodedToken = await this.authUtils.decodeToken(token);
      if (!decodedToken || !decodedToken.user_id) {
        return "Invalid token or user ID not found";
      }
      const userId = decodedToken.user_id;
      const company = await this.prisma.company.findFirst({
        where: { userId: userId },
        select: { company_id: true },
      });

      const companyId = company?.company_id;

      if (!company) {
        return "User is not associated with a company";
      }
      const preSelectionTest = await this.prisma.preSelectionTest.create({
        data: {
          test_name: testName,
          image: image || "",
          passing_grade: passingGrade,
          duration: duration,
          companyId: companyId,
        },
      });
      return { preSelectionTest };
    } catch (error) {
      const err = error as Error;
      return `Error: ${err.message}`;
    }
  }

  async deletePreSelectionTest(
    testId: number
  ): Promise<PreSelectionTest | string> {
    try {
      const preSelectionTest = await this.prisma.preSelectionTest.findUnique({
        where: { test_id: testId },
        include: { jobPost: true },
      });

      if (!preSelectionTest) {
        return "Pre-selection test not found";
      }

      if (preSelectionTest.deleted === true) {
        return "The selected Pre-Selection test is already deleted";
      }
      const nonFailedOrRejectedApplicants =
        await this.prisma.application.findMany({
          where: {
            jobPost: {
              preSelectionTestId: testId,
            },
            application_status: {
              notIn: ["failed", "rejected"],
            },
          },
        });
      if (nonFailedOrRejectedApplicants.length > 0) {
        return "Some applicants have not failed or rejected status, cannot delete";
      }
      const updatedPreSelectionTest = await this.prisma.preSelectionTest.update(
        {
          where: { test_id: testId },
          data: {
            deleted: true,
          },
        }
      );
      return updatedPreSelectionTest;
    } catch (error) {
      const err = error as Error;
      return `Error: ${err.message}`;
    }
  }

  async updatePreSelectionTest({
    testId,
    jobPostId,
    testName,
    image,
    passingGrade,
    duration,
    token,
  }: {
    testId: number;
    testName?: string;
    image?: string;
    passingGrade?: number;
    duration?: number;
    jobPostId?: number;
    token: string;
  }): Promise<PreSelectionTest | string> {
    try {
      const decodedToken = await this.authUtils.decodeToken(token);
      if (!decodedToken || !decodedToken.user_id) {
        return "invalid token or user ID not found";
      }

      const userId = decodedToken?.user_id;

      const company = await this.prisma.company.findFirst({
        where: { userId: userId },
        select: { company_id: true },
      });

      if (!company) {
        return "User is not associated with a company";
      }

      const preSelectionTest = await this.prisma.preSelectionTest.findUnique({
        where: { test_id: testId },
        include: { jobPost: true },
      });

      if (!preSelectionTest) {
        return "PreSelection test not found";
      }
      if (jobPostId) {
        const jobPost = await this.prisma.jobPost.findUnique({
          where: { job_id: jobPostId },
          include: { company: true },
        });

        if (!jobPost) {
          return "Job post not found";
        }

        if (jobPost.company.company_id !== company.company_id) {
          return "You are not authorized to associate this job post with the pre-selection test";
        }
        await this.prisma.preSelectionTest.update({
          where: { test_id: testId },
          data: {
            jobPost: {
              connect: {
                job_id: jobPostId,
              },
            },
          },
        });
      }

      const updateData: {
        test_name?: string;
        image?: string;
        passing_grade?: number;
        duration?: number;
      } = {};

      if (testName) {
        updateData.test_name = testName;
      }

      if (image !== undefined) {
        updateData.image = image;
      }

      if (passingGrade !== undefined) {
        updateData.passing_grade = passingGrade;
      }
      if (duration !== undefined) {
        updateData.duration = duration;
      }

      const updatedPreSelectionTest = await this.prisma.preSelectionTest.update(
        {
          where: { test_id: testId },
          data: updateData,
        }
      );

      return updatedPreSelectionTest;
    } catch (error) {
      const err = error as Error;
      return `Error is ${err.message}`;
    }
  }

  async createTest(testId: number, questions: Array<any>): Promise<any> {
    try {
      const preSelectionTest = await this.prisma.preSelectionTest.findUnique({
        where: { test_id: testId },
        include: { testQuestions: true },
      });

      if (!preSelectionTest) {
        return "Pre-selection test not found.";
      }

      const existingQuestionsCount = preSelectionTest.testQuestions.length;
      if (existingQuestionsCount >= 25) {
        return "This Pre-selection Test already has 25 questions. You cannot add more.";
      }
      const remainingQuestions = 25 - existingQuestionsCount;

      if (questions.length > remainingQuestions) {
        return `You can only add ${remainingQuestions} more questions.`;
      }
      for (let i = 0; i < questions.length; i++) {
        const { answer_1, answer_2, answer_3, answer_4, correct_answer } =
          questions[i];

        if (
          ![answer_1, answer_2, answer_3, answer_4].includes(correct_answer)
        ) {
          return `Correct answer must be one of the provided options for question ${i + 1}.`;
        }
      }

      const createdQuestions = await this.prisma.testQuestion.createMany({
        data: questions.map((question, index) => ({
          testId,
          question_number: index + 1,
          question: question.question,
          answer_1: question.answer_1,
          answer_2: question.answer_2,
          answer_3: question.answer_3,
          answer_4: question.answer_4,
          correct_answer: question.correct_answer,
        })),
      });

      return createdQuestions;
    } catch (error) {
      const err = error as Error;
      return `Error creating a questions ${err.message}`;
    }
  }
  async updateTestQuestions({
    preSelectionTestId,
    questions,
    token,
  }: {
    preSelectionTestId: number;
    questions: {
      questionId: number;
      question: string;
      answer_1: string;
      answer_2: string;
      answer_3: string;
      answer_4: string;
      correct_answer: string;
    }[];
    token: string;
  }) {
    try {
      const preSelectionTest = await this.prisma.preSelectionTest.findUnique({
        where: { test_id: preSelectionTestId },
      });

      if (!preSelectionTest) {
        return { status: "error", message: "Pre-selection test not found." };
      }
      const updatePromises = [];
      for (const question of questions) {
        const {
          questionId,
          question: questionText,
          answer_1,
          answer_2,
          answer_3,
          answer_4,
          correct_answer,
        } = question;
        if (!questionId) {
          updatePromises.push(Promise.reject("Invalid questionId."));
          continue;
        }
        const questionToUpdate = await this.prisma.testQuestion.findUnique({
          where: { question_id: questionId },
        });

        if (!questionToUpdate) {
          updatePromises.push(
            Promise.reject(`Question with ID ${questionId} not found.`)
          );
          continue;
        }
        if (
          ![answer_1, answer_2, answer_3, answer_4].includes(correct_answer)
        ) {
          updatePromises.push(
            Promise.reject(
              `Correct answer must be one of the provided options for question ID ${questionId}.`
            )
          );
          continue;
        }
        updatePromises.push(
          this.prisma.testQuestion.update({
            where: { question_id: questionId },
            data: {
              question: questionText,
              answer_1,
              answer_2,
              answer_3,
              answer_4,
              correct_answer,
            },
          })
        );
      }
      const updateResults = await Promise.allSettled(updatePromises);
      const errors = updateResults
        .filter((result) => result.status === "rejected")
        .map((result) => (result as PromiseRejectedResult).reason);

      if (errors.length > 0) {
        return {
          status: "error",
          message: `Error(s) occurred: ${errors.join(", ")}`,
        };
      }
      return {
        status: "success",
        message: "All questions updated successfully.",
      };
    } catch (error) {
      const err = error as Error;
      return { status: "error", message: `Error: ${err.message}` };
    }
  }

  async getExistingQuestionsCount(testId: number): Promise<number> {
    try {
      const preSelectionTest = await this.prisma.preSelectionTest.findUnique({
        where: { test_id: testId },
        include: { testQuestions: true },
      });

      if (!preSelectionTest) {
        return 0;
      }
      return preSelectionTest.testQuestions.length;
    } catch (error) {
      console.error("Error getting existing questions count:", error);
      throw new Error("Error fetching existing questions count.");
    }
  }

  async getPreSelectionTestsByCompany(token: string): Promise<any> {
    try {
      const decodedToken = await this.authUtils.decodeToken(token);
      if (!decodedToken || !decodedToken.user_id) {
        return { error: "Invalid token or company ID not found" };
      }
      const userId = decodedToken.user_id;
      const company = await this.prisma.company.findFirst({
        where: { userId: userId },
        select: { company_id: true },
      });

      if (!company) {
        return { error: "Company not found for the given user" };
      }
      const companyId = company.company_id;
      const preSelectionTests = await this.prisma.preSelectionTest.findMany({
        where: {
          companyId: companyId,
          deleted: false,
        },
        select: {
          test_id: true,
          test_name: true,
          image: true,
          passing_grade: true,
          duration: true,
          created_at: true,
          _count: {
            select: {
              testQuestions: true,
            },
          },
        },
      });

      return preSelectionTests;
    } catch (error) {
      const err = error as Error;
      return { error: "Error fetching pre-selection tests: " + err.message };
    }
  }

  async getPreSelectionTestById(token: string, testId: number): Promise<any> {
    try {
      const decodedToken = await this.authUtils.decodeToken(token);
      if (!decodedToken || !decodedToken.user_id) {
        return { error: "Invalid token or company ID not found" };
      }
      const userId = decodedToken.user_id;
      const company = await this.prisma.company.findFirst({
        where: { userId: userId },
        select: { company_id: true },
      });

      if (!company) {
        return { error: "Company not found for the given user" };
      }
      const companyId = company.company_id;
      const preSelectionTest = await this.prisma.preSelectionTest.findUnique({
        where: {
          test_id: testId,
        },
        select: {
          test_id: true,
          passing_grade: true,
          test_name: true,
          duration: true,
          companyId: true,
        },
      });
      if (!preSelectionTest) {
        return { error: "Pre-selection test not found" };
      }

      if (preSelectionTest.companyId !== companyId) {
        return { error: "You do not have access to this test" };
      }
      return {
        test_id: preSelectionTest.test_id,
        test_name: preSelectionTest.test_name,
        passing_grade: preSelectionTest.passing_grade,
        duration: preSelectionTest.duration,
      };
    } catch (error) {
      const err = error as Error;
      return { error: "Error fetching pre-selection test: " + err.message };
    }
  }

  async getTestByPreTestId(testId: number, token: string): Promise<any> {
    try {
      const decodedToken = await this.authUtils.decodeToken(token);
      if (!decodedToken || !decodedToken.user_id) {
        return { error: "Invalid token or company ID not found" };
      }
      const userId = decodedToken.user_id;
      const company = await this.prisma.company.findFirst({
        where: { userId: userId },
        select: { company_id: true },
      });

      if (!company) {
        return { error: "Company not found for the given user" };
      }
      const companyId = company.company_id;
      const preSelectionTest = await this.prisma.preSelectionTest.findUnique({
        where: { test_id: testId },
        include: {
          testQuestions: {
            orderBy: {
              question_id: "asc",
            },
          },
        },
      });
      if (!preSelectionTest) {
        return "Pre-selection test not found.";
      }
      if (preSelectionTest.companyId !== companyId) {
        return "You are not authorized to access this test.";
      }
      return preSelectionTest;
    } catch (error) {
      const err = error as Error;
      return `Error fetching pre-selection test: ${err.message}`;
    }
  }

  async softDeletePreSelectionTest(
    testId: number
  ): Promise<PreSelectionTest | string> {
    try {
      const preSelectionTest = await this.prisma.preSelectionTest.findUnique({
        where: { test_id: testId },
        include: { jobPost: true },
      });

      if (!preSelectionTest) {
        return "Pre-selection test not found";
      }

      if (preSelectionTest.deleted === true) {
        return "The selected Pre-Selection test is already deleted";
      }
      const nonFailedOrRejectedApplicants =
        await this.prisma.application.findMany({
          where: {
            jobPost: {
              preSelectionTestId: testId,
            },
            application_status: {
              notIn: ["failed", "rejected"],
            },
          },
        });
      if (nonFailedOrRejectedApplicants.length > 0) {
        return "Some applicants have not failed or rejected status, cannot delete";
      }
      const updatedPreSelectionTest = await this.prisma.preSelectionTest.update(
        {
          where: { test_id: testId },
          data: {
            deleted: true,
          },
        }
      );
      return updatedPreSelectionTest;
    } catch (error) {
      const err = error as Error;
      return `Error: ${err.message}`;
    }
  }

  async getPreSelectionTestByIdHead(
    token: string,
    testId: number
  ): Promise<any> {
    try {
      const decodedToken = await this.authUtils.decodeToken(token);
      if (!decodedToken || !decodedToken.user_id) {
        return { error: "Invalid token or user ID not found" };
      }
      const userId = decodedToken.user_id;
      const preSelectionTest = await this.prisma.preSelectionTest.findUnique({
        where: {
          test_id: testId,
        },
        select: {
          test_id: true,
          passing_grade: true,
          test_name: true,
          duration: true,
          jobPost: {
            select: {
              job_id: true,
            },
          },
        },
      });

      if (!preSelectionTest) {
        return { error: "Pre-selection test not found" };
      }
      const jobIds = preSelectionTest.jobPost.map((job) => job.job_id);
      return {
        test_id: preSelectionTest.test_id,
        test_name: preSelectionTest.test_name,
        passing_grade: preSelectionTest.passing_grade,
        duration: preSelectionTest.duration,
        job_id: jobIds,
      };
    } catch (error) {
      const err = error as Error;
      return { error: "Error fetching pre-selection test: " + err.message };
    }
  }
}
