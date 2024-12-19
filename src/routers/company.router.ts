import { Router } from "express";
import { CompanyController } from "../controllers/company.controller";
import { AuthJwtMiddleware } from "../middlewares/auth.middleware";
import { authorizeJobPostOwner } from "../middlewares/authorizeJobPostOwner";
import { CompanyAdminController } from "../controllers/companyadmin.controller";

const companyRouter = Router();
const companyController = new CompanyController();
const companyAdminController = new CompanyAdminController();
const authJwtMiddleware = new AuthJwtMiddleware();

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

// Company Check Applicants
companyRouter.get(
  "/applicants",
  authJwtMiddleware.authenticateJwt.bind(authJwtMiddleware), // Authentication middleware
  authJwtMiddleware.authorizeRole("company").bind(authJwtMiddleware), // Authorization middleware
  companyAdminController.getApplicants.bind(companyAdminController)
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
  companyAdminController.updateApplicationStatus.bind(companyAdminController)
);

export default companyRouter;