"use client";

import { useState } from "react";
import { UserX, Shield } from "lucide-react";
import { authClient } from "@/server/auth/client";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export function AdminStatus() {
  const { data: sessionData, isPending: isSessionPending } =
    authClient.useSession();
  const role = sessionData?.user.role;
  const isAdmin = role === "admin";
  const [isStoppingImpersonation, setIsStoppingImpersonation] = useState(false);

  const stopImpersonating = async () => {
    setIsStoppingImpersonation(true);
    try {
      await authClient.admin.stopImpersonating();
      window.location.reload();
    } catch (error) {
      console.error("Error stopping impersonation:", error);
    } finally {
      setIsStoppingImpersonation(false);
    }
  };

  const isLoading = isSessionPending;
  if (isLoading) return null;

  const isImpersonating = !!sessionData?.session.impersonatedBy;

  const showControls = isAdmin || isImpersonating;

  if (!showControls) return null;

  return (
    <div className="flex items-center space-x-2">
      <Link href="/admin">
        <Shield className="h-5 w-5 text-yellow-600" />
      </Link>
      {isImpersonating && (
        <Button
          variant="outline"
          size="sm"
          onClick={stopImpersonating}
          disabled={isStoppingImpersonation}
          className="border-yellow-500 text-yellow-600 hover:bg-yellow-100"
        >
          <UserX className="mr-1 h-4 w-4" />
          {isStoppingImpersonation ? "Stopping..." : "Stop Impersonating"}
        </Button>
      )}
    </div>
  );
}
