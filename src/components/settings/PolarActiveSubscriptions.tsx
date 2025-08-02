"use client";

import { PolarActiveSubscriptionCard } from "./PolarActiveSubscriptionCard";

interface PolarSubscription {
  id: string;
  status: "active" | "canceled" | string;
  amount: number;
  currency: string;
  recurringInterval: "month" | "year" | string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
}

interface PolarActiveSubscriptionsProps {
  subscriptions: PolarSubscription[];
}

export function PolarActiveSubscriptions({
  subscriptions,
}: PolarActiveSubscriptionsProps) {
  if (!subscriptions || subscriptions.length === 0) {
    return (
      <p className="text-muted-foreground">No active subscriptions found.</p>
    );
  }

  return (
    <div className="space-y-4">
      <h4 className="text-md font-medium">Active Subscriptions</h4>
      {subscriptions.map((sub) => (
        <PolarActiveSubscriptionCard key={sub.id} subscription={sub} />
      ))}
    </div>
  );
}
