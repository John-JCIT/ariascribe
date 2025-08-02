"use client";

import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { APP_NAME } from "@/config/config";
import LandingSectionTitle from "./LandingSectionTitle";

function DiscountBadge() {
  return (
    <div className="inline-flex items-center rounded-full border border-violet-200 bg-violet-50 px-4 py-1 text-sm font-medium text-violet-600 dark:border-violet-900/50 dark:bg-violet-900/20 dark:text-violet-400">
      <span className="mr-1 text-xs">🎉</span> Limited time offer: 20% off
      annual plans
    </div>
  );
}

function GetStartedButton({
  variant = "default",
  className = "",
}: {
  variant?: "default" | "muted" | "annual";
  className?: string;
}) {
  const isPrimary = variant === "annual";

  return (
    <Button
      className={`${className} group flex items-center justify-center gap-2 ${
        isPrimary
          ? "bg-gradient-to-r from-violet-600 to-violet-800 hover:from-violet-700 hover:to-violet-900"
          : ""
      }`}
      variant={variant === "muted" ? "outline" : "default"}
    >
      Get started
      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
    </Button>
  );
}

export default function LandingPricing() {
  const planVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
  };

  return (
    <section id="pricing" className="w-full py-24">
      <div className="container mx-auto px-4">
        <LandingSectionTitle
          title="Simple, transparent pricing"
          description={`Try ${APP_NAME} free for 7 days. No credit card required.`}
        />
        <div className="mt-4 flex justify-center">
          <DiscountBadge />
        </div>

        <motion.div
          className="mx-auto mt-16 grid max-w-5xl grid-cols-1 gap-8 md:grid-cols-2"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <motion.div
            className="rounded-2xl border border-gray-200 p-8 shadow-sm dark:border-gray-800 dark:bg-gray-900/50"
            variants={planVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            whileHover={{ y: -8, transition: { duration: 0.2 } }}
          >
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Monthly
            </h3>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              For individuals exploring productivity tools
            </p>
            <p className="mt-8">
              <span className="text-4xl font-bold text-gray-900 dark:text-white">
                $19
              </span>
              <span className="text-gray-600 dark:text-gray-400">/month</span>
            </p>
            <GetStartedButton variant="muted" className="mt-8 w-full" />
            <p className="mt-4 text-sm text-gray-500 dark:text-gray-500">
              Flexible month-to-month plan with all essential features to boost
              your productivity.
            </p>
          </motion.div>

          <motion.div
            className="relative rounded-2xl border-2 border-violet-500 bg-violet-50/50 p-8 shadow-lg dark:border-violet-700 dark:bg-violet-900/10"
            variants={planVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            transition={{ delay: 0.2 }}
            whileHover={{ y: -8, transition: { duration: 0.2 } }}
          >
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 px-4 py-1 text-sm font-medium text-white">
              Most Popular
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Annual
            </h3>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              For committed professionals and teams
            </p>
            <p className="mt-8">
              <span className="text-4xl font-bold text-gray-900 dark:text-white">
                $15
              </span>
              <span className="text-gray-600 dark:text-gray-400">/month</span>
            </p>
            <div className="mt-4 rounded-lg bg-violet-100 p-3 text-sm text-violet-900 dark:bg-violet-900/30 dark:text-violet-200">
              <span className="font-medium">Save $48/year</span> with our annual
              billing plan
            </div>
            <GetStartedButton variant="annual" className="mt-8 w-full" />
            <ul className="mt-6 space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <li className="flex items-center gap-2">
                <span className="text-violet-500">✓</span> Priority customer
                support
              </li>
              <li className="flex items-center gap-2">
                <span className="text-violet-500">✓</span> Advanced analytics
                and reporting
              </li>
              <li className="flex items-center gap-2">
                <span className="text-violet-500">✓</span> Additional team
                collaboration features
              </li>
            </ul>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
