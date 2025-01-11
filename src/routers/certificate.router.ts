import { Router } from "express";
import { AuthJwtMiddleware } from "../middlewares/auth.middleware";
import { CertificateController } from "../controllers/certificate/certificate.controller";

const authJwtMiddleware = new AuthJwtMiddleware();
const certificateController = new CertificateController();
const certificateRouter = Router();

certificateRouter.get(
  "/certificate",
  authJwtMiddleware.authenticateJwt.bind(authJwtMiddleware),
  authJwtMiddleware.authorizeRole("jobhunter"),
  certificateController.getCertificateData.bind(certificateController)
);

export default certificateRouter;
