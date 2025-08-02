import { useCallback } from "react";
import { api } from "@/trpc/react";

export function useUserBillingStatus({
  enabled = false,
}: { enabled?: boolean } = {}) {
  const utils = api.useUtils();
  const {
    data: billingState,
    isLoading,
    error,
  } = api.polar.getBillingState.useQuery(undefined, {
    enabled,
  });

  const refresh = useCallback(() => {
    void utils.polar.getBillingState.invalidate();
  }, [utils]);

  const isPro = billingState?.isPro ?? false;

  return {
    billingState,
    isLoading,
    error,
    isPro,
    refresh,
  };
}
