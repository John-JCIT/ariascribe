"use client";

import * as React from "react";
import {
  Settings,
  Paintbrush,
  Keyboard,
  Cpu,
  CreditCard,
  Lock,
} from "lucide-react";
import { TabPanels } from "@/components/TabPanels";
import { SettingsTabGeneral } from "./SettingsTabGeneral";
import { SettingsTabAppearance } from "./SettingsTabAppearance";
import { SettingsTabShortcuts } from "./SettingsTabShortcuts";
import { SettingsTabAI } from "./SettingsTabAI/SettingsTabAI";
import { SettingsTabBilling } from "./SettingsTabBilling";
import { SettingsTabPasswordChange } from "./SettingsTabPasswordChange";
import { clientEnv } from "@/env/client";
import { compact } from "lodash";

export interface SettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SettingsModal({}: SettingsModalProps) {
  const tabs = compact([
    {
      value: "general",
      label: "General",
      icon: Settings,
      content: <SettingsTabGeneral />,
    },
    {
      value: "appearance",
      label: "Appearance",
      icon: Paintbrush,
      content: <SettingsTabAppearance />,
    },
    {
      value: "shortcuts",
      label: "Shortcuts",
      icon: Keyboard,
      content: <SettingsTabShortcuts />,
    },
    {
      value: "password",
      label: "Password",
      icon: Lock,
      content: <SettingsTabPasswordChange />,
    },
    {
      value: "ai",
      label: "AI Providers",
      icon: Cpu,
      content: <SettingsTabAI />,
    },
    clientEnv.NEXT_PUBLIC_ENABLE_POLAR && {
      value: "billing",
      label: "Billing",
      icon: CreditCard,
      content: <SettingsTabBilling />,
    },
  ]);

  return (
    <TabPanels
      classNames={{
        content: "h-[60vh] md:h-[70vh] md:max-h-[800px] overflow-y-auto",
      }}
      mobileView="native"
      tabs={tabs}
      defaultTab="general"
    />
  );
}
