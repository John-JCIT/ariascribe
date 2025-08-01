"use client";

import * as React from "react";
import { SettingsPanel } from "./SettingsPanel";
import { UserSettingSwitchCard } from "@/components/UserSettingSwitchCard";

export function SettingsTabGeneral() {
  return (
    <SettingsPanel
      title="General Settings"
      description="Configure general application preferences."
    >
      <div className="space-y-2">
        <UserSettingSwitchCard
          settingKey="notifications"
          label="Notifications"
          description="Enable or disable application notifications."
        />

        <UserSettingSwitchCard
          settingKey="sound"
          label="Sound Effects"
          description="Enable or disable sound effects."
        />

        <UserSettingSwitchCard
          settingKey="analytics"
          label="Usage Analytics"
          description="Help us improve by sending anonymous usage data."
        />

        <UserSettingSwitchCard
          settingKey="emailMarketing"
          label="Marketing Emails"
          description="Receive promotional emails about new features and offers."
        />

        <UserSettingSwitchCard
          settingKey="emailUpdates"
          label="Product Updates"
          description="Receive emails about product updates and new features."
        />
      </div>
    </SettingsPanel>
  );
}
