import { Router } from "express";
import { ApplyJobTestController } from "../controllers/applyJobTest.controller";
import multer from "multer";
import { AuthJwtMiddleware } from "../middlewares/auth.middleware";

const applyJobTestRouter = Router();
const upload = multer();
const authJwtMiddleware = new AuthJwtMiddleware();
const applyJobTestController = new ApplyJobTestController();

applyJobTestRouter.put(
  "/applyjobtest",
  authJwtMiddleware.authenticateJwt.bind(authJwtMiddleware), // Authenticate first
  authJwtMiddleware.authorizeRole("jobhunter").bind(authJwtMiddleware), // Then authorize
  authJwtMiddleware.authorizeVerifyEmail.bind(authJwtMiddleware),
  upload.single("resume"),
  applyJobTestController.editApplication.bind(applyJobTestController),
);

export default applyJobTestRouter;
