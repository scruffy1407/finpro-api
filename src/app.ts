import express, { Request, Response } from "express";
import environment from "dotenv";
import cors from "cors";
import { ErrorHandlerMiddleware } from "./middlewares/error.handler.middleware";
import sendEmail from "./config/nodeMailer";

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

app.use("/reset-password", (req: Request, res: Response) => {
  sendEmail({
    subject: "Test",
    text: "I am sending an email from nodemailer!",
    to: "fareldeksano000@gmail.com",
    from: process.env.GMAIL_USERNAME,
  })
    .then(() => {
      res.status(200).send({
        status: 200,
        message: "Email sent successfully",
      });
    })
    .catch((err) => {
      res.status(500).send({
        status: 500,
        message: err.message,
      });
      console.log(err);
    });
});

app.listen(PORT, () => {
  console.log(`Listening on Port : ${PORT}`);
});
