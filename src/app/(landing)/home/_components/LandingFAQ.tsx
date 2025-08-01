"use client";
import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { APP_NAME } from "@/config/config";
import LandingSectionTitle from "./LandingSectionTitle";

interface FAQItemProps {
  question: string;
  answer: string;
  isOpen: boolean;
  toggleOpen: () => void;
  index: number;
}

function FAQItem({
  question,
  answer,
  isOpen,
  toggleOpen,
  index,
}: FAQItemProps) {
  return (
    <motion.div
      className="border-b border-gray-200 py-5 dark:border-gray-700"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.3, delay: index * 0.1 }}
    >
      <button
        className="flex w-full items-center justify-between text-left"
        onClick={toggleOpen}
      >
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
          {question}
        </h3>
        <motion.span
          className="ml-6 flex-shrink-0"
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.3 }}
        >
          <ChevronDown className="h-5 w-5 text-gray-500 dark:text-gray-400" />
        </motion.span>
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="mt-3 pr-12"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <p className="text-base text-gray-600 dark:text-gray-400">
              {answer}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function LandingFAQ() {
  const faqItems = [
    {
      question: `How much does ${APP_NAME} cost?`,
      answer:
        "We offer flexible pricing plans starting at $29/month. Enterprise plans with custom features are also available. Contact our sales team for more details.",
    },
    {
      question: "Do you offer a free trial?",
      answer:
        "Yes, we offer a 14-day free trial with full access to all features. No credit card required to get started.",
    },
    {
      question: "How secure is my data?",
      answer: `${APP_NAME} implements bank-level security measures including 256-bit encryption, regular security audits, and compliance with SOC 2 and GDPR requirements.`,
    },
    {
      question: "Can I cancel my subscription anytime?",
      answer:
        "Absolutely. You can cancel your subscription at any time with no questions asked and no hidden fees.",
    },
    {
      question: "What kind of support do you offer?",
      answer:
        "We provide 24/7 support via email, live chat, and phone for all paying customers. Free users have access to our comprehensive knowledge base and community forums.",
    },
  ];

  const [openIndex, setOpenIndex] = useState(0);

  const toggleFAQ = (index: number) => {
    setOpenIndex(index === openIndex ? -1 : index);
  };

  return (
    <section className="w-full py-24">
      <div className="container mx-auto px-4">
        <LandingSectionTitle
          title="Frequently Asked Questions"
          description={`Find answers to common questions about ${APP_NAME}, pricing, and support.`}
        />

        <motion.div
          className="mx-auto max-w-3xl"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          {faqItems.map((item, index) => (
            <FAQItem
              key={index}
              index={index}
              question={item.question}
              answer={item.answer}
              isOpen={index === openIndex}
              toggleOpen={() => toggleFAQ(index)}
            />
          ))}
        </motion.div>
      </div>
    </section>
  );
}
