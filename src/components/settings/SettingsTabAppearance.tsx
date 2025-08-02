"use client";

import * as React from "react";
import { Label } from "@/components/ui/label";
import { useTheme } from "next-themes";
import {
  SegmentedControl,
  type SegmentedControlOption,
} from "@/components/SegmentedControl";
import { Moon, Sun, Monitor } from "lucide-react";
import { SettingsPanel } from "./SettingsPanel";

export function SettingsTabAppearance() {
  const { theme, setTheme } = useTheme();

  const themeOptions: SegmentedControlOption[] = [
    {
      value: "light",
      label: "Light",
      leftIcon: Sun,
    },
    {
      value: "dark",
      label: "Dark",
      leftIcon: Moon,
    },
    {
      value: "system",
      label: "System",
      leftIcon: Monitor,
    },
  ];

  return (
    <SettingsPanel
      title="Appearance"
      description="Customize how the application looks."
    >
      <div className="vertical gap-4">
        <div className="horizontal center-h gap-2">
          <div className="vertical center">Theme</div>
          <SegmentedControl
            options={themeOptions}
            value={theme || "system"}
            onChange={setTheme}
            size="md"
          />
        </div>
      </div>
    </SettingsPanel>
  );
}
