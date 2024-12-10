import Router from "express";
import { UserController } from "../controllers/user.controller";
import { AuthJwtMiddleware } from "../middlewares/auth.middleware";

const router = Router();
const userController = new UserController();
const authMiddleware = new AuthJwtMiddleware();

// USER COMPANY
router.get(
  "/company",
  authMiddleware.authenticateJwt.bind(authMiddleware),
  userController.getCompanyDetail.bind(userController),
);
router.put(
  "/company/edit-information",
  authMiddleware.authenticateJwt.bind(authMiddleware),
  userController.updateCompanyDetail.bind(userController),
);
router.put(
  "/company/edit-image",
  authMiddleware.authenticateJwt.bind(authMiddleware),
  userController.updateCompanyDetail.bind(userController),
);

export default router;
