import { Router } from "express";
import { AuthJwtMiddleware } from "../middlewares/auth.middleware";
import { AssessmentTestController } from "../controllers/assessmentTest.controller";
import { ApplyAssessmentTestController } from "../controllers/applyAssessmentTest.controller";
import upload from "../middlewares/upload.middleware";

const devRouter = Router();
const authJwtMiddleware = new AuthJwtMiddleware();
const assessmentTestController = new AssessmentTestController();
const applyAssessmentTestController = new ApplyAssessmentTestController();

devRouter.post(
	"/createassessment",
	authJwtMiddleware.authenticateJwt.bind(authJwtMiddleware),
	authJwtMiddleware.authorizeRole("developer").bind(authJwtMiddleware),
	upload.single("image"),
	assessmentTestController.createAssessmentTest.bind(assessmentTestController)
);

devRouter.put(
	"/delete/assessmenttest/:skill_assessment_id",
	authJwtMiddleware.authenticateJwt.bind(authJwtMiddleware),
	authJwtMiddleware.authorizeRole("developer").bind(authJwtMiddleware),
	assessmentTestController.deleteAssessmentTest.bind(assessmentTestController)
);

devRouter.put(
	"/update/assessmenttest",
	authJwtMiddleware.authenticateJwt.bind(authJwtMiddleware),
	authJwtMiddleware.authorizeRole("developer").bind(authJwtMiddleware),
	upload.single("image"),
	assessmentTestController.updateSkillAssessment.bind(assessmentTestController)
);

devRouter.get(
	"/getassessmenttest",
	assessmentTestController.getSkillAssessmentList.bind(assessmentTestController)
);

devRouter.post(
	"/createquest/:skillAssessmentId",
	authJwtMiddleware.authenticateJwt.bind(authJwtMiddleware),
	authJwtMiddleware.authorizeRole("developer").bind(authJwtMiddleware),
	assessmentTestController.createQuestions.bind(assessmentTestController)
);

devRouter.put(
	"/editquest",
	authJwtMiddleware.authenticateJwt.bind(authJwtMiddleware),
	authJwtMiddleware.authorizeRole("developer").bind(authJwtMiddleware),
	assessmentTestController.updateSkillAssessmentQuestion.bind(
		assessmentTestController
	)
);

devRouter.post(
	"/joinassessment",
	authJwtMiddleware.authenticateJwt.bind(authJwtMiddleware),
	authJwtMiddleware.authorizeRole("jobhunter").bind(authJwtMiddleware),
	applyAssessmentTestController.joinAssessmentTest.bind(
		applyAssessmentTestController
	)
);

devRouter.get(
	"/getassessmentquest",
	authJwtMiddleware.authenticateJwt.bind(authJwtMiddleware),
	authJwtMiddleware.authorizeRole("jobhunter").bind(authJwtMiddleware),
	applyAssessmentTestController.getAssessmentQuestions.bind(
		applyAssessmentTestController
	)
);

devRouter.put(
	"/updateassessmentanswer",
	authJwtMiddleware.authenticateJwt.bind(authJwtMiddleware),
	authJwtMiddleware.authorizeRole("jobhunter").bind(authJwtMiddleware),
	applyAssessmentTestController.updateResult.bind(applyAssessmentTestController)
);

export default devRouter;
