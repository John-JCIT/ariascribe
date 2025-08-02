"use client";

import { CalendarDays, CreditCard, Clock } from "lucide-react";
import {
  getActivePaymentPlans,
  getCheckoutUrl,
  getSignInUrlForPricing,
} from "@/lib/payment-utils";
import { PlanType, SubscriptionInterval } from "@/config/payment-plans";
import { useState } from "react";
import { useKitzeUI } from "@/components/KitzeUIContext";
import { SimpleSelect } from "@/components/SimpleSelect";
import { authClient } from "@/server/auth/client";
import { PlanCard, type PlanCardProps } from "./PlanCard";

export default function PricingPlans() {
  const { isMobile } = useKitzeUI();
  const plans = getActivePaymentPlans();
  const { data: session } = authClient.useSession();
  const isAuthenticated = !!session;

  const monthlyPlan = plans.find(
    (plan) =>
      plan.type === PlanType.Subscription &&
      plan.interval === SubscriptionInterval.Monthly,
  );

  const annualPlan = plans.find(
    (plan) =>
      plan.type === PlanType.Subscription &&
      plan.interval === SubscriptionInterval.Annual,
  );

  const lifetimePlan = plans.find((plan) => plan.type === PlanType.OneTime);

  // Calculate savings if both plans exist
  const savings =
    monthlyPlan && annualPlan
      ? Math.round(
          100 - (annualPlan.priceAmount / (monthlyPlan.priceAmount * 12)) * 100,
        )
      : 0;

  const features = [
    "Access to all premium features",
    "Priority support",
    "Advanced analytics",
    "Custom exports",
    "API access",
    "No feature limitations",
  ];

  const planOptions = [
    { value: "monthly", label: "Monthly", icon: CalendarDays },
    { value: "annual", label: `Annual (Save ${savings}%)`, icon: CreditCard },
    { value: "lifetime", label: "Lifetime", icon: Clock },
  ];

  const [selectedPlan, setSelectedPlan] = useState("annual");

  const getActionUrl = (planSlug: string | undefined) => {
    if (!planSlug) return "#";
    if (!isAuthenticated) return getSignInUrlForPricing();
    const plan = plans.find((p) => p.slug === planSlug);
    if (!plan) return "#";
    return getCheckoutUrl(plan.slug);
  };

  const planConfigs: PlanCardProps[] = [];

  if (monthlyPlan) {
    planConfigs.push({
      name: monthlyPlan.name,
      description: monthlyPlan.description || "",
      price: monthlyPlan.price,
      priceLabel: "/month",
      features,
      actionUrl: getActionUrl(monthlyPlan.slug),
      isHighlighted: false,
    });
  }

  if (annualPlan) {
    planConfigs.push({
      name: annualPlan.name,
      description: annualPlan.description || "",
      price: annualPlan.price,
      priceLabel: "/year",
      badge: "RECOMMENDED",
      features,
      actionUrl: getActionUrl(annualPlan.slug),
      isHighlighted: true,
      savings,
    });
  }

  if (lifetimePlan) {
    planConfigs.push({
      name: lifetimePlan.name,
      description: lifetimePlan.description || "",
      price: lifetimePlan.price,
      priceLabel: "/lifetime",
      features,
      extraFeatures: ["Lifetime access, pay once"],
      actionUrl: getActionUrl(lifetimePlan.slug),
      isHighlighted: false,
    });
  }

  if (isMobile) {
    return (
      <div className="flex w-full flex-col gap-6">
        <SimpleSelect
          options={planOptions}
          value={selectedPlan}
          onValueChange={setSelectedPlan}
          placeholder="Select a plan"
          mobileView="native"
          drawerTitle="Choose a plan"
          withSearch={false}
        />

        {selectedPlan === "monthly" && monthlyPlan && (
          <PlanCard
            name={monthlyPlan.name}
            description={monthlyPlan.description || ""}
            price={monthlyPlan.price}
            priceLabel="/month"
            features={features}
            actionUrl={getActionUrl(monthlyPlan.slug)}
          />
        )}

        {selectedPlan === "annual" && annualPlan && (
          <PlanCard
            name={annualPlan.name}
            description={annualPlan.description || ""}
            price={annualPlan.price}
            priceLabel="/year"
            badge="RECOMMENDED"
            features={features}
            actionUrl={getActionUrl(annualPlan.slug)}
            isHighlighted={true}
            buttonColor="violet-600"
            savings={savings}
          />
        )}

        {selectedPlan === "lifetime" && lifetimePlan && (
          <PlanCard
            name={lifetimePlan.name}
            description={lifetimePlan.description || ""}
            price={lifetimePlan.price}
            priceLabel="/lifetime"
            features={features}
            extraFeatures={["Lifetime access, pay once"]}
            actionUrl={getActionUrl(lifetimePlan.slug)}
          />
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-10 lg:flex-row lg:items-stretch lg:gap-8">
      {planConfigs.map((plan, index) => (
        <div key={index} className="w-full max-w-md lg:w-1/3">
          <PlanCard
            {...plan}
            buttonColor={plan.isHighlighted ? "violet-600" : undefined}
          />
        </div>
      ))}
    </div>
  );
}
