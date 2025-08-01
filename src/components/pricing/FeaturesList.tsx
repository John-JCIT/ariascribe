import { CheckCircle } from "lucide-react";

type FeaturesListProps = {
  features: string[];
  extraFeatures?: string[];
};

export const FeaturesList = ({
  features,
  extraFeatures,
}: FeaturesListProps) => (
  <ul className="space-y-3">
    {features.map((feature) => (
      <li key={feature} className="flex items-start gap-3">
        <CheckCircle className="h-5 w-5 flex-shrink-0 text-green-500" />
        <span className="text-sm">{feature}</span>
      </li>
    ))}
    {extraFeatures?.map((feature) => (
      <li key={feature} className="flex items-start gap-3">
        <CheckCircle className="h-5 w-5 flex-shrink-0 text-purple-500" />
        <span className="text-sm font-medium">{feature}</span>
      </li>
    ))}
  </ul>
);
