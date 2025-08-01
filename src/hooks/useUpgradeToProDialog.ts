"use client";

import { useDialog } from "@/components/DialogManager";
import { PricingDialog } from "@/components/pricing/PricingDialog";

export function useUpgradeToProDialog() {
  const { openDialog } = useDialog();

  const openUpgradeDialog = () => {
    openDialog({
      title: "Upgrade to Pro",
      showCloseButton: false,
      component: PricingDialog,
      size: "3xl",
      showCancel: false,
    });
  };

  return { openUpgradeDialog };
}
