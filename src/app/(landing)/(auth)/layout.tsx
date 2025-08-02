"use client";

import { authClient } from "@/server/auth/client";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = authClient.useSession();
  const router = useRouter();

  useEffect(() => {
    if (session.data?.user) {
      router.push("/");
    }
  }, [session.data?.user]);

  return (
    <div className="container flex h-[calc(100vh-var(--header-height))] w-full items-center justify-center">
      <div className="mx-auto w-full max-w-md">{children}</div>
    </div>
  );
}
