"use client";

import {
  BeautifulOnboarder,
  type OnboardingStep,
} from "@/components/BeautifulOnboarder";
import { CommandPalette } from "@/components/CommandPalette";
import { RegisterHotkeys } from "@/components/RegisterHotkeys";
import { APP_NAME } from "@/config/config";
import { userHotkeys } from "@/config/hotkeys";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useIsImpersonating } from "@/hooks/useIsImpersonating";

// Define steps for onboarding
const onboardingSteps: OnboardingStep[] = [
  {
    key: "welcome",
    content: ({}) => (
      <div className="text-center">
        <h1 className="mb-4 text-3xl font-bold text-white drop-shadow-lg">
          Welcome to {APP_NAME}!
        </h1>
        <p className="mx-auto max-w-md text-lg text-white drop-shadow">
          Let's get you started with your new app.
        </p>
      </div>
    ),
  },
  {
    key: "features",
    content: ({}) => (
      <div className="text-center">
        <h1 className="mb-4 text-3xl font-bold text-white drop-shadow-lg">
          Key Features
        </h1>
        <p className="mx-auto max-w-md text-lg text-white drop-shadow">
          Discover all the powerful tools at your disposal.
        </p>
      </div>
    ),
  },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const user = useCurrentUser();
  const { isImpersonating } = useIsImpersonating();
  const showOnboarding = user && !user.onboarded && !isImpersonating;
  return (
    <>
      {/* global hotkeys that apply only when user is logged in */}
      <RegisterHotkeys hotkeys={userHotkeys} />
      <CommandPalette />
      {showOnboarding && <BeautifulOnboarder steps={onboardingSteps} />}
      {children}
    </>
  );
}
