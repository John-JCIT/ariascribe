import { EmailTemplateChangeEmail } from "@/email/templates/EmailTemplateChangeEmail";
import { EmailTemplateResetPassword } from "@/email/templates/EmailTemplateResetPassword";
import EmailTemplateVerification from "@/email/templates/EmailTemplateVerification";
import { serverEnv } from "@/env";
import { getPlansForPolarPlugin } from "@/lib/payment-utils";
import { db } from "@/server/db";
import { sendEmail } from "@/server/email/send-email";
import { getDefaultPreferences } from "@/types/user-preferences";
import { polar } from "@polar-sh/better-auth";
import { Polar } from "@polar-sh/sdk";
import {
  betterAuth,
  type BetterAuthOptions,
  type BetterAuthPlugin,
} from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { admin, openAPI, username } from "better-auth/plugins";
import { headers } from "next/headers";
import { after } from "next/server";
import { cache } from "react";

let polarClient: Polar | undefined;

if (serverEnv.NEXT_PUBLIC_ENABLE_POLAR) {
  // Determine the correct environment (sandbox/production) based on IS_DEV and NEXT_PUBLIC_POLAR_ENV
  const accessToken =
    serverEnv.NEXT_PUBLIC_POLAR_ENV === "sandbox"
      ? serverEnv.POLAR_ACCESS_TOKEN_SANDBOX
      : serverEnv.POLAR_ACCESS_TOKEN_PROD;

  polarClient = new Polar({
    accessToken: accessToken,
    server: serverEnv.NEXT_PUBLIC_POLAR_ENV,
  });
}

interface SendVerificationEmailParams {
  user: { id: string; email: string; [key: string]: any }; // Add known user properties
  token: string;
}

interface EmailVerificationConfig {
  sendOnSignUp: boolean;
  expiresIn: number;
  autoSignInAfterVerification: boolean;
  sendVerificationEmail: (params: SendVerificationEmailParams) => Promise<void>;
}

const emailVerificationConfig: EmailVerificationConfig | undefined =
  serverEnv.NEXT_PUBLIC_AUTH_ENABLE_EMAIL_VERIFICATION
    ? {
        sendOnSignUp: true,
        expiresIn: 60 * 60 * 1, // 1 HOUR
        autoSignInAfterVerification:
          serverEnv.AUTH_AUTO_SIGN_IN_AFTER_VERIFICATION,
        sendVerificationEmail: async ({
          user,
          token,
        }: SendVerificationEmailParams) => {
          const verificationUrl = `${serverEnv.NEXT_PUBLIC_APP_URL}/api/auth/verify-email?token=${token}&callbackURL=/email-verified`;
          console.log("Sending verification email to:", user.email);
          console.log("Verification URL:", verificationUrl);
          try {
            const emailPromise = sendEmail({
              to: user.email,
              subject: "Verify your Email address",
              react: EmailTemplateVerification({ inviteLink: verificationUrl }),
            });

            // This will trigger vercel calling `waitUntil` for this task, making sure the email is actually send
            // (instead of calling "real wait until here", this will also work on other non vercel platforms)
            after(async () => {
              await emailPromise;
            });

            console.log("Verification email sent successfully to:", user.email);
          } catch (error) {
            console.error(
              `Failed to send verification email to ${user.email}:`,
              error,
            );
          }
        },
      }
    : undefined; // Explicitly undefined when disabled

