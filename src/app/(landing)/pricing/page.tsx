import { type Metadata } from "next";
import { APP_NAME } from "@/config/config";
import PricingPlans from "@/components/pricing/PricingPlans";
import { CustomButton } from "@/components/CustomButton";

export const metadata: Metadata = {
  title: `Pricing - ${APP_NAME}`,
  description: "Choose the plan that's right for you.",
};

export default function PricingPage() {
  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-20 px-4 py-24 sm:px-6 sm:py-32 lg:px-8">
      {/* Header */}
      <div className="mx-auto flex max-w-2xl flex-col gap-6 text-center">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          Simple, transparent pricing
        </h1>
        <p className="text-lg leading-8 text-gray-600 dark:text-gray-400">
          Choose the plan that works best for you. All plans include all
          features.
        </p>
      </div>

      {/* Pricing Cards */}
      <div>
        <PricingPlans />
      </div>

      {/* FAQ Section */}
      <div className="flex flex-col gap-12">
        <h2 className="text-center text-2xl font-bold tracking-tight sm:text-3xl">
          Frequently asked questions
        </h2>
        <div className="grid gap-8 lg:grid-cols-2">
          <div>
            <h3 className="text-lg font-semibold">Can I upgrade later?</h3>
            <p className="pt-2 text-gray-600 dark:text-gray-400">
              Yes, you can upgrade to a higher plan at any time. Your remaining
              balance will be prorated.
            </p>
          </div>
          <div>
            <h3 className="text-lg font-semibold">Do you offer refunds?</h3>
            <p className="pt-2 text-gray-600 dark:text-gray-400">
              We offer a 14-day money-back guarantee for all plans. If you're
              not satisfied, just let us know.
            </p>
          </div>
          <div>
            <h3 className="text-lg font-semibold">
              What payment methods do you accept?
            </h3>
            <p className="pt-2 text-gray-600 dark:text-gray-400">
              We accept all major credit cards and PayPal. For lifetime
              purchases, we also accept bank transfers.
            </p>
          </div>
          <div>
            <h3 className="text-lg font-semibold">
              Do I get access to future updates?
            </h3>
            <p className="pt-2 text-gray-600 dark:text-gray-400">
              Yes, all plans include access to future updates during your
              subscription period. Lifetime plans include all future updates
              forever.
            </p>
          </div>
        </div>
      </div>

      {/* Testimonials */}
      <div className="flex flex-col gap-12 rounded-2xl bg-gray-50 p-12 dark:bg-gray-900/50">
        <div className="mx-auto flex max-w-2xl flex-col gap-4 text-center">
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Loved by thousands of users worldwide
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Don't just take our word for it. Here's what our customers say.
          </p>
        </div>
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          <blockquote className="flex flex-col gap-4 rounded-xl bg-white p-6 shadow-sm dark:bg-gray-800">
            <p className="text-gray-600 dark:text-gray-400">
              "This product has completely transformed how I work. Worth every
              penny!"
            </p>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-700"></div>
              <div>
                <p className="font-medium">Alex Johnson</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Designer
                </p>
              </div>
            </div>
          </blockquote>
          <blockquote className="flex flex-col gap-4 rounded-xl bg-white p-6 shadow-sm dark:bg-gray-800">
            <p className="text-gray-600 dark:text-gray-400">
              "I was hesitant at first, but after trying it for a week, I
              immediately upgraded to the annual plan."
            </p>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-700"></div>
              <div>
                <p className="font-medium">Sarah Miller</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Product Manager
                </p>
              </div>
            </div>
          </blockquote>
          <blockquote className="flex flex-col gap-4 rounded-xl bg-white p-6 shadow-sm dark:bg-gray-800">
            <p className="text-gray-600 dark:text-gray-400">
              "The lifetime plan was a no-brainer for me. Best investment I've
              made this year."
            </p>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-700"></div>
              <div>
                <p className="font-medium">Michael Chen</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Entrepreneur
                </p>
              </div>
            </div>
          </blockquote>
        </div>
      </div>

      {/* CTA Section */}
      <div className="flex flex-col gap-8 text-center">
        <div className="flex flex-col gap-4">
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Ready to get started?
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Join thousands of satisfied customers today.
          </p>
        </div>
        <div className="flex flex-col justify-center gap-4 sm:flex-row">
          <CustomButton color="violet-600" size="lg">
            Choose a plan
          </CustomButton>
          <CustomButton size="lg">Contact sales</CustomButton>
        </div>
      </div>
    </div>
  );
}
