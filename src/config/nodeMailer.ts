import nodemailer, { Transporter } from "nodemailer";

// const OAuth2 = google.oauth2_v2.Oauth2;
import environment from "dotenv";

environment.config();

const mailOption = {
  from: "fareldeksano000@gmail.com", // sender address
  to: "fareltesting01@gmail.com", // list of receivers
  subject: "Hello ✔", // Subject line
  text: "Hello world?", // plain text body
  html: "<b>Hello world?</b>", // html body
};