export const auth = betterAuth({
  database: prismaAdapter(db, {
    provider: "postgresql",
  }),
  baseURL: serverEnv.NEXT_PUBLIC_APP_URL,
  databaseHooks: {
    user: {
      create: {
        after: async (user) => {
          // Get all default preferences from the schema
          const defaultPreferences = getDefaultPreferences();

          // Update the user with default preferences
          await db.user.update({
            where: { id: user.id },
            data: {
              preferences: defaultPreferences,
            },
          });

          /* uncomment this ONLY if you decide to disable email verification, because that also
          sends another email, and you don't want to spam users with 2 emails when they sign up
          */

          // const userName = user.name || user.email.split("@")[0] || "New User";
          // const { error } = await sendEmail({
          //   to: user.email,
          //   subject: `Welcome to ${APP_NAME}!`,
          //   react: EmailTemplateWelcome({ userName }),
          // });

          // if (error) {
          //   console.error("Error sending welcome email:", error);
          // }
        },
      },
    },
  },

  plugins: (() => {
    const plugins: BetterAuthPlugin[] = [
      openAPI(), // /api/auth/reference
      admin({
        impersonationSessionDuration: 60 * 60 * 24 * 7, // 7 days
      }),
      username(),
    ];

    if (serverEnv.NEXT_PUBLIC_ENABLE_POLAR && polarClient) {
      const webhookSecret =
        serverEnv.NEXT_PUBLIC_POLAR_ENV === "sandbox"
          ? serverEnv.POLAR_WEBHOOK_SECRET_SANDBOX
          : serverEnv.POLAR_WEBHOOK_SECRET_PROD;

      const productsArray = getPlansForPolarPlugin();

      plugins.push(
        polar({
          client: polarClient,
          createCustomerOnSignUp: serverEnv.POLAR_CREATE_CUSTOMER_ON_SIGNUP,
          enableCustomerPortal: serverEnv.POLAR_ENABLE_CUSTOMER_PORTAL,
          checkout: {
            enabled: serverEnv.POLAR_ENABLE_CHECKOUT,
            products: productsArray,
            successUrl: `${serverEnv.NEXT_PUBLIC_APP_URL}/checkout-success?checkout_id={CHECKOUT_ID}`,
          },
          ...(webhookSecret
            ? {
                webhooks: {
                  secret: webhookSecret,
                  onPayload: async (payload) => {
                    console.log("Received Polar webhook payload:", payload);
                  },
                },
              }
            : {}),
        }),
      );
    }

    return plugins;
  })(),
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day (every 1 day the session expiration is updated)
  },
  user: {
    additionalFields: {
      username: {
        type: "string",
        required: false,
      },
      avatarImageUrl: {
        type: "string",
        required: false,
      },
      coverImageUrl: {
        type: "string",
        required: false,
      },
      timezone: {
        type: "string",
        required: false,
      },
      role: {
        type: "string",
        required: false,
      },
    },
    changeEmail: {
      enabled: serverEnv.AUTH_ENABLE_CHANGE_EMAIL,
      sendChangeEmailVerification: async ({ newEmail, url }, _request) => {
        try {
          await sendEmail({
            to: newEmail,
            subject: "Confirm Your New Email Address",
            react: EmailTemplateChangeEmail({ inviteLink: url }),
          });
        } catch (error) {
          console.error("sendChangeEmailVerification Error:", error);
        }
      },
    },
  },
  //this is disabled in dev by default, but you can force enable it with "enabled"
  rateLimit: {
    window: 60,
    max: 100,
  },
  socialProviders:
    serverEnv.NEXT_PUBLIC_ENABLE_GITHUB_INTEGRATION === true
      ? {
          github: {
            clientId: serverEnv.GITHUB_CLIENT_ID,
            clientSecret: serverEnv.GITHUB_CLIENT_SECRET,
            redirectURI: `${serverEnv.NEXT_PUBLIC_APP_URL}/api/auth/callback/github`,
          },
        }
      : {},
  account: {
    accountLinking: {
      enabled: true,
      trustedProviders:
        serverEnv.NEXT_PUBLIC_ENABLE_GITHUB_INTEGRATION === true
          ? ["github"]
          : [],
    },
  },
  emailAndPassword: {
    enabled: serverEnv.NEXT_PUBLIC_AUTH_ENABLE_EMAIL_PASSWORD_AUTHENTICATION,
    requireEmailVerification:
      serverEnv.NEXT_PUBLIC_AUTH_ENABLE_EMAIL_VERIFICATION,
    autoSignIn: !serverEnv.NEXT_PUBLIC_AUTH_ENABLE_EMAIL_VERIFICATION,
    sendResetPassword: async ({ user, url }) => {
      try {
        await sendEmail({
          to: user.email,
          subject: "Reset Password Link",
          react: EmailTemplateResetPassword({ inviteLink: url }),
        });
      } catch (error) {
        console.error("sendResetPasswordEmail Error:", error);
      }
    },
  },
  ...(emailVerificationConfig && {
    emailVerification: emailVerificationConfig,
  }),
} satisfies BetterAuthOptions);

export const getServerSession = cache(
  async () =>
    await auth.api.getSession({
      headers: await headers(),
    }),
);

export type Session = typeof auth.$Infer.Session;
export type AuthUserType = Session["user"];
