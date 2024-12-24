import nodemailer, { Transporter } from "nodemailer";
import path from "path";
import environment from "dotenv";
import ejs from "ejs";

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

export async function sendEmailVerification(
  email: string,
  verificationToken: string
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
