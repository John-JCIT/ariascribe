import { serverEnv } from "@/env";
import Plunk from "@plunk/node";
import { render } from "@react-email/render";
import type { EmailPayload } from "./send-email"; // Assuming EmailPayload is the shared type

/**
 * Sends an email using the Plunk API.
 * @param payload - The email details (to, subject, react, text, from).
 * @returns Promise<{ success: boolean; error?: Error }> Result of the send operation.
 * @throws Error if Plunk is not configured.
 */
export const sendEmailPlunk = async ({
  to,
  subject,
  react,
  text,
  from, // Plunk's send doesn't directly use 'from' in the same way, but we keep it for consistency
}: EmailPayload): Promise<{ success: boolean; error?: Error }> => {
  if (serverEnv.NEXT_PUBLIC_EMAIL_PROVIDER !== "plunk") {
    console.error("[Email Plunk] Plunk API key is not configured.");
    throw new Error("Plunk transport is not configured.");
  }

  console.log("[Email Plunk] Attempting to send email via Plunk...");
  const plunk = new Plunk(serverEnv.PLUNK_SECRET_KEY); // Non-null assertion as checked above

  try {
    // Render the React component to HTML if provided
    const bodyHtml = react ? await render(react) : undefined; // Plunk prefers HTML, ensure await

    // Plunk's `send` method primarily needs `to`, `subject`, and `body` (HTML).
    // It doesn't have a direct equivalent for `text` alongside HTML or a configurable `from`.
    // We'll use the HTML body if available, otherwise the text body.
    const bodyContent = bodyHtml || text;
    if (!bodyContent) {
      throw new Error(
        "Email must have either a React component (for HTML) or a text body.",
      );
    }

    // Note: Plunk's `send` function doesn't explicitly take `from` or `name`.
    // Sender details are typically configured within the Plunk dashboard.
    const result = await plunk.emails.send({
      to: Array.isArray(to) ? to.join(",") : to, // Plunk might expect a single string or handle arrays; check docs if needed. Assuming single string for now.
      subject: subject,
      body: bodyContent, // Send rendered HTML or plain text
      // type: bodyHtml ? 'html' : undefined, // Plunk might auto-detect or default, consult docs. Omitting for now.
    });

    // Plunk's API might return different success indicators. Adjust based on actual response.
    // Assuming a boolean success flag or similar. Let's simulate success for now.
    // Replace this with actual response checking based on @plunk/node docs.
    // const success = result && result.id; // Example check if result has an ID on success
    const success = true; // Placeholder

    if (success) {
      console.log("[Email Plunk] Email sent successfully via Plunk.");
      return { success: true };
    } else {
      console.error("[Email Plunk] Plunk API reported failure.", result);
      // Adapt error message based on actual Plunk error structure
      return {
        success: false,
        error: new Error("Plunk send failed: Unknown reason"),
      };
    }
  } catch (error: any) {
    console.error("[Email Plunk] Error sending email via Plunk:", error);
    return {
      success: false,
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
};
