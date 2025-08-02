import nodemailer from "nodemailer";
import { serverEnv } from "@/env";

export const getNodemailerAppTransport = () => {
  if (serverEnv.NEXT_PUBLIC_EMAIL_PROVIDER !== "nodemailer-app") {
    return null;
  }

  return nodemailer.createTransport({
    host: "127.0.0.1", // Explicitly use IPv4 localhost
    port: serverEnv.NODEMAILER_LOCAL_PORT, // Use port from env
    auth: {
      user: serverEnv.NODEMAILER_LOCAL_USER, // Use local user
      pass: serverEnv.NODEMAILER_LOCAL_PASS, // Use local password
    },
  });
};
