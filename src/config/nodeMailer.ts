import nodemailer, { Transporter } from "nodemailer";
import path from "path";
import environment from "dotenv";
import ejs from "ejs";
import {
  DataReminder,
  InterviewEmail,
  PaymentComplete,
} from "../models/models";

environment.config();

const transporter: Transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS,
  },
});

export async function sendEmailReset(email: string, resetToken: string) {
  const templatePath = path.join(__dirname, "/views/", "resetPassword.ejs");
  const href = `http://localhost:3000/auth/reset-password?token=${resetToken}`;
  const html = await ejs.renderFile(templatePath, {
    email: email,
    linkReset: href,
  });

  const mailOption = {
    from: "fareldeksano000@gmail.com", // sender address
    to: email, // list of receivers
    subject: "Reset your Ipsum Password", // Subject line
    text: "Hello world?", // plain text body
    html: html,
  };
  await transporter.sendMail(mailOption);
}

export async function jobAccept(email: string) {}

export async function sendInterviewEmail(interviewEmail: InterviewEmail) {
  const templatePath = path.join(__dirname, "/views/", "interviewEmail.ejs");
  const html = await ejs.renderFile(templatePath, {});
  const mailOption = {
    from: "fareldeksano000@gmail.com", // sender address
    to: interviewEmail.email, // list of receivers
    subject: `YEYY! You got interview the interview for ${interviewEmail.jobTitle} at ${interviewEmail.companyName}`, // Subject line
    text: "Hello world?", // plain text body
    html: html,
  };
  await transporter.sendMail(mailOption);
}

export async function resendInterviewEmail(interviewEmail: InterviewEmail) {
  const templatePath = path.join(
    __dirname,
    "/views/",
    "resendInterviewEmail.ejs",
  );
  const html = await ejs.renderFile(templatePath, {});
  const mailOption = {
    from: "fareldeksano000@gmail.com", // sender address
    to: interviewEmail.email, // list of receivers
    subject: `UPDATE | Update schedule interview for ${interviewEmail.jobTitle} at ${interviewEmail.companyName}`, // Subject line
    text: "Hello world?", // plain text body
    html: html,
  };
  await transporter.sendMail(mailOption);
}

export async function sendEmailVerification(
  email: string,
  verificationToken: string,
) {
  const templatePath = path.join(__dirname, "/views/", "verifyEmail.ejs");
  const href = `http://localhost:3000/auth/register/verify-email/${verificationToken}`;
  const html = await ejs.renderFile(templatePath, {
    email: email,
    linkVerify: href,
  });

  const mailOption = {
    from: "fareldeksano000@gmail.com",
    to: email,
    subject: "Verify Your Pathway Account",
    text: "Hello world?",
    html: html,
  };
  await transporter.sendMail(mailOption);
}

export async function sendEmailPaymentComplete(
  email: string,
  dataOrder: PaymentComplete,
) {
  console.log("SENDING EMAIL");
  console.log("NODEMAILER", email);
  console.log("NODEMAILER", dataOrder);

  const templatePath = path.join(
    __dirname,
    "/views/",
    "PaymentCompleteEmail.ejs",
  );

  const html = await ejs.renderFile(templatePath, {
    dataOrder,
  });

  const mailOption = {
    from: "fareldeksano000@gmail.com",
    to: email,
    subject: `${dataOrder.orderId} | Payment Successfully`,
    text: "Hello world?",
    html: html,
  };
  await transporter.sendMail(mailOption);
}

export async function sendEmailSubsReminder(
  email: string,
  emailData: DataReminder,
) {
  console.log("SENDING EMAIL");
  console.log("NODEMAILER", email);
  console.log("NODEMAILER", emailData);

  const templatePath = path.join(__dirname, "/views/", "subsReminderEmail.ejs");

  const html = await ejs.renderFile(templatePath, {
    emailData,
  });

  const mailOption = {
    from: "fareldeksano000@gmail.com",
    to: email,
    subject: `Pathway | Subscription Reminder`,
    text: "Hello world?",
    html: html,
  };
  await transporter.sendMail(mailOption);
}

export async function sendEmailSubExpired(
  email: string,
  emailData: DataReminder,
) {
  console.log("SENDING EMAIL");
  console.log("NODEMAILER", email);
  console.log("NODEMAILER", emailData);

  const templatePath = path.join(__dirname, "/views/", "subsExpiredEmail.ejs");

  const html = await ejs.renderFile(templatePath, {
    emailData,
  });

  const mailOption = {
    from: "fareldeksano000@gmail.com",
    to: email,
    subject: `Pathway | Your Subscription already expired`,
    text: "Hello world?",
    html: html,
  };
  await transporter.sendMail(mailOption);
}
