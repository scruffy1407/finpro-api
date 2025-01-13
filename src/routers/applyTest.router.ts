import { Router } from "express";
import { AuthJwtMiddleware } from "../middlewares/auth.middleware";
import { JobHunterTestController } from "../controllers/applytest.controller";
import { JobHunterService } from "../services/jobHunter/jobHunter.service";
import { AssessmentTestController } from "../controllers/assessmentTest.controller";
import { ApplyAssessmentTestController } from "../controllers/applyAssessmentTest.controller";

const applyTestRouter = Router();
const authJwtMiddleware = new AuthJwtMiddleware();
const jobHunterTestController = new JobHunterTestController();
const applyAssessmentTestController = new ApplyAssessmentTestController();

applyTestRouter.post(
	"/applytest/:jobId",
	authJwtMiddleware.authenticateJwt.bind(authJwtMiddleware),
	authJwtMiddleware.authorizeRole("jobhunter").bind(authJwtMiddleware),
	jobHunterTestController.joinPreSelectionTest.bind(jobHunterTestController)
); // Authorization middleware

applyTestRouter.get(
	"/getquestions/:jobId",
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

applyTestRouter.get(
	"/gettesttime/:applicationId",
	authJwtMiddleware.authenticateJwt.bind(authJwtMiddleware),
	authJwtMiddleware.authorizeRole("jobhunter").bind(authJwtMiddleware),
	jobHunterTestController.getTestTime.bind(jobHunterTestController)
);

applyTestRouter.post(
	"/updatescoreinterval",
	authJwtMiddleware.authenticateJwt.bind(authJwtMiddleware),
	authJwtMiddleware.authorizeRole("jobhunter").bind(authJwtMiddleware),
	jobHunterTestController.updateCompletionScore.bind(jobHunterTestController)
);

applyTestRouter.get(
	"/getassesstesttime/:skillAssessmentId",
	authJwtMiddleware.authenticateJwt.bind(authJwtMiddleware),
	authJwtMiddleware.authorizeRole("jobhunter").bind(authJwtMiddleware),
	applyAssessmentTestController.getSkillAssessmentTime.bind(
		applyAssessmentTestController
	)
);

applyTestRouter.get(
	"/getskillassessmentbyid/:skillAssessmentId",
	authJwtMiddleware.authenticateJwt.bind(authJwtMiddleware),
	authJwtMiddleware.authorizeRole("jobhunter").bind(authJwtMiddleware),
	applyAssessmentTestController.getSkillAssessmentById.bind(
		applyAssessmentTestController
	)
);

export default applyTestRouter;
