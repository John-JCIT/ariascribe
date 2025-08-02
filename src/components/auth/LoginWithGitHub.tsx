"use client";

import { type ErrorContext } from "@better-fetch/fetch";
import { Github } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { CustomButton } from "@/components/CustomButton";
import { toast } from "sonner";
import { authClient } from "@/server/auth/client";
import { clientEnv } from "@/env/client";

interface LoginWithGitHubProps {
  label?: string;
  className?: string;
}

export function LoginWithGitHub({
  label = "Login with Github",
  className = "w-full",
}: LoginWithGitHubProps) {
  const [pending, setPending] = useState(false);
  const router = useRouter();

  const handleSignInWithGithub = async () => {
    await authClient.signIn.social(
      {
        provider: "github",
      },
      {
        onRequest: () => {
          setPending(true);
        },
        onSuccess: async () => {
          router.refresh();
        },
        onError: (ctx: ErrorContext) => {
          toast.error(ctx.error.message ?? "Something went wrong.");
        },
      },
    );

    setPending(false);
  };

  if (!clientEnv.NEXT_PUBLIC_ENABLE_GITHUB_INTEGRATION) return null;

  return (
    <CustomButton
      onClick={handleSignInWithGithub}
      loading={pending}
      type="button"
      className={className}
      leftIcon={Github}
    >
      {label}
    </CustomButton>
  );
}
