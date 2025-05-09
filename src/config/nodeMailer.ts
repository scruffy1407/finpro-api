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
  const href = `${process.env.CLIENT_URL}/auth/reset-password?token=${resetToken}`;
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
  const html = await ejs.renderFile(templatePath, {
    interviewEmail,
  });
  const mailOption = {
    from: "fareldeksano000@gmail.com", // sender address
    to: interviewEmail.email, // list of receivers
    subject: `PATHWAY | Interview Invitation for ${interviewEmail.jobTitle} at ${interviewEmail.companyName}`, // Subject line
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
  const html = await ejs.renderFile(templatePath, {
    interviewEmail,
  });

  const mailOption = {
    from: "fareldeksano000@gmail.com", // sender address
    to: interviewEmail.email, // list of receivers
    subject: `PATHWAY | Update Interview Invitation ${interviewEmail.jobTitle} at ${interviewEmail.companyName}`, // Subject line
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
  const href = `${process.env.CLIENT_URL}/auth/register/verify-email/${verificationToken}`;
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

export async function sendApplicationStatusEmail(
  email: string,
  emailData: {
    name: string;
    applicationStatus: string;
    jobName: string;
    jobTitle: string;
  },
) {
  const templatePath = path.join(__dirname, "/views/", "applicationStatus.ejs");
  const formattedData = {
    ...emailData,
    applicationStatus:
      emailData.applicationStatus.charAt(0).toUpperCase() +
      emailData.applicationStatus.slice(1),
  };
  const html = await ejs.renderFile(templatePath, {
    emailData: formattedData,
  });

  const mailOptions = {
    from: "fareldeksano000@gmail.com",
    to: email,
    subject: `Job Application Status Update - ${formattedData.applicationStatus}`,
    html,
  };
  await transporter.sendMail(mailOptions);
}
