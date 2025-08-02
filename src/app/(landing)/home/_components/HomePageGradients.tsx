"use client";
import { useId } from "react";
import { motion } from "framer-motion";

interface GradientProps {
  className?: string;
  colorClass: string;
}

// Individual gradient component that can be positioned anywhere
export function Gradient({ className, colorClass }: GradientProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 0.5, scale: 1 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className={`absolute rounded-full bg-gradient-to-br ${colorClass} opacity-50 blur-3xl ${className || ""}`}
    />
  );
}

export default function HomePageGradients() {
  const id = useId();

  // Define fixed gradients with set colors and positions
  const gradients = [
    {
      className: "top-0 left-10 h-36 w-36",
      colorClass: "from-blue-600 to-purple-600",
    },
    {
      className: "top-96 right-0 h-48 w-48",
      colorClass: "from-purple-600 to-pink-600",
    },
    {
      className: "top-[40rem] left-1/4 h-40 w-40",
      colorClass: "from-blue-600 to-teal-600",
    },
    {
      className: "top-[80rem] right-1/4 h-36 w-36",
      colorClass: "from-indigo-600 to-blue-600",
    },
    {
      className: "top-[120rem] left-10 h-44 w-44",
      colorClass: "from-pink-600 to-orange-600",
    },
    {
      className: "top-[160rem] right-10 h-32 w-32",
      colorClass: "from-blue-600 to-purple-600",
    },
  ];

  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      {gradients.map((props, index) => (
        <Gradient key={`${id}-${index}`} {...props} />
      ))}
    </div>
  );
}
