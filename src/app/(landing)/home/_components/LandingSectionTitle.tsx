"use client";
import { motion } from "framer-motion";

interface LandingSectionTitleProps {
  title: string;
  description: string;
  className?: string;
}

export default function LandingSectionTitle({
  title,
  description,
  className = "",
}: LandingSectionTitleProps) {
  return (
    <motion.div
      className={`mb-16 text-center ${className}`}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.5 }}
    >
      <h2 className="mb-4 text-3xl font-bold md:text-4xl">{title}</h2>
      <p className="mx-auto max-w-2xl text-gray-600 dark:text-gray-400">
        {description}
      </p>
    </motion.div>
  );
}
