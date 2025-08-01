import type { ReactElement } from "react";
import path from "path";
import previewEmail from "preview-email";
import { render } from "@react-email/render";
import { serverEnv } from "@/env";
import { IS_DEV } from "@/config/dev-prod";
import { clientEnv } from "@/env/client";
import { sendEmailSmtp } from "./send-email-smtp";
import { sendEmailResend } from "./send-email-resend";
import { sendEmailPlunk } from "./send-email-plunk";
import { getNodemailerAppTransport } from "./transports/nodemailer-local-transport";

export interface EmailPayload {
  to: string | string[];
  subject: string;
  from: string;
  react?: ReactElement;
  text?: string;
}

interface EmailBase {
  subject: string;
  react?: ReactElement;
  text?: string;
}
interface SingleEmail extends EmailBase {
  to: string;
}
interface BatchEmail extends EmailBase {
  to: string[];
}
type EmailOptions = SingleEmail | BatchEmail;

/**
 * Consolidated email sending function.
 * Sends email based on the EMAIL_PROVIDER environment variable.
 * In development, it also previews the email in a browser tab if enabled.
 * @param options - Email details (single or multiple recipients).
 * @returns Promise<void> Resolves on success, throws an Error on failure.
 * @throws Error on configuration issues or sending failures from handlers.
 */
export const sendEmail = async (options: EmailOptions): Promise<void> => {
  const { to, subject, react, text } = options;
  const from = serverEnv.EMAIL_FROM;

  // 1. Basic Validations
  if (!react && !text) {
    console.error(
      "[Email Router] Email must have either 'react' or 'text' content.",
    );
    throw new Error("Email content missing");
  }
  if (!from) {
    console.error("[Email Router] EMAIL_FROM environment variable is not set.");
    throw new Error("Sender email address is not configured");
  }

  const recipients = Array.isArray(to) ? to : [to];
  const html = react ? await render(react) : undefined;

  // 2. Development Preview (if enabled and in dev mode)
  if (
    IS_DEV &&
    clientEnv.NEXT_PUBLIC_EMAIL_ENABLE_EMAIL_PREVIEW &&
    recipients.length > 0
  ) {
    console.log("[Email DEV Preview] Generating email preview...");
    const firstRecipient = recipients[0]!;
    const messageForPreview = { from, to: firstRecipient, subject, html, text };
    try {
      const templatePath = path.resolve(
        process.cwd(),
        "src/email/preview-email-template.pug",
      );
      const previewUrl = await previewEmail(messageForPreview, {
        openSimulator: clientEnv.NEXT_PUBLIC_EMAIL_PREVIEW_OPEN_SIMULATOR,
        template: templatePath,
        open: !!clientEnv.NEXT_PUBLIC_EMAIL_PREVIEW_OPEN_TAB,
      });
      console.log(` -> Email preview available at: ${previewUrl}`);
    } catch (error) {
      console.error(" -> Error generating email preview:", error);
      // Don't block sending if preview fails, just log the error
    }
  }

  // Prepare the payload for the actual provider
  const payload: EmailPayload = { to, subject, react, text, from };

  // 3. Send email based on EMAIL_PROVIDER
  console.log(
    `[Email Router] Using provider: ${serverEnv.NEXT_PUBLIC_EMAIL_PROVIDER}`,
  );

  try {
    switch (serverEnv.NEXT_PUBLIC_EMAIL_PROVIDER) {
      case "smtp":
        console.log("[Email Router] Sending via SMTP...");
        const smtpResults = await sendEmailSmtp(payload);
        const failedSmtp = smtpResults.find((r) => r.error);
        if (failedSmtp) {
          throw new Error(
            `SMTP send failed: ${failedSmtp.error?.message || "Unknown SMTP error"}`,
          );
        }
        console.log("[Email Router] SMTP send successful.");
        break;

      case "resend":
        console.log("[Email Router] Sending via Resend...");
        const resendResult = await sendEmailResend(payload);
        if (resendResult.error) {
          throw new Error(
            `Resend API error: ${resendResult.error.message || "Unknown Resend error"}`,
          );
        }
        console.log("[Email Router] Resend send successful.");
        break;

      case "plunk":
        console.log("[Email Router] Sending via Plunk...");
        const plunkResult = await sendEmailPlunk(payload);
        if (!plunkResult.success) {
          throw new Error(
            `Plunk send failed: ${plunkResult.error || "Unknown Plunk error"}`,
          );
        }
        console.log("[Email Router] Plunk send successful.");
        break;

      case "nodemailer-app": // Local development nodemailer/preview
        const transport = getNodemailerAppTransport();
        if (!transport) {
          console.warn(
            "[Email Router] Nodemailer (local) not loaded. No email sent/logged.",
          );
          break;
        }

        console.log(
          "[Email Router] Sending/Logging via local Nodemailer App...",
        );
        let successCount = 0;
        for (const recipient of recipients) {
          try {
            const info = await transport.sendMail({
              from,
              to: recipient,
              subject,
              html,
              text,
            });
            console.log(
              ` -> Logged to Nodemailer for ${recipient}: ${info.messageId}`,
            );
            successCount++;
          } catch (error) {
            console.error(
              ` -> Error logging to Nodemailer for ${recipient}:`,
              error,
            );
            // Decide if one failure should stop all? For logging, probably not.
          }
        }
        console.log(
          `[Email Router] Finished Nodemailer logging: ${successCount} successful.`,
        );
        break;

      default:
        console.error(
          `[Email Router] Unknown or unhandled EMAIL_PROVIDER: ${serverEnv.NEXT_PUBLIC_EMAIL_PROVIDER}`,
        );
        throw new Error("Invalid email provider configuration");
    }
    console.log("[Email Router] Email processing completed successfully.");
  } catch (error: any) {
    console.error("[Email Router] Failed to send email:", error);
    // Re-throw the error to be caught by the caller
    throw new Error(
      `Email sending failed via ${serverEnv.NEXT_PUBLIC_EMAIL_PROVIDER}: ${error.message || String(error)}`,
    );
  }
};
