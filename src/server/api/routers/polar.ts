import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";
import { serverEnv } from "@/env";

const polarSubscriptionSchema = z.object({
  id: z.string(),
  status: z.string(),
  amount: z.number(),
  currency: z.string(),
  recurringInterval: z.string(),
  currentPeriodEnd: z.string(),
  cancelAtPeriodEnd: z.boolean(),
  startedAt: z.string().nullable(),
  endsAt: z.string().nullable(),
});

const polarGrantedBenefitSchema = z.object({
  id: z.string(),
  grantedAt: z.string(),
  benefitId: z.string(),
  benefitType: z.string(),
  properties: z.record(z.unknown()).optional(),
});

const polarStateSchema = z.object({
  id: z.string(),
  activeSubscriptions: z.array(polarSubscriptionSchema),
  grantedBenefits: z.array(polarGrantedBenefitSchema).optional(),
});

export const polarRouter = createTRPCRouter({
  getBillingState: publicProcedure.query(async ({ ctx }) => {
    try {
      // Return NoOp if no Polar keys are configured
      if (!serverEnv.NEXT_PUBLIC_ENABLE_POLAR) {
        return {
          id: "noop",
          activeSubscriptions: [],
          grantedBenefits: [],
          isPro: false,
        };
      }

      const url = `${serverEnv.NEXT_PUBLIC_APP_URL}/api/auth/state`;
      const cookieHeader = ctx.headers.get("cookie");
      const response = await fetch(url, {
        headers: cookieHeader ? { cookie: cookieHeader } : {},
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch billing state: ${response.status}`);
      }

      const rawData = await response.json();
      const parsedData = polarStateSchema.parse(rawData);

      const proBenefitId =
        serverEnv.NEXT_PUBLIC_POLAR_ENV === "sandbox"
          ? serverEnv.POLAR_BENEFIT_PRO_ID_SANDBOX
          : serverEnv.POLAR_BENEFIT_PRO_ID_PROD;

      const isPro =
        proBenefitId && parsedData.grantedBenefits
          ? parsedData.grantedBenefits.some(
              (benefit) => benefit.benefitId === proBenefitId,
            )
          : false;

      return { ...parsedData, isPro };
    } catch (error) {
      console.error("Error fetching billing state:", error);
      throw error;
    }
  }),
});
