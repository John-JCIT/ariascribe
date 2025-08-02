import { useState } from "react";
import { authClient } from "@/server/auth/client";
import { CustomButton } from "@/components/CustomButton";

interface ImpersonateUserProps {
  userId: string;
  currentUserId?: string;
}

export function ImpersonateUser({
  userId,
  currentUserId,
}: ImpersonateUserProps) {
  const [isImpersonating, setIsImpersonating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (userId === currentUserId) {
    return null;
  }

  const handleImpersonate = async () => {
    setIsImpersonating(true);
    setError(null);
    try {
      await authClient.admin.impersonateUser({ userId });
      window.location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to impersonate");
      console.error("Impersonation error:", err);
    } finally {
      setIsImpersonating(false);
    }
  };

  return (
    <div>
      <CustomButton
        onClick={handleImpersonate}
        disabled={isImpersonating}
        size="sm"
        loading={isImpersonating}
      >
        {isImpersonating ? "Impersonating..." : "Impersonate"}
      </CustomButton>
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}
