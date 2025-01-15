// import { Router } from "express";
// import { AuthJwtMiddleware } from "../middlewares/auth.middleware";
// import { PreSelectionTestController } from "../controllers/preSelectionTest.controller";

// const companyRouter = Router();
// const authJwtMiddleware = new AuthJwtMiddleware();
// const preSelectionTestController = new PreSelectionTestController();

// companyRouter.post(
// 	"/createpretest",
// 	authJwtMiddleware.authenticateJwt.bind(authJwtMiddleware),
// 	authJwtMiddleware.authorizeRole("company").bind(authJwtMiddleware),
// 	preSelectionTestController.createPreSelectionTest.bind(
// 		preSelectionTestController
// 	)
// );

// export default companyRouter
