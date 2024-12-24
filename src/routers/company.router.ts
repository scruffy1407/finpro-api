import { Router } from "express";
import { CompanyController } from "../controllers/company.controller";
import { AuthJwtMiddleware } from "../middlewares/auth.middleware";
import { authorizeJobPostOwner } from "../middlewares/authorizeJobPostOwner";
import { PreSelectionTestController } from "../controllers/preSelectionTest.controller";
import { authorizeJobTestOwner } from "../middlewares/authorizeJobTestOwner";
import { authorizeQuestionOwner } from "../middlewares/authorizeQuestionOwner";
import { auth } from "googleapis/build/src/apis/abusiveexperiencereport";

const companyRouter = Router();
const companyController = new CompanyController();
const authJwtMiddleware = new AuthJwtMiddleware();
const preSelectionTestController = new PreSelectionTestController();
const getPreSelectionTestsByCompanyController =
	new PreSelectionTestController();

companyRouter.post(
	"/job",
	authJwtMiddleware.authenticateJwt.bind(authJwtMiddleware),
	authJwtMiddleware.authorizeRole("company").bind(authJwtMiddleware),
	companyController.createJob.bind(companyController)
);

companyRouter.delete(
	"/job/:jobId",
	authJwtMiddleware.authenticateJwt.bind(authJwtMiddleware), // Authentication middleware
	authJwtMiddleware.authorizeRole("company").bind(authJwtMiddleware), // Authorization middleware
	companyController.deleteJob.bind(companyController) // Controller method
);

// PUT request to update a job post
companyRouter.put(
	"/job/:jobId",
	authJwtMiddleware.authenticateJwt.bind(authJwtMiddleware), // Authentication middleware
	authJwtMiddleware.authorizeRole("company").bind(authJwtMiddleware), // Authorization middleware
	authorizeJobPostOwner, // Authorization middleware to check if the logged-in company owns the job post
	companyController.updateJob.bind(companyController) // Controller method
);

//Get the Job Post for Landing-Page
companyRouter.get(
	"/jobNewLp",
	companyController.jobNewLanding.bind(companyController)
);

//get the Job post for Job-List Page
companyRouter.get(
	"/jobPosts",
	companyController.getJobPosts.bind(companyController)
);

// Get Job Post Details (without authentication middleware)
companyRouter.get(
	"/jobDetails/:jobId", // The endpoint to fetch job post details by jobId
	companyController.getJobPostDetail.bind(companyController) // Directly bind the controller method
);

companyRouter.get(
	"/categories",
	companyController.getCategory.bind(companyController)
);

//Create Pre-Test

companyRouter.post(
	"/createpretest",
	authJwtMiddleware.authenticateJwt.bind(authJwtMiddleware),
	authJwtMiddleware.authorizeRole("company").bind(authJwtMiddleware),
	preSelectionTestController.createPreSelectionTest.bind(
		preSelectionTestController
	)
);

//View all Pre_test

companyRouter.get(
	"/viewpretest",
	authJwtMiddleware.authenticateJwt.bind(authJwtMiddleware),
	authJwtMiddleware.authorizeRole("company").bind(authJwtMiddleware),
	preSelectionTestController.getPreSelectionTestsByCompanyController.bind(
		preSelectionTestController
	)
);

//Delete PreTest
companyRouter.delete(
	"/deletepretest/:testId",
	authJwtMiddleware.authenticateJwt.bind(authJwtMiddleware),
	authJwtMiddleware.authorizeRole("company").bind(authJwtMiddleware),
	authorizeJobTestOwner,
	preSelectionTestController.deletePreSelectionTest.bind(
		preSelectionTestController
	)
);

//updating PreTest

companyRouter.put(
	"/updatepretest/:testId",
	authJwtMiddleware.authenticateJwt.bind(authJwtMiddleware),
	authJwtMiddleware.authorizeRole("company").bind(authJwtMiddleware),
	preSelectionTestController.updatePreSelectionTest.bind(
		preSelectionTestController
	)
);

companyRouter.post(
	"/createtest/:testId",
	authJwtMiddleware.authenticateJwt.bind(authJwtMiddleware),
	authJwtMiddleware.authorizeRole("company").bind(authJwtMiddleware),
	preSelectionTestController.createTest.bind(preSelectionTestController)
);

companyRouter.put(
	"/updatetest", // Adding both testId and questionId as route params
	authJwtMiddleware.authenticateJwt.bind(authJwtMiddleware),
	authJwtMiddleware.authorizeRole("company").bind(authJwtMiddleware),
	authorizeQuestionOwner, // Ensure the company owns the specific question before allowing updat
	preSelectionTestController.updateTest.bind(preSelectionTestController)
);

export default companyRouter;
