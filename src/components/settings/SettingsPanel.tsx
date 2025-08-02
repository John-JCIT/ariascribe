"use client";

import * as React from "react";

interface SettingsPanelProps {
  title: string;
  description?: string;
  children: React.ReactNode;
}

export function SettingsPanel({
  title,
  description,
  children,
}: SettingsPanelProps) {
  return (
    <div className="vertical space-y-4 gap-y-4">
      <div className="vertical gap-2">
        <h2 className="text-xl font-semibold">{title}</h2>
        {description && <p className="text-muted-foreground">{description}</p>}
      </div>

      <div className="overflow-y-auto">{children}</div>
    </div>
  );
}
