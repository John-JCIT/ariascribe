"use client";

import React, { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "@/trpc/react";
import { CustomButton } from "./CustomButton";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { APP_NAME } from "@/config/config";
export type OnboardingStep = {
  key: string;
  content:
    | React.ReactNode
    | ((props: { nextStep: () => void }) => React.ReactNode);
  nextAction?: () => Promise<void> | void;
};

type BeautifulOnboarderProps = {
  steps: OnboardingStep[];
};

export function BeautifulOnboarder({ steps }: BeautifulOnboarderProps) {
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const [isActionRunning, setIsActionRunning] = useState(false);
  const router = useRouter();
  const utils = api.useUtils();

  const nextStep = useCallback(async () => {
    const currentStep = steps[activeStepIndex];
    if (currentStep?.nextAction) {
      setIsActionRunning(true);
      try {
        await currentStep.nextAction();
      } catch (error) {
        console.error("Error in step action:", error);
      } finally {
        setIsActionRunning(false);
      }
    }

    setActiveStepIndex((prev) => Math.min(prev + 1, steps.length));
  }, [activeStepIndex, steps]);

  const prevStep = useCallback(() => {
    setActiveStepIndex((prev) => Math.max(prev - 1, 0));
  }, []);

  const isOnFinalStep = activeStepIndex === steps.length;
  const totalSteps = steps.length + 1;

  const CurrentStepContent =
    !isOnFinalStep && activeStepIndex < steps.length
      ? typeof steps[activeStepIndex]?.content === "function"
        ? (steps[activeStepIndex]?.content as Function)({ nextStep })
        : steps[activeStepIndex]?.content
      : null;

  const FinalStep = () => {
    return (
      <div className="text-center">
        <h2 className="mb-4 text-3xl font-bold text-white">You're all set!</h2>
        <p className="mx-auto mb-6 max-w-md text-lg text-white">
          Ready to dive in?
        </p>
      </div>
    );
  };

  const MarkUserAsOnboardedButton = () => {
    const mutation = api.user.markUserAsOnboarded.useMutation({
      onSuccess: async () => {
        await utils.user.getCurrentUser.invalidate();
        router.refresh();
      },
      onError: (error) => {
        console.error("Onboarding failed:", error);
      },
    });

    return (
      <CustomButton
        onClick={() => mutation.mutate()}
        loading={mutation.isPending}
        className="bg-white/90 text-indigo-600 hover:bg-white"
      >
        Start Using {APP_NAME}
      </CustomButton>
    );
  };

  const pageVariants = {
    initial: { opacity: 0, x: 10 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -10 },
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-blue-500/60 via-purple-500/60 to-pink-500/60"
      style={{ backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)" }}
    >
      <div className="vertical relative z-10 w-full max-w-lg px-8 py-10">
        <div className="absolute top-0 right-0 left-0 flex justify-center">
          {activeStepIndex > 0 && (
            <CustomButton
              variant="link"
              onClick={prevStep}
              leftIcon={ChevronLeft}
              className="flex items-center text-xs font-medium text-white/50 transition-all hover:text-white/90"
            >
              Back
            </CustomButton>
          )}
        </div>

        <div className="min-h-[250px] w-full">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeStepIndex}
              initial="initial"
              animate="animate"
              exit="exit"
              variants={pageVariants}
              transition={{ duration: 0.2 }}
            >
              {!isOnFinalStep ? CurrentStepContent : <FinalStep />}
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="mt-8 h-12 text-center">
          {!isOnFinalStep && activeStepIndex < steps.length && (
            <CustomButton
              onClick={nextStep}
              loading={isActionRunning}
              className="bg-white/90 text-indigo-600 hover:bg-white"
            >
              Next
            </CustomButton>
          )}
          {isOnFinalStep && <MarkUserAsOnboardedButton />}
        </div>

        <div className="mt-6 flex justify-center gap-3">
          {Array.from({ length: totalSteps }).map((_, index) => (
            <div
              key={index}
              className={cn(
                "h-2.5 w-2.5 rounded-full bg-white",
                activeStepIndex === index ? "opacity-100" : "opacity-40",
              )}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
