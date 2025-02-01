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
import subscriptionRoutes from "./routers/subscription.router";
import certificateRouter from "./routers/certificate.router";
import cvRouter from "./routers/cv.router";
import devRouter from "./routers/dev.router";
import analyticsRouter from "./routers/analytics.router";
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

const allowedOrigins = [
  "https://pathway-job.vercel.app",
  "http://localhost:3000",
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

app.options("*", (req, res) => {
  res.header("Access-Control-Allow-Origin", "https://pathway-job.vercel.app");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.sendStatus(200);
});

app.use(express.json());

const tokenManager = DropboxTokenManager.getInstance();

app.use("/subscriptions", subscriptionRoutes);

cron.schedule("*/5 * * * *", async () => {
  await tokenManager.refreshAccessToken();
});

(async () => {
  console.log("Initializing Dropbox Access Token...");
  await tokenManager.refreshAccessToken();
})();

// AUTH
app.use("/auth", authRouter);
app.use("/api/user/auth", authRouter);

// LOCATION
app.use("/api", locationRouter);

// USER
app.use("/api/user", userRouter);

// APPLY JOB
app.use("/applyjob", applyJobRouter);

// CV Generate
app.use("/api/cv", cvRouter);

// Certificate Generate
app.use("/api/certificate", certificateRouter);

// COMPANY & INTERVIEW
app.use("/api/company", companyRouter);

app.use("/api/jobhunter", applyTestRouter);

app.use("/api/applyjobtest", applyJobTestRouter);

//Developer
app.use("/api/dev", devRouter);

app.use(errorHandler.errorHandler());

// Analytics
app.use("/api/dev/analytics", analyticsRouter);

app.listen(PORT, () => {
  console.log(`Listening on Port : ${PORT}`);
});
