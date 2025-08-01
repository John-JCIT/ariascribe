"use client";

import * as React from "react";
import { type CapabilityType, CAPABILITY_INFO } from "@/config/ai-capabilities";
import { cn } from "@/lib/utils";

interface AiCapabilityBadgeProps {
  capability: CapabilityType;
  className?: string;
}

export function AiCapabilityBadge({
  capability,
  className,
}: AiCapabilityBadgeProps) {
  const capabilityInfo = CAPABILITY_INFO[capability];

  if (!capabilityInfo) return null;

  const Icon = capabilityInfo.icon;

  return (
    <div
      className={cn(
        "bg-secondary text-secondary-foreground inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium",
        className,
      )}
    >
      <Icon className="h-3 w-3" />
      <span>{capabilityInfo.title}</span>
    </div>
  );
}

interface AiCapabilityListProps {
  capabilities: CapabilityType[];
  className?: string;
}

export function AiCapabilityList({
  capabilities,
  className,
}: AiCapabilityListProps) {
  return (
    <div className={cn("flex flex-wrap gap-1.5", className)}>
      {capabilities.map((capability) => (
        <AiCapabilityBadge key={capability} capability={capability} />
      ))}
    </div>
  );
}
