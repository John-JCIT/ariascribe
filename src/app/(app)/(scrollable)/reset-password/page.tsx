"use client";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { type ErrorContext } from "@better-fetch/fetch";
import { toast } from "sonner";
import { ResetPasswordForm } from "@/app/(app)/(scrollable)/reset-password/reset-password-form";
import { type ResetPasswordSchemaType } from "@/schemas/reset-password-schema";
import { authClient } from "@/server/auth/client";

export default function Page() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const invalid_token_error = searchParams.get("error");
  const token = searchParams.get("token");
  const [isLoading, setIsLoading] = useState(false);

  const handleResetPassword = async (values: ResetPasswordSchemaType) => {
    await authClient.resetPassword(
      {
        newPassword: values.password,
        token: token ?? "",
      },
      {
        onRequest: () => {
          setIsLoading(true);
        },
        onSuccess: async () => {
          toast.success(
            "Your password has been reset. You can now sign in with your new password.",
          );
          setTimeout(() => {
            router.push("/signin");
          }, 1500);
        },
        onError: (ctx: ErrorContext) => {
          toast.error(ctx.error.message ?? "Something went wrong.");
        },
        onSettled: () => {
          setIsLoading(false);
        },
      },
    );
  };

  return (
    <div className="flex grow items-center justify-center p-4">
      <div className="w-full max-w-md">
        <ResetPasswordForm
          onSubmit={handleResetPassword}
          isLoading={isLoading}
          invalidToken={invalid_token_error === "INVALID_TOKEN" || !token}
        />
      </div>
    </div>
  );
}
