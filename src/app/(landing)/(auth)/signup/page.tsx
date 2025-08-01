"use client";
import { useState } from "react";
import { type SignUpSchemaType } from "@/schemas/signup-schema";
import { authClient } from "@/server/auth/client";
import { SignupForm } from "@/app/(landing)/(auth)/signup/signup-form";
import { toast } from "sonner";
import confetti from "canvas-confetti";
import { useRouter } from "next/navigation";
import { clientEnv } from "@/env/client";

export default function SignupPage() {
  const [pending, setPending] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const router = useRouter();

  const handleSignup = async (values: SignUpSchemaType) => {
    await authClient.signUp.email(
      {
        email: values.email,
        password: values.password,
        name: values.name,
      },
      {
        onRequest: () => setPending(true),
        onSuccess: () => {
          if (!clientEnv.NEXT_PUBLIC_AUTH_ENABLE_EMAIL_VERIFICATION) {
            toast.success("Account created successfully!");
            router.push("/");
          } else {
            confetti({
              particleCount: 150,
              spread: 70,
              origin: { x: 0.5, y: 0.6 },
              zIndex: 9999,
            });
            toast.success("Account created", {
              description:
                "Your account has been created. Check your email for a verification link.",
            });
            setSubmitted(true);
          }
        },
        onError: (ctx) => {
          console.log("error", ctx);
          toast.error("Something went wrong", {
            description: ctx.error.message ?? "",
          });
        },
      },
    );

    setPending(false);
  };

  return (
    <SignupForm
      onSubmit={handleSignup}
      isLoading={pending}
      isSubmitted={submitted}
    />
  );
}
