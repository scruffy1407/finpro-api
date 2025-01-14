import { Router } from "express";
import { CompanyController } from "../controllers/company.controller";
import { AuthJwtMiddleware } from "../middlewares/auth.middleware";
import { authorizeJobTestOwner } from "../middlewares/authorizeJobTestOwner";
import { authorizeJobPostOwner } from "../middlewares/company/authorizeJobPostOwner";
import { PreSelectionTestController } from "../controllers/preSelectionTest.controller";
import { authorizeQuestionOwner } from "../middlewares/authorizeQuestionOwner";
import { CompanyAdminController } from "../controllers/companyadmin.controller";
import { InterviewController } from "../controllers/company/interview.controller";
import { JobDashListController } from "../controllers/jobCompanyDash.controller";
import {
	validateInterviewData,
	validateUpdateStatus,
} from "../middlewares/company/interview.middleware";

const companyRouter = Router();
const companyController = new CompanyController();
const companyAdminController = new CompanyAdminController();
const authJwtMiddleware = new AuthJwtMiddleware();
const preSelectionTestController = new PreSelectionTestController();
const jobDashListController = new JobDashListController();

const getPreSelectionTestsByCompanyController =
	new PreSelectionTestController();

const interviewController = new InterviewController();

companyRouter.post(
	"/job",
	authJwtMiddleware.authenticateJwt.bind(authJwtMiddleware),
	authJwtMiddleware.authorizeRole("company").bind(authJwtMiddleware),
	authJwtMiddleware.authorizeVerifyEmail.bind(authJwtMiddleware),
	companyController.createJob.bind(companyController)
);

//DELETING SOFT DELETE
companyRouter.put(
	"/delete/job/:jobId",
	authJwtMiddleware.authenticateJwt.bind(authJwtMiddleware), // Authentication middleware
	authJwtMiddleware.authorizeRole("company").bind(authJwtMiddleware), // Authorization middleware
	authJwtMiddleware.authorizeVerifyEmail.bind(authJwtMiddleware),
	companyController.deleteJob.bind(companyController) // Controller method
);

// PUT request to update a job post
companyRouter.put(
	"/job/:jobId",
	authJwtMiddleware.authenticateJwt.bind(authJwtMiddleware), // Authentication middleware
	authJwtMiddleware.authorizeRole("company").bind(authJwtMiddleware), // Authorization middleware
	authJwtMiddleware.authorizeVerifyEmail.bind(authJwtMiddleware),
	authorizeJobPostOwner, // Authorization middleware to check if the logged-in company owns the job post
	companyController.updateJob.bind(companyController) // Controller method
);

//Get the Job Post for Landing-Page
companyRouter.get(
	"/jobNewLp",
	companyController.jobNewLanding.bind(companyController)
);

//Get the Nearest Job Post for Landing-Page
companyRouter.get(
  "/nearest-job",
  companyController.nearestJobs.bind(companyController),
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
	authJwtMiddleware.authorizeVerifyEmail.bind(authJwtMiddleware),
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
	authJwtMiddleware.authorizeVerifyEmail.bind(authJwtMiddleware),
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
	authJwtMiddleware.authorizeVerifyEmail.bind(authJwtMiddleware),
	preSelectionTestController.updatePreSelectionTest.bind(
		preSelectionTestController
	)
);
companyRouter.put(
	"/softdeletepretest/:testId",
	authJwtMiddleware.authenticateJwt.bind(authJwtMiddleware),
	authJwtMiddleware.authorizeRole("company").bind(authJwtMiddleware),
	authJwtMiddleware.authorizeVerifyEmail.bind(authJwtMiddleware),
	preSelectionTestController.softDeletePreSelectionTest.bind(
		preSelectionTestController
	)
);

companyRouter.post(
	"/createtest/:testId",
	authJwtMiddleware.authenticateJwt.bind(authJwtMiddleware),
	authJwtMiddleware.authorizeRole("company").bind(authJwtMiddleware),
	authJwtMiddleware.authorizeVerifyEmail.bind(authJwtMiddleware),
	preSelectionTestController.createTest.bind(preSelectionTestController)
);

companyRouter.put(
	"/updatetest/:testId", // Adding both testId and questionId as route params
	authJwtMiddleware.authenticateJwt.bind(authJwtMiddleware),
	authJwtMiddleware.authorizeRole("company").bind(authJwtMiddleware),
	authJwtMiddleware.authorizeVerifyEmail.bind(authJwtMiddleware),
	// authorizeQuestionOwner, // Ensure the company owns the specific question before allowing updat
	preSelectionTestController.updateTest.bind(preSelectionTestController)
);

// Company Check Applicants - thom part
companyRouter.get(
	"/applicants",
	authJwtMiddleware.authenticateJwt.bind(authJwtMiddleware), // Authentication middleware
	authJwtMiddleware.authorizeRole("company").bind(authJwtMiddleware), // Authorization middleware
	companyAdminController.getCompanyApplicants.bind(companyAdminController)
);

companyRouter.get(
	"/jobpostinformation/:jobId",
	authJwtMiddleware.authenticateJwt.bind(authJwtMiddleware), // Authentication middleware
	authJwtMiddleware.authorizeRole("company").bind(authJwtMiddleware), // Authorization middleware
	companyAdminController.getJobPostInformation.bind(companyAdminController)
);

companyRouter.get(
	"/jobapplicants/:jobId",
	authJwtMiddleware.authenticateJwt.bind(authJwtMiddleware), // Authentication middleware
	authJwtMiddleware.authorizeRole("company").bind(authJwtMiddleware), // Authorization middleware
	companyAdminController.getJobApplicants.bind(companyAdminController)
);

