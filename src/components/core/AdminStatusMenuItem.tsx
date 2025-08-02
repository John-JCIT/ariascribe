import { useState } from "react";
import { Shield, UserX } from "lucide-react";
import { CommonMenuItem } from "@/components/CommonMenuItem";
import { authClient } from "@/server/auth/client";
import { useIsImpersonating } from "@/hooks/useIsImpersonating";

export function AdminStatusMenuItem() {
  const { data: sessionData } = authClient.useSession();
  const { isImpersonating } = useIsImpersonating();
  const isAdmin = sessionData?.user.role === "admin";
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

  if (!isAdmin && !isImpersonating) return null;

  if (isImpersonating) {
    return (
      <CommonMenuItem
        onClick={stopImpersonating}
        leftIcon={UserX}
        disabled={isStoppingImpersonation}
      >
        {isStoppingImpersonation ? "Stopping..." : "Stop Impersonating"}
      </CommonMenuItem>
    );
  }

  return (
    <CommonMenuItem href="/admin" leftIcon={Shield}>
      Admin Dashboard
    </CommonMenuItem>
  );
}
