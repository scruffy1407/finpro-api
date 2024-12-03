import express from "express";
import environment from "dotenv";
import cors from "cors";
import { ErrorHandlerMiddleware } from "./middlewares/error.handler.middleware";
import authRouter from "./routers/auth.router";

environment.config();

const app = express();
const PORT = process.env.SERVER_PORT_DEV;
const errorHandler = new ErrorHandlerMiddleware();

app.use(
  cors({
    origin: "http://localhost:3000",
  }),
);

app.use(express.json());

app.use(errorHandler.errorHandler());

app.use("/api/auth", authRouter);

app.listen(PORT, () => {
  console.log(`Listening on Port : ${PORT}`);
});
