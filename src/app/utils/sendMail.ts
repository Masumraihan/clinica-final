import nodemailer from "nodemailer";
import config from "../config";
import AppError from "../errors/AppError";
import httpStatus from "http-status";

type TEmail = {
  to: string;
  html: string;
  subject: string;
};

export const sendMail = async ({ to, html, subject }: TEmail) => {
  console.log({ user: config.email.user, pass: config.email.pass });

  try {
    const transporter = nodemailer.createTransport({
      // @ts-ignore
      host: "smtp.gmail.com",
      port: config.email.port,
      secure: config.NODE_ENV !== "development",
      auth: {
        user: config.email.user,
        pass: config.email.pass,
      },
    }) as any;

    // send mail with defined transport object
    const info = await transporter.sendMail({
      from: config.email.user, // sender address
      to, // list of receivers
      subject,
      html,
    });
    return info;
  } catch (error: any) {
    throw new AppError(httpStatus.BAD_REQUEST, error.message);
  }
};
