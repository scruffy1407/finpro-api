import { Request, Response, NextFunction } from "express";
import { PrismaClient } from "@prisma/client";
import { AuthUtils } from "../utils/auth.utils";

const prisma = new PrismaClient();
const authUtils = new AuthUtils();

export const authorizeJobTestOwner = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      res.status(401).json({ error: "Not authenticated" });
      return;
    }
    const decodedToken = await authUtils.decodeToken(token);
    if (!decodedToken || !decodedToken.user_id) {
      res.status(401).json({ error: "Invalid token" });
      return;
    }

    const userId = decodedToken.user_id;
    const userCompany = await prisma.company.findFirst({
      where: { userId: userId },
      include: { jobPost: true },
    });

    if (!userCompany) {
      res
        .status(403)
        .json({ message: "User is not associated with any company" });
      return;
    }
    const { testId } = req.params;
    const preSelectionTest = await prisma.preSelectionTest.findFirst({
      where: { test_id: Number(testId) },
      include: { jobPost: true },
    });

    if (!preSelectionTest || preSelectionTest.jobPost.length === 0) {
      res.status(404).json({
        message: "Pre-selection test not found or no job posts associated",
      });
      return;
    }
    const isAuthorized = preSelectionTest.jobPost.some((jobPost) => {
      return jobPost.companyId === userCompany.company_id;
    });
    if (!isAuthorized) {
      res.status(403).json({
        message: "You are not authorized to delete this pre-selection test",
      });
      return;
    }
    next();
  } catch (error) {
    console.error(
      "Error in authorizeCompanyForPreSelectionTest middleware:",
      error
    );
    res.status(500).json({ message: "Internal server error" });
  }
};
