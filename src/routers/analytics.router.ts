import { Router } from "express";
import { AuthJwtMiddleware } from "../middlewares/auth.middleware";
import { AnalyticsController } from "../controllers/analytics/analytics.controller";

const authMiddleware = new AuthJwtMiddleware();
const analyticsController = new AnalyticsController();
const analyticsRouter = Router();

analyticsRouter.get(
  "/gender",
  authMiddleware.authenticateJwt.bind(authMiddleware),
  authMiddleware.authorizeRole("developer").bind(authMiddleware),
  analyticsController.getUserGender.bind(analyticsController)
);
analyticsRouter.get(
  "/locationprovince",
  authMiddleware.authenticateJwt.bind(authMiddleware),
  authMiddleware.authorizeRole("developer").bind(authMiddleware),
  analyticsController.getUserLocationProvince.bind(analyticsController)
);
analyticsRouter.get(
  "/locationcity",
  authMiddleware.authenticateJwt.bind(authMiddleware),
  authMiddleware.authorizeRole("developer").bind(authMiddleware),
  analyticsController.getUserLocationCity.bind(analyticsController)
);
analyticsRouter.get(
  "/agegroups",
  authMiddleware.authenticateJwt.bind(authMiddleware),
  authMiddleware.authorizeRole("developer").bind(authMiddleware),
  analyticsController.getUserAgeGroups.bind(analyticsController)
);
analyticsRouter.get(
  "/salarytrends",
  authMiddleware.authenticateJwt.bind(authMiddleware),
  authMiddleware.authorizeRole("developer").bind(authMiddleware),
  analyticsController.getSalaryTrends.bind(analyticsController)
);
analyticsRouter.get(
  "/category",
  authMiddleware.authenticateJwt.bind(authMiddleware),
  authMiddleware.authorizeRole("developer").bind(authMiddleware),
  analyticsController.getPopularCategory.bind(analyticsController)
);
analyticsRouter.get(
  "/additionaldata",
  authMiddleware.authenticateJwt.bind(authMiddleware),
  authMiddleware.authorizeRole("developer").bind(authMiddleware),
  analyticsController.getAdditionalData.bind(analyticsController)
);

export default analyticsRouter;
