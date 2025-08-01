"use client";

import * as React from "react";
import { CreditCard, RefreshCw, Crown } from "lucide-react";
import { CustomButton } from "@/components/CustomButton";
import { Spinner } from "@/components/Spinner";
import { PolarActiveSubscriptions } from "./PolarActiveSubscriptions";
import { useUserBillingStatus } from "@/hooks/useUserBillingStatus";
import { useUpgradeToProDialog } from "@/hooks/useUpgradeToProDialog";

export function SettingsTabBilling() {
  const { billingState, isPro, isLoading, error, refresh } =
    useUserBillingStatus();
  const { openUpgradeDialog } = useUpgradeToProDialog();

  const handleManageBilling = () => {
    window.open("/api/auth/portal", "_blank");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Billing Information</h3>
        <CustomButton size="sm" leftIcon={RefreshCw} onClick={refresh}>
          Refresh
        </CustomButton>
      </div>

      {isLoading && <Spinner />}
      {error && !isLoading && (
        <p className="text-red-500">
          {error instanceof Error
            ? error.message
            : "Failed to load billing information"}
        </p>
      )}

      {!isLoading && !error && (
        <PolarActiveSubscriptions
          subscriptions={billingState?.activeSubscriptions || []}
        />
      )}

      {!isLoading &&
        !error &&
        billingState?.activeSubscriptions &&
        billingState.activeSubscriptions.length > 0 && <hr className="my-4" />}

      {!isLoading && !error && (
        <div className="horizontal gap-2">
          {isPro ? (
            <CustomButton leftIcon={CreditCard} onClick={handleManageBilling}>
              Manage Billing
            </CustomButton>
          ) : (
            <CustomButton
              variant="outline"
              leftIcon={Crown}
              onClick={openUpgradeDialog}
            >
              Upgrade to Pro
            </CustomButton>
          )}
        </div>
      )}

      {!billingState && !isLoading && !error && (
        <p className="text-muted-foreground">
          No billing information or active subscriptions found.
        </p>
      )}
    </div>
  );
}
