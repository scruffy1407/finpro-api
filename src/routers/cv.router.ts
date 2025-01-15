import { Router } from "express";
import { AuthJwtMiddleware } from "../middlewares/auth.middleware";
import { CVController } from "../controllers/cv.controller";

const authJwtMiddleware = new AuthJwtMiddleware();
const cvController = new CVController();
const cvRouter = Router();

cvRouter.get(
  "/cv",
  authJwtMiddleware.authenticateJwt.bind(authJwtMiddleware),
  authJwtMiddleware.authorizeRole("jobhunter"),
  cvController.getCVData.bind(cvController),
);

cvRouter.get(
  "/cvquota",
  authJwtMiddleware.authenticateJwt.bind(authJwtMiddleware),
  authJwtMiddleware.authorizeRole("jobhunter"),
  cvController.getCVQuota.bind(cvController),
);

cvRouter.post(
  "/cvgenerate",
  authJwtMiddleware.authenticateJwt.bind(authJwtMiddleware),
  authJwtMiddleware.authorizeRole("jobhunter"),
  authJwtMiddleware.authorizeVerifyEmail.bind(authJwtMiddleware),
  cvController.generateCV.bind(cvController),
);

export default cvRouter;
