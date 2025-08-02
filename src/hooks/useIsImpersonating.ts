import { authClient } from "@/server/auth/client";

export function useIsImpersonating() {
  const { data: sessionData } = authClient.useSession();
  const isImpersonating = !!sessionData?.session.impersonatedBy;

  return {
    isImpersonating,
    impersonatedUserName: isImpersonating ? sessionData?.user.name : null,
  };
}
