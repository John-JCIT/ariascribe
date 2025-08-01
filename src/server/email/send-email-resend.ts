import { render } from "@react-email/render";
import type {
  CreateEmailOptions,
  CreateBatchResponse,
  CreateEmailResponse,
} from "resend";
import { Resend } from "resend";
import { serverEnv } from "@/env";
import type { EmailPayload } from "./send-email";

// Use the main response types from Resend SDK
type ResendSingleResult = CreateEmailResponse;
type ResendBatchResult = CreateBatchResponse;

/**
 * Sends an email or batch of emails using the Resend API.
 * Handles both single and multiple recipients.
 * Checks for required Resend configuration.
 * @param payload - Email details, conforming to EmailPayload.
 * @returns A promise resolving to Resend's response structure.
 * @throws Error on configuration issues or API errors.
 */
export const sendEmailResend = async ({
  to,
  subject,
  react,
  text,
  from,
}: EmailPayload): Promise<ResendSingleResult | ResendBatchResult> => {
  if (serverEnv.NEXT_PUBLIC_EMAIL_PROVIDER !== "resend") {
    console.error("[Resend] RESEND_API_KEY is not set.");
    throw new Error("Resend configuration error: RESEND_API_KEY is missing.");
  }

  if (!react && !text) {
    console.error("[Resend] Email must have either 'react' or 'text' content.");
    throw new Error("Email content missing for Resend");
  }

  const html = react ? await render(react) : undefined;
  const resend = new Resend(serverEnv.RESEND_API_KEY);

  try {
    if (Array.isArray(to)) {
      // Production Batch Sending using Resend
      console.log(`[Resend] Sending batch email to ${to.length} recipients...`);
      const batchPayload: CreateEmailOptions[] = to.map((recipient) => ({
        from,
        to: recipient,
        subject,
        react,
        text,
        html,
      }));

      const result: ResendBatchResult = await resend.batch.send(batchPayload);

      if (result.error) {
        console.error("[Resend] Batch API returned an error:", result.error);
        const errorMessage =
          result.error.message || "Unknown Resend batch API error";
        throw new Error(errorMessage);
      }
      if (!result.data || !Array.isArray(result.data)) {
        console.error(
          "[Resend] Batch API returned success but data is missing or not an array.",
        );
        throw new Error("Invalid success data from Resend batch API");
      }
      if (result.data.length === 0) {
        console.warn(
          "[Resend] Batch API returned success with an empty data array.",
        );
      }

      console.log(
        `[Resend] Batch email queued successfully. IDs: ${result.data
          .map((d: { id: string }) => d.id)
          .join(", ")}`,
      );
      return result;
    } else {
      // Production Single Send using Resend
      const message: CreateEmailOptions = {
        from,
        to,
        subject,
        react,
        text,
        html,
      };
      console.log(`[Resend] Sending single email to ${to}...`);

      const result: ResendSingleResult = await resend.emails.send(message);

      if (result.error) {
        console.error(
          "[Resend] Single email API returned an error:",
          result.error,
        );
        const errorMessage =
          result.error.message || "Unknown Resend single email API error";
        throw new Error(errorMessage);
      }
      if (!result.data?.id) {
        console.error("[Resend] Single email API missing data ID.");
        throw new Error("Missing success data ID from Resend");
      }
      console.log(`[Resend] Single email sent. Response ID: ${result.data.id}`);
      return result;
    }
  } catch (error: any) {
    console.error("[Resend] Error sending email via Resend:", error);
    if (error instanceof Error) {
      throw error;
    } else {
      throw new Error(String(error) || "Unknown Resend SDK error");
    }
  }
};
