import express from "express";
import environment from "dotenv";
import cors from "cors";
import passport from "passport";
import session from "express-session";
import { ErrorHandlerMiddleware } from "./middlewares/error.handler.middleware";
import authRouter from "./routers/auth.router";
import "./services/oauth.service";

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
  })
);

app.use(passport.initialize());
app.use(passport.session());

app.use(
  cors({
    origin: "http://localhost:3000",
  }),
    methods: "GET, POST, PUT, DELETE",
    credentials: true,
  })
);

app.use(express.json());

app.use("/auth", authRouter);

app.use(errorHandler.errorHandler());

app.use("/api/auth", authRouter);

app.listen(PORT, () => {
  console.log(`Listening on Port : ${PORT}`);
});
