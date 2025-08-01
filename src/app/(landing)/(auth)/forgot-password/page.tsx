"use client";
import { useState } from "react";
import { type ErrorContext } from "@better-fetch/fetch";
import { toast } from "sonner";
import { ForgotPasswordForm } from "@/app/(landing)/(auth)/forgot-password/forgot-password-form";
import { type ForgotPasswordSchemaType } from "@/schemas/forgot-password-schema";
import { authClient } from "@/server/auth/client";

export default function Page() {
  const [isLoading, setIsLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleForgotPassword = async (values: ForgotPasswordSchemaType) => {
    await authClient.forgetPassword(
      {
        email: values.email,
        redirectTo: "/reset-password",
      },
      {
        onRequest: () => {
          setIsLoading(true);
        },
        onSuccess: async () => {
          setIsLoading(false);
          setSubmitted(true);
        },
        onError: (ctx: ErrorContext) => {
          console.log("onError", ctx);
          toast.error(ctx.error.message ?? "Something went wrong.");
          setIsLoading(false);
        },
        onSettled: () => {
          console.log("onSettled");
          setIsLoading(false);
        },
      },
    );
  };

  return (
    <ForgotPasswordForm
      onSubmit={handleForgotPassword}
      isLoading={isLoading}
      submitted={submitted}
    />
  );
}
