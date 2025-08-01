import { authClient } from "@/server/auth/client";
import { api } from "@/trpc/react";

export const useCurrentUser = () => {
  const { data: session } = authClient.useSession();
  const {
    data: user,
    isLoading,
    isError,
  } = api.user.getCurrentUser.useQuery(undefined, { enabled: !!session?.user });

  // Decide what to return during loading or error states
  // Returning undefined seems reasonable, but adjust if needed
  if (isLoading || isError) {
    return undefined;
  }

  return user;
};
