import { CustomButton } from "@/components/CustomButton";
import { FeaturesList } from "./FeaturesList";

export type PlanCardProps = {
  name: string;
  description: string;
  price: string;
  priceLabel: string;
  badge?: string;
  features: string[];
  actionUrl: string;
  isHighlighted?: boolean;
  extraFeatures?: string[];
  buttonColor?: string;
  savings?: number;
};

export const PlanCard = ({
  name,
  description,
  price,
  priceLabel,
  badge,
  features,
  actionUrl,
  isHighlighted,
  extraFeatures,
  buttonColor,
  savings,
}: PlanCardProps) => {
  const borderClass = isHighlighted
    ? "border-2 border-violet-500 dark:border-violet-700"
    : "border border-gray-200 dark:border-gray-800";

  const shadowClass = isHighlighted
    ? "shadow-md hover:shadow-lg"
    : "shadow-sm hover:shadow-md";

  return (
    <div
      className={`relative w-full rounded-2xl ${borderClass} p-8 ${shadowClass} flex flex-col gap-8 transition-all ${isHighlighted ? "lg:scale-105" : ""}`}
    >
      {badge && (
        <div className="absolute -top-5 right-0 left-0 mx-auto w-fit rounded-full bg-violet-500 px-4 py-1 text-center text-sm font-semibold text-white dark:bg-violet-700">
          {badge}
        </div>
      )}

      <h3 className="text-xl font-semibold">{name}</h3>
      <p className="text-sm text-gray-500 dark:text-gray-400">{description}</p>

      <div className="flex flex-col gap-1">
        <div className="flex items-baseline gap-x-1">
          <span className="text-4xl font-bold">{price}</span>
          <span className="text-gray-500 dark:text-gray-400">{priceLabel}</span>
        </div>

        {savings && savings > 0 && (
          <div className="inline-flex w-fit items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900 dark:text-green-300">
            Save {savings}%
          </div>
        )}
      </div>

      <FeaturesList features={features} extraFeatures={extraFeatures} />

      <CustomButton
        href={actionUrl}
        className="w-full"
        color={buttonColor || (isHighlighted ? "violet-600" : undefined)}
        size="md"
      >
        Get started
      </CustomButton>
    </div>
  );
};
