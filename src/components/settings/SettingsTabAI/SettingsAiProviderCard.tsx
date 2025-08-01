"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useUserSetting } from "@/hooks/useUserSetting";
import { Loader2, Save } from "lucide-react";
import { type PreferenceKey } from "@/types/user-preferences";
import {
  type AiProviderId,
  getProviderEnabledKey,
  getProviderApiKeyKey,
} from "@/config/ai-providers";
import { CustomSwitch } from "@/components/ui/custom-switch";
import { AiCapabilityList } from "./AiCapabilityBadge";
import { type CapabilityType } from "@/config/ai-capabilities";

export interface SettingsAiProviderCardProps {
  providerId: AiProviderId;
  name: string;
  logo?: React.ReactNode;
  description?: string;
  capabilities: CapabilityType[];
}

export function SettingsAiProviderCard({
  providerId,
  name,
  logo,
  description,
  capabilities,
}: SettingsAiProviderCardProps) {
  const enabledKey = getProviderEnabledKey(providerId) as PreferenceKey;
  const apiKeyKey = getProviderApiKeyKey(providerId) as PreferenceKey;

  const {
    value: isEnabled,
    setValue: setIsEnabled,
    isLoading: isEnabledLoading,
    isUpdating: isEnabledUpdating,
  } = useUserSetting(enabledKey);

  const {
    value: apiKey,
    setValue: setApiKey,
    isLoading: isApiKeyLoading,
    isUpdating: isApiKeyUpdating,
  } = useUserSetting<typeof apiKeyKey>(apiKeyKey);

  const [inputApiKey, setInputApiKey] = useState("");

  // Update local state when API key changes
  useEffect(() => {
    if (apiKey && typeof apiKey === "string") {
      setInputApiKey(apiKey);
    }
  }, [apiKey]);

  const handleToggleEnabled = () => {
    setIsEnabled(!isEnabled);
  };

  const handleSaveApiKey = () => {
    (setApiKey as unknown as (value: string) => void)(inputApiKey);
  };

  const isLoading = isEnabledLoading || isApiKeyLoading;
  const isUpdating = isEnabledUpdating || isApiKeyUpdating;

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {logo && <div className="h-8 w-8">{logo}</div>}
            <CardTitle className="text-lg">{name}</CardTitle>
          </div>
          <CustomSwitch
            id={`enable-${providerId}`}
            checked={!!isEnabled}
            onCheckedChange={handleToggleEnabled}
            disabled={isLoading || isUpdating}
            size="lg"
          />
        </div>
        {description && (
          <p className="text-muted-foreground text-sm">{description}</p>
        )}
        <AiCapabilityList capabilities={capabilities} className="mt-2" />
      </CardHeader>
      <CardContent>
        {isEnabled && (
          <div className="flex items-end gap-3">
            <div className="flex-1">
              <Label htmlFor={`api-key-${providerId}`} className="mb-1.5 block">
                API Key
              </Label>
              <Input
                id={`api-key-${providerId}`}
                type="password"
                placeholder="Enter your API key"
                value={inputApiKey}
                onChange={(e) => setInputApiKey(e.target.value)}
                disabled={isLoading || isUpdating}
              />
            </div>
            <Button
              onClick={handleSaveApiKey}
              disabled={isLoading || isUpdating || !inputApiKey}
              className="gap-1.5"
            >
              {isApiKeyUpdating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Save
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
