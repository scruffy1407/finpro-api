import express from "express";
import environment from "dotenv";
import cors from "cors";
import passport from "passport";
import session from "express-session";
import { ErrorHandlerMiddleware } from "./middlewares/error.handler.middleware";
import authRouter from "./routers/auth.router";
import applyJobRouter from "./routers/applyjob.router";
import "./services/oauth.service";
import userRouter from "./routers/user.router";
import companyRouter from "./routers/company.router";
import locationRouter from "./routers/location.router";
import cron from "node-cron";
import applyTestRouter from "./routers/applyTest.router";
import applyJobTestRouter from "./routers/applyJobTestRouter";

import { DropboxTokenManager } from "./utils/dropboxRefreshToken";

environment.config();

const app = express();

const PORT = process.env.SERVER_PORT_DEV;
const errorHandler = new ErrorHandlerMiddleware();

app.use(
  session({
    secret: process.env.SESSION_SECRET || "",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 1000 * 60 * 60 * 24 * 3,
    },
  }),
);

app.use(passport.initialize());
app.use(passport.session());

app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  }),
);

app.use(express.json());

const tokenManager = DropboxTokenManager.getInstance();

cron.schedule("*/5 * * * *", async () => {
	//EVERY 5 MINUTES REFRESH
	console.log("Refreshing Dropbox Access Token...");
	await tokenManager.refreshAccessToken();
  });

  (async () => {
	console.log("Initializing Dropbox Access Token...");
	await tokenManager.refreshAccessToken();
  })();


// AUTH
app.use("/auth", authRouter); // UNSECURE REQUEST WITHOUT TOKEN
app.use("/api/user/auth", authRouter); // SECURE REQUEST WITH TOKEN

// LOCATION
app.use("/api", locationRouter);

// USER
app.use("/api/user", userRouter); // SECURE REQUEST WITH TOKEN

// APPLY JOB
app.use("/applyjob", applyJobRouter);

// COMPANY & INTERVIEW
app.use("/api/company", companyRouter);

app.use ("/api/jobhunter" , applyTestRouter)

app.use ("/api/applyjobtest" , applyJobTestRouter)

app.use(errorHandler.errorHandler());

app.listen(PORT, () => {
  console.log(`Listening on Port : ${PORT}`);
});
