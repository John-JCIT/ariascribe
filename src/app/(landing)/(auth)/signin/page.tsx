"use client";
import { SigninForm } from "@/app/(landing)/(auth)/signin/signin-form";
import { AUTH_ERROR_CODES, showErrorMessage } from "@/lib/error-messages";
import { type SignInSchemaType } from "@/schemas/login-schema";
import { authClient } from "@/server/auth/client";
import { useState } from "react";

export default function SignInPage() {
  const [pendingCredentials, setPendingCredentials] = useState(false);
  const [showResendVerification, setShowResendVerification] = useState(false);

  const handleCredentialsSignIn = async (values: SignInSchemaType) => {
    setShowResendVerification(false); // Reset on new attempt

    await authClient.signIn.email(
      {
        email: values.email,
        password: values.password,
      },
      {
        onRequest: () => {
          setPendingCredentials(true);
        },
        onSuccess: async () => {
          // app router caches the page, so if we use router.push it MIGHT return the cached page 🥲
          window.location.href = "/";
        },
        onError: (ctx) => {
          showErrorMessage(ctx);
          // Check if the error code indicates email needs verification
          if (ctx.error?.code === AUTH_ERROR_CODES.EMAIL_NOT_VERIFIED) {
            setShowResendVerification(true);
          }
        },
      },
    );

    setPendingCredentials(false);
  };

  return (
    <SigninForm
      onSubmit={handleCredentialsSignIn}
      isLoading={pendingCredentials}
    />
  );
}
