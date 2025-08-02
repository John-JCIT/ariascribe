import nodemailer from "nodemailer";
import { serverEnv } from "@/env";

let transporter: nodemailer.Transporter | null = null;

if (serverEnv.NEXT_PUBLIC_EMAIL_PROVIDER === "smtp") {
  console.log("[SMTP] Configuring Nodemailer transport for production SMTP...");
  transporter = nodemailer.createTransport({
    host: serverEnv.SMTP_HOST,
    port: serverEnv.SMTP_PORT,
    secure: serverEnv.SMTP_SECURE, // Use TLS by default, configurable via env
    auth: {
      user: serverEnv.SMTP_USER,
      pass: serverEnv.SMTP_PASS,
    },
  });

  // Verify connection configuration
  transporter.verify((error, success) => {
    if (error) {
      console.error(
        "[SMTP] Error verifying SMTP transport configuration:",
        error,
      );
    } else {
      console.log("[SMTP] Server is ready to take our messages");
    }
  });
}

export const smtpTransport = transporter;
