"use client";

import { format } from "date-fns";
import {
  CheckCircle,
  XCircle,
  Calendar,
  Repeat,
  DollarSign,
} from "lucide-react";

// Define the structure of a subscription based on the provided JSON
interface PolarSubscription {
  id: string;
  status: "active" | "canceled" | string; // Allow for other statuses
  amount: number;
  currency: string;
  recurringInterval: "month" | "year" | string; // Allow other intervals
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  // Add other relevant fields if needed
}

interface PolarActiveSubscriptionCardProps {
  subscription: PolarSubscription;
}

export function PolarActiveSubscriptionCard({
  subscription,
}: PolarActiveSubscriptionCardProps) {
  const {
    status,
    amount,
    currency,
    recurringInterval,
    currentPeriodEnd,
    cancelAtPeriodEnd,
  } = subscription;

  const formattedAmount = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(amount / 100); // Assuming amount is in cents

  const formattedEndDate = format(new Date(currentPeriodEnd), "MMMM dd, yyyy");

  const isActivelyCancelling = cancelAtPeriodEnd;

  return (
    <div className="bg-card text-card-foreground rounded-lg border p-4 shadow-sm">
      <div className="mb-2 flex items-center justify-between">
        <h4 className="text-lg font-semibold">Subscription Plan</h4>
        <span
          className={`focus:ring-ring inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:ring-2 focus:ring-offset-2 focus:outline-none ${
            status === "active" && !isActivelyCancelling
              ? "border-transparent bg-green-100 text-green-800 dark:bg-green-800/30 dark:text-green-400"
              : isActivelyCancelling
                ? "border-transparent bg-yellow-100 text-yellow-800 dark:bg-yellow-800/30 dark:text-yellow-400"
                : "border-transparent bg-red-100 text-red-800 dark:bg-red-800/30 dark:text-red-400"
          }`}
        >
          {status === "active" && !isActivelyCancelling ? (
            <CheckCircle className="mr-1 h-3 w-3" />
          ) : (
            <XCircle className="mr-1 h-3 w-3" />
          )}
          {isActivelyCancelling
            ? `Cancels on ${formattedEndDate}`
            : status.charAt(0).toUpperCase() + status.slice(1)}
        </span>
      </div>
      <div className="text-muted-foreground space-y-1 text-sm">
        <div className="flex items-center">
          <DollarSign className="mr-2 h-4 w-4" />
          <span>{formattedAmount}</span>
        </div>
        <div className="flex items-center">
          <Repeat className="mr-2 h-4 w-4" />
          <span>Renews every {recurringInterval}</span>
        </div>
        {!isActivelyCancelling && (
          <div className="flex items-center">
            <Calendar className="mr-2 h-4 w-4" />
            <span>Current period ends: {formattedEndDate}</span>
          </div>
        )}
      </div>
    </div>
  );
}
