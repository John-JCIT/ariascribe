import { api } from "@/trpc/react";
import {
  type PreferenceKey,
  getDefaultPreferenceValue,
  type UserPreferences,
} from "@/types/user-preferences";

export function useUserSetting<K extends PreferenceKey>(
  key: K,
  defaultValue?: UserPreferences[K],
) {
  // Get the schema default if no explicit default was provided
  const finalDefaultValue = defaultValue ?? getDefaultPreferenceValue(key);

  const utils = api.useUtils();
  const { data, isLoading } = api.user.getSinglePreference.useQuery(
    {
      key,
      defaultValue:
        finalDefaultValue !== undefined ? finalDefaultValue : undefined,
    },
    { enabled: true },
  );

  const updatePreferenceMutation = api.user.updatePreference.useMutation({
    onSuccess: () => {
      utils.user.getSinglePreference.invalidate({ key });
    },
  });

  const setValue = (newValue: UserPreferences[K]) => {
    updatePreferenceMutation.mutate({
      key,
      value: newValue,
    });
  };

  return {
    value: data?.value ?? finalDefaultValue,
    setValue,
    isLoading,
    isUpdating: updatePreferenceMutation.isPending,
  };
}
