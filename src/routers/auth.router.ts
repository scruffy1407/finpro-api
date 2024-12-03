import { Router } from "express";
import { AuthController } from "../controllers/auth.controller";
import { AuthJwtMiddleware } from "../middlewares/auth.middleware";

const router = Router();
const authController = new AuthController();
const authMiddleware = new AuthJwtMiddleware();

router.get(
  "/request-reset",
  authController.requestResetPassword.bind(authController),
);
router.get(
  "/verify-reset-token",
  authMiddleware.authenticateJwt.bind(authMiddleware),
  authController.verifyResetToken.bind(authController),
);
router.put(
  "/reset-password",
  authMiddleware.authenticateJwt.bind(authMiddleware),
  authController.resetPassword.bind(authController),
);

export default router;
