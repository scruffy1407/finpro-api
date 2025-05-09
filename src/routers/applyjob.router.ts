import { Router } from "express";
import applyJobController from "../controllers/applyjob.controller";
import multer from "multer";
import { AuthJwtMiddleware } from "../middlewares/auth.middleware";

const applyJobRouter = Router();
const upload = multer();
const authMiddleware = new AuthJwtMiddleware();

applyJobRouter.post(
  "/apply",
  authMiddleware.authenticateJwt.bind(authMiddleware),
  authMiddleware.authorizeRole("jobhunter").bind(authMiddleware),
  authMiddleware.authorizeVerifyEmail.bind(authMiddleware),
  upload.single("resume"),
  applyJobController.applyJob,
);

applyJobRouter.get(
  "/applications/:jobHunterId",
  authMiddleware.authenticateJwt.bind(authMiddleware),
  applyJobController.getAllApplications,
);

// Get User application
applyJobRouter.get(
  "/user-application",
  authMiddleware.authenticateJwt.bind(authMiddleware),
  authMiddleware.authorizeRole("jobhunter").bind(authMiddleware),
  applyJobController.getUserApplication.bind(applyJobController),
);

// Bookmark Remove
applyJobRouter.post(
  "/bookmark",
  authMiddleware.authenticateJwt.bind(authMiddleware),
  applyJobController.createBookmark,
);
applyJobRouter.post(
  "/bookmark/remove",
  authMiddleware.authenticateJwt.bind(authMiddleware),
  applyJobController.removeBookmarks,
);
applyJobRouter.get(
  "/bookmark",
  authMiddleware.authenticateJwt.bind(authMiddleware),
  applyJobController.getAllBookmarks,
);
applyJobRouter.get(
  "/verify-apply",
  authMiddleware.authenticateJwt.bind(authMiddleware),
  applyJobController.verifyApplyJob.bind(applyJobController),
);
applyJobRouter.get(
  "/applicant-detail",
  authMiddleware.authenticateJwt.bind(authMiddleware),
  authMiddleware.authorizeRole("company").bind(authMiddleware),
  applyJobController.getDetailApplicant.bind(applyJobController),
);

export default applyJobRouter;
