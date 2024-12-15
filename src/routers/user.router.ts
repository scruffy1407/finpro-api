import Router from "express";
import { CompanyController } from "../controllers/user.controller";
import { JobHunterController } from "../controllers/jobHunter/jobHunter.controller";
import { AuthJwtMiddleware } from "../middlewares/auth.middleware";
import { WorkingExpController } from "../controllers/jobHunter/workingExp.controller";
import { EducationController } from "../controllers/jobHunter/education.controller";
import upload from "../middlewares/upload.middleware";

const router = Router();
const companyController = new CompanyController();
const jobHunterController = new JobHunterController();
const workingExpController = new WorkingExpController();
const educationController = new EducationController();
const authMiddleware = new AuthJwtMiddleware();

// USER COMPANY
router.get(
  "/company",
  authMiddleware.authenticateJwt.bind(authMiddleware),
  authMiddleware.authorizeRole("company"),
  companyController.getCompanyDetail.bind(companyController),
);
router.put(
  "/company/edit-profile",
  authMiddleware.authenticateJwt.bind(authMiddleware),
  authMiddleware.authorizeRole("company"),
  companyController.updateCompanyDetail.bind(companyController),
);
router.put(
  "/company/edit-image",
  authMiddleware.authenticateJwt.bind(authMiddleware),
  authMiddleware.authorizeRole("company"),
  upload.single("image"),
  companyController.updatecompanyImage.bind(companyController),
);
router.get(
  "/company/search-company",
  companyController.searchCompany.bind(companyController),
);

// USER JOB HUNTER
router.get(
  "/job-hunter",
  authMiddleware.authenticateJwt.bind(authMiddleware),
  authMiddleware.authorizeRole("jobhunter"),
  jobHunterController.getUserDetail.bind(jobHunterController),
);
router.put(
  "/job-hunter/edit-profile",
  authMiddleware.authenticateJwt.bind(authMiddleware),
  authMiddleware.authorizeRole("jobhunter"),
  jobHunterController.updateUserProfile.bind(jobHunterController),
);
router.put(
  "/job-hunter/edit-image",
  authMiddleware.authenticateJwt.bind(authMiddleware),
  authMiddleware.authorizeRole("jobhunter"),
  upload.single("image"),
  jobHunterController.updateUserImage.bind(jobHunterController),
);

// USER JOB HUNTER --- WORKING EXPERIENCE
router.get(
  "/job-hunter/work-experience",
  authMiddleware.authenticateJwt.bind(authMiddleware),
  authMiddleware.authorizeRole("jobhunter"),
  workingExpController.getListWorkingExp.bind(workingExpController),
);
router.post(
  "/job-hunter/work-experience/create-new",
  authMiddleware.authenticateJwt.bind(authMiddleware),
  authMiddleware.authorizeRole("jobhunter"),
  workingExpController.createWorkingExp.bind(workingExpController),
);
router.put(
  "/job-hunter/work-experience/edit/:workExpId",
  authMiddleware.authenticateJwt.bind(authMiddleware),
  authMiddleware.authorizeRole("jobhunter"),
  workingExpController.editWorkingExperience.bind(workingExpController),
);
router.delete(
  "/job-hunter/work-experience/delete/:workExpId",
  authMiddleware.authenticateJwt.bind(authMiddleware),
  authMiddleware.authorizeRole("jobhunter"),
  workingExpController.deleteWorkingExp.bind(workingExpController),
);

// USER JOB HUNTER --- EDUCATION
router.get(
  "/job-hunter/education",
  authMiddleware.authenticateJwt.bind(authMiddleware),
  authMiddleware.authorizeRole("jobhunter"),
  educationController.getListEducation.bind(educationController),
);
router.post(
  "/job-hunter/education/create-new",
  authMiddleware.authenticateJwt.bind(authMiddleware),
  authMiddleware.authorizeRole("jobhunter"),
  educationController.createEducation.bind(educationController),
);
router.put(
  "/job-hunter/education/:educationId",
  authMiddleware.authenticateJwt.bind(authMiddleware),
  authMiddleware.authorizeRole("jobhunter"),
  educationController.updateEducation.bind(educationController),
);
router.delete(
  "/job-hunter/delete/:educationId",
  authMiddleware.authenticateJwt.bind(authMiddleware),
  authMiddleware.authorizeRole("jobhunter"),
  educationController.deleteEducation.bind(educationController),
);

export default router;
