import { Router } from "express";
import { AuthJwtMiddleware } from "../middlewares/auth.middleware";
import { JobHunterTestController } from "../controllers/applytest.controller";
import { JobHunterService } from "../services/jobHunter/jobHunter.service";

const applyTestRouter = Router();
const authJwtMiddleware = new AuthJwtMiddleware();
const jobHunterTestController = new JobHunterTestController();

applyTestRouter.post(
	"/applytest",
	authJwtMiddleware.authenticateJwt.bind(authJwtMiddleware),
	authJwtMiddleware.authorizeRole("jobhunter").bind(authJwtMiddleware),
	jobHunterTestController.joinPreSelectionTest.bind(jobHunterTestController)
); // Authorization middleware

applyTestRouter.get(
	"/getquestions",
	authJwtMiddleware.authenticateJwt.bind(authJwtMiddleware),
	authJwtMiddleware.authorizeRole("jobhunter").bind(authJwtMiddleware),
	jobHunterTestController.getPreSelectionQuestions.bind(jobHunterTestController)
);

applyTestRouter.post(
	"/handlingtest",
	authJwtMiddleware.authenticateJwt.bind(authJwtMiddleware),
	authJwtMiddleware.authorizeRole("jobhunter").bind(authJwtMiddleware),
	jobHunterTestController.handlePreSelectionTest.bind(jobHunterTestController)
); // Authorization middleware

applyTestRouter.post(
	"/updateanswer",
	authJwtMiddleware.authenticateJwt.bind(authJwtMiddleware),
	authJwtMiddleware.authorizeRole("jobhunter").bind(authJwtMiddleware),
	jobHunterTestController.updateResult.bind(jobHunterTestController)
);

export default applyTestRouter;
