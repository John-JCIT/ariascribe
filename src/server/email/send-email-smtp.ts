import { render } from "@react-email/render";
import type { ReactElement } from "react";
import { smtpTransport } from "./transports/nodemailer-smtp-transport";
import type Mail from "nodemailer/lib/mailer";

interface EmailPayload {
  to: string | string[];
  subject: string;
  react?: ReactElement;
  text?: string;
  from: string;
}

// Define success/error types for consistency
type SmtpSuccess = { data: { messageId: string }; error: null };
type SmtpError = { data: null; error: { message: string; name: string } };

/**
 * Sends an email using Nodemailer with the configured SMTP transport.
 * Handles both single and multiple recipients (by sending individually).
 * @param payload - Email details (to, subject, content, from).
 * @returns A promise resolving to an array of results for each recipient.
 * @throws Error if SMTP is not configured or if sending fails.
 */
export const sendEmailSmtp = async ({
  to,
  subject,
  react,
  text,
  from,
}: EmailPayload): Promise<(SmtpSuccess | SmtpError)[]> => {
  if (!smtpTransport) {
    console.error("[SMTP] Attempted to send email but SMTP is not configured.");
    throw new Error("SMTP transport is not configured");
  }

  if (!react && !text) {
    console.error("[SMTP] Email must have either 'react' or 'text' content.");
    throw new Error("Email content missing");
  }

  const html = react ? await render(react) : undefined;
  const recipients = Array.isArray(to) ? to : [to];
  const results: (SmtpSuccess | SmtpError)[] = [];

  console.log(
    `[SMTP] Sending email to ${recipients.length} recipient(s) via configured SMTP...`,
  );

  for (const recipient of recipients) {
    const mailOptions: Mail.Options = {
      from,
      to: recipient,
      subject,
      html,
      text,
    };

    try {
      const info = await smtpTransport.sendMail(mailOptions);
      console.log(` -> Email sent to ${recipient}: ${info.messageId}`);
      results.push({ data: { messageId: info.messageId }, error: null });
    } catch (error: any) {
      const errorMessage = error?.message || "Unknown SMTP sending error";
      const errorName = error?.name || "SmtpSendError";
      console.error(` -> Error sending email to ${recipient}:`, errorMessage);
      results.push({
        data: null,
        error: { message: errorMessage, name: errorName },
      });
      // Optional: Decide whether to throw immediately or collect all results
      // throw new Error(`Failed to send email to ${recipient}: ${errorMessage}`);
    }
  }

  console.log(
    `[SMTP] Finished sending process. Success: ${results.filter((r) => r.data).length}, Failures: ${results.filter((r) => r.error).length}`,
  );

  // Check if any email failed to send
  const firstError = results.find((r) => r.error);
  if (firstError?.error) {
    // Throw an error summarizing the failure if needed, or just return results
    // For simplicity, we might just return the results array including errors.
    // throw new Error(`One or more emails failed to send via SMTP. First error: ${firstError.error.message}`);
  }

  return results;
};
