import { Router } from "express";
import { AuthController } from "../controllers/auth.controller";
import { OauthController } from "../controllers/oauth.controller";
import passport from "passport";
import { AuthJwtMiddleware } from "../middlewares/auth.middleware";

const authrouter = Router();
const authController = new AuthController();
const authMiddleware = new AuthJwtMiddleware();
const oauthController = new OauthController();

authrouter.get(
  "/request-reset",
  authController.requestResetPassword.bind(authController),
);
authrouter.get(
  "/verify-reset-token",
  authMiddleware.authenticateJwt.bind(authMiddleware),
  authController.verifyResetToken.bind(authController),
);
authrouter.put(
  "/reset-password",
  authMiddleware.authenticateJwt.bind(authMiddleware),
  authController.resetPassword.bind(authController),
);

authRouter.get("/google/jobhunter", oauthController.googleJobhunter);
authRouter.get("/google/company", oauthController.googleCompany);
authRouter.get(
  "/google/callback",
  passport.authenticate("google", { failureRedirect: "/login" }),
  oauthController.googleCallback
);
authRouter.post("/login", authController.login.bind(authController));
authRouter.post("/register", authController.register.bind(authController));
authRouter.post(
  "/refresh-token",
  authController.refreshToken.bind(authController)
);

export default authRouter;
