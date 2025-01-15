import Router from "express";
import { CompanyController } from "../controllers/user.controller";
import { JobHunterController } from "../controllers/jobHunter/jobHunter.controller";
import { AuthJwtMiddleware } from "../middlewares/auth.middleware";
import { WorkingExpController } from "../controllers/jobHunter/workingExp.controller";
import { EducationController } from "../controllers/jobHunter/education.controller";
import { ReviewController } from "../controllers/jobHunter/review.controller";
import { PaymentController } from "../controllers/subscription/payment.controller";
import upload from "../middlewares/upload.middleware";
import environment from "dotenv";
import { CertificateController } from "../controllers/certificate/certificate.controller";

environment.config();

const router = Router();
const companyController = new CompanyController();
const jobHunterController = new JobHunterController();
const workingExpController = new WorkingExpController();
const educationController = new EducationController();
const authMiddleware = new AuthJwtMiddleware();
const reviewController = new ReviewController();
const paymentController = new PaymentController();
const certificateController = new CertificateController();
const WEBHOOK_MIDTRANS_URL = process.env.MIDTRANS_PAYMENT_WEB_HOOK_TOKEN;

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
router.get(
  "/company/get-data/:companyId",
  companyController.getSpecificCompany.bind(companyController),
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
  "/job-hunter/education/edit/:educationId",
  authMiddleware.authenticateJwt.bind(authMiddleware),
  authMiddleware.authorizeRole("jobhunter"),
  educationController.updateEducation.bind(educationController),
);
router.delete(
  "/job-hunter/education/delete/:educationId",
  authMiddleware.authenticateJwt.bind(authMiddleware),
  authMiddleware.authorizeRole("jobhunter"),
  educationController.deleteEducation.bind(educationController),
);

router.post(
  "/job-hunter/review",
  authMiddleware.authenticateJwt.bind(authMiddleware),
  authMiddleware.authorizeRole("jobhunter"),
  authMiddleware.authorizeVerifyEmail.bind(authMiddleware),
  reviewController.createReview.bind(reviewController),
);
router.get(
  "/job-hunter/validate/:jobId",
  authMiddleware.authenticateJwt.bind(authMiddleware),
  authMiddleware.authorizeRole("jobhunter"),
  jobHunterController.validateUserJoinJob.bind(jobHunterController),
);

// Subscription
router.post(
  "/job-hunter/subscription/:subscriptionId",
  authMiddleware.authenticateJwt.bind(authMiddleware),
  authMiddleware.authorizeRole("jobhunter"),
  authMiddleware.authorizeVerifyEmail.bind(authMiddleware),
  paymentController.createOrder.bind(paymentController),
);

router.post(
  `/midtrans/notify-complete`,
  paymentController.verifyOrderComplete.bind(paymentController),
);
router.post(
  "/job-hunter/verify-payment/:orderId",
  authMiddleware.authenticateJwt.bind(authMiddleware),
  authMiddleware.authorizeRole("jobhunter"),
  authMiddleware.authorizeVerifyEmail,
  paymentController.vefifyPayment.bind(paymentController),
);
router.get(
  "/job-hunter/payment",
  authMiddleware.authenticateJwt.bind(authMiddleware),
  authMiddleware.authorizeRole("jobhunter"),
  paymentController.getUserTransaction.bind(paymentController),
);

// verify Certificate
router.get(
  "/verify-certificate/:certificateCode",
  certificateController.verifyCertificate.bind(certificateController),
);

//
// router.get(
//   "/job-hunter/subscription/verify/:subscriptionId",
//   paymentController.verifyOrder.bind(paymentController),
// );

export default router;
