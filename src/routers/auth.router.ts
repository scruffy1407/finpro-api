import { Router } from "express";
import { AuthController } from "../controllers/auth.controller";
import { OauthController } from "../controllers/oauth.controller";
import { ResendEmailController } from "../controllers/resendemail.controller";
import { AuthJwtMiddleware } from "../middlewares/auth.middleware";
import passport from "passport";

const authRouter = Router();
const authController = new AuthController();
const oauthController = new OauthController();
const resendEmailController = new ResendEmailController();
const authMiddleware = new AuthJwtMiddleware();

// Reset Password Router
authRouter.get(
  "/request-reset",
  authController.requestResetPassword.bind(authController)
);
authRouter.get(
  "/verify-reset-token",
  authMiddleware.authenticateJwt.bind(authMiddleware),
  authController.verifyResetToken.bind(authController)
);
authRouter.put(
  "/reset-password",
  authMiddleware.authenticateJwt.bind(authMiddleware),
  authController.resetPassword.bind(authController)
);

// Verify Email Router
authRouter.get(
  "/verify-email",
  authMiddleware.authenticateJwt.bind(authMiddleware),
  authController.verifyEmail.bind(authController)
);

authRouter.post(
  "/resend-verification",
  resendEmailController.resendEmailVerification.bind(authController)
);

// Google Oauth Router
authRouter.get("/google/jobhunter", oauthController.googleJobhunter);
authRouter.get("/google/company", oauthController.googleCompany);
authRouter.get(
  "/google/callback",
  passport.authenticate("google", { failureRedirect: "/login" }),
  oauthController.googleCallback
);

// General Router
authRouter.post("/login", authController.login.bind(authController));
authRouter.post("/register", authController.register.bind(authController));
authRouter.post(
  "/refresh-token",
  authController.refreshToken.bind(authController)
);
authRouter.post(
  "/logout",
  authMiddleware.authenticateJwt.bind(authMiddleware),
  authController.logout.bind(authController)
);

export default authRouter;