companyRouter.get(
	"/applications/:id",
	authJwtMiddleware.authenticateJwt.bind(authJwtMiddleware), // Authentication middleware
	authJwtMiddleware.authorizeRole("company").bind(authJwtMiddleware), // Authorization middleware
	companyAdminController.getApplicationDetails.bind(companyAdminController)
);

companyRouter.put(
	"/applications/",
	authJwtMiddleware.authenticateJwt.bind(authJwtMiddleware), // Authentication middleware
	authJwtMiddleware.authorizeRole("company").bind(authJwtMiddleware), // Authorization middleware
	authJwtMiddleware.authorizeVerifyEmail.bind(authJwtMiddleware),
	companyAdminController.updateApplicationStatus.bind(companyAdminController)
);

//INTERVIEW
companyRouter.post(
	"/application/interview",
	authJwtMiddleware.authenticateJwt.bind(authJwtMiddleware), // Authentication middleware
	authJwtMiddleware.authorizeRole("company").bind(authJwtMiddleware), // Authorization middleware
	authJwtMiddleware.authorizeVerifyEmail.bind(authJwtMiddleware),
	validateInterviewData,
	interviewController.setInterviewSchedule.bind(interviewController)
);

// Get company for company list page
companyRouter.get(
	"/company",
	companyController.getCompanyList.bind(companyController)
);

companyRouter.put(
	"/application/interview",
	authJwtMiddleware.authenticateJwt.bind(authJwtMiddleware), // Authentication middleware
	authJwtMiddleware.authorizeVerifyEmail.bind(authJwtMiddleware),
	authJwtMiddleware.authorizeRole("company").bind(authJwtMiddleware), // Authorization middleware
	validateInterviewData,
	interviewController.editInterviewScedule.bind(interviewController)
);
companyRouter.put(
	"/application/status",
	authJwtMiddleware.authenticateJwt.bind(authJwtMiddleware), // Authentication middleware
	authJwtMiddleware.authorizeVerifyEmail.bind(authJwtMiddleware),
	authJwtMiddleware.authorizeRole("company").bind(authJwtMiddleware), // Authorization middleware
	validateUpdateStatus,
	interviewController.updateStatusInterview.bind(interviewController)
);

// PUBLIC DETAIL PAGE
companyRouter.get(
	"/company-detail/:companyId",
	companyController.getDetailCompanyPage.bind(companyController)
);

//JObDashView
companyRouter.get(
	"/companydashjob",
	authJwtMiddleware.authenticateJwt.bind(authJwtMiddleware), // Authentication middleware
	authJwtMiddleware.authorizeRole("company").bind(authJwtMiddleware), // Authorization middleware
	jobDashListController.getJobDashList.bind(jobDashListController)
);

//GET PRETEST BY ID RIZKY ADDTIION NEW
companyRouter.get(
	"/viewpretestbyId/:testId",
	authJwtMiddleware.authenticateJwt.bind(authJwtMiddleware),
	authJwtMiddleware.authorizeRole("company").bind(authJwtMiddleware),
	preSelectionTestController.getPreSelectionTestById.bind(
		preSelectionTestController
	)
);

companyRouter.get(
	"/viewpretestbyIdhead/:testId",
	authJwtMiddleware.authenticateJwt.bind(authJwtMiddleware),
	authJwtMiddleware.authorizeRole("jobhunter").bind(authJwtMiddleware),
	preSelectionTestController.getPreSelectionTestByIdHead.bind(
		preSelectionTestController
	)
);

//GET TEST BY PreTest ID RIZKY ADDTIION NEW
companyRouter.get(
	"/viewtestbyPretestId/:testId",
	authJwtMiddleware.authenticateJwt.bind(authJwtMiddleware),
	authJwtMiddleware.authorizeRole("company").bind(authJwtMiddleware),
	preSelectionTestController.getTestByPreTestId.bind(preSelectionTestController)
);

// Publish / Unpublish Job (Delete Job)
companyRouter.put(
	"/job/:jobId",
	authJwtMiddleware.authenticateJwt.bind(authJwtMiddleware),
	authJwtMiddleware.authorizeRole("company").bind(authJwtMiddleware),
	authJwtMiddleware.authorizeVerifyEmail.bind(authJwtMiddleware),
	companyAdminController.deleteJob.bind(companyController)
);

companyRouter.put(
	"/job/:jobId/status",
	authJwtMiddleware.authenticateJwt.bind(authJwtMiddleware),
	authJwtMiddleware.authorizeRole("company").bind(authJwtMiddleware),
	authJwtMiddleware.authorizeVerifyEmail.bind(authJwtMiddleware),
	companyAdminController.toggleJobStatus.bind(companyController)
);

companyRouter.get(
	"/jobstatus/:jobId",
	authJwtMiddleware.authenticateJwt.bind(authJwtMiddleware),
	authJwtMiddleware.authorizeRole("company").bind(authJwtMiddleware),
	companyAdminController.getJobStatus.bind(companyController)
);

companyRouter.get(
	"/viewpretestforselection",
	authJwtMiddleware.authenticateJwt.bind(authJwtMiddleware),
	authJwtMiddleware.authorizeRole("company").bind(authJwtMiddleware),
	preSelectionTestController.getPreSelectionTestsByCompanyControllerForSelection.bind(
		preSelectionTestController
	)
);

export default companyRouter;
