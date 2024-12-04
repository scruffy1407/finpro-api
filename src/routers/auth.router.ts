import { Router } from "express";
import { AuthController } from "../controllers/auth.controller";
import { OauthController } from "../controllers/oauth.controller";
import passport from "passport";

const authRouter = Router();
const authController = new AuthController();
const oauthController = new OauthController();

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
