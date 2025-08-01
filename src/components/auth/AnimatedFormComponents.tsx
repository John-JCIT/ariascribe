"use client";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { AuthFormHeader } from "@/components/auth/AuthFormHeader";
import { type ReactNode } from "react";
import { cn } from "@/lib/utils";

interface AnimatedFormWrapperProps {
  className?: string;
  children: ReactNode;
}

export function AnimatedFormWrapper({
  className,
  children,
}: AnimatedFormWrapperProps) {
  return (
    <div className={cn("flex flex-col gap-6", className)}>
      <motion.div
        layout
        transition={{
          layout: { duration: 0.6, type: "spring", bounce: 0.2 },
        }}
      >
        <Card className="overflow-hidden">{children}</Card>
      </motion.div>
    </div>
  );
}

interface AnimatedFormHeaderProps {
  title: string;
  description: string;
}

export function AnimatedFormHeader({
  title,
  description,
}: AnimatedFormHeaderProps) {
  return <AuthFormHeader title={title} description={description} />;
}

interface AnimatedFormContentProps {
  children: ReactNode;
}

export function AnimatedFormContent({ children }: AnimatedFormContentProps) {
  return (
    <motion.div
      layout
      transition={{
        layout: { duration: 0.5, ease: [0.33, 1, 0.68, 1] },
      }}
    >
      <CardContent>{children}</CardContent>
    </motion.div>
  );
}

interface AnimatedFormFieldsProps {
  children: ReactNode;
  isVisible: boolean;
}

export function AnimatedFormFields({
  children,
  isVisible,
}: AnimatedFormFieldsProps) {
  return (
    <AnimatePresence mode="wait">
      {isVisible && (
        <motion.div
          key="form-fields"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="space-y-4">{children}</div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

interface AnimatedSuccessContentProps {
  children: ReactNode;
  isVisible: boolean;
}

export function AnimatedSuccessContent({
  children,
  isVisible,
}: AnimatedSuccessContentProps) {
  return (
    <AnimatePresence mode="wait">
      {isVisible && (
        <motion.div
          key="success"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.5 }}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
