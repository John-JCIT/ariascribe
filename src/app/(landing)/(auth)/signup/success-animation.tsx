"use client";
import { motion } from "framer-motion";
import { Mail, Sparkles, Star } from "lucide-react";

interface EmailSentAnimationProps {
  description?: string;
}

export const EmailSentAnimation = ({
  description = "Thank you for signing up! We've sent a verification link to your email address.",
}: EmailSentAnimationProps) => {
  return (
    <div className="flex flex-col items-center space-y-6">
      <div className="relative mx-auto flex h-40 w-40 items-center justify-center">
        {/* Mail icon with bounce animation */}
        <motion.div
          className="z-10 text-white"
          initial={{ y: 0, scale: 0.8, opacity: 0 }}
          animate={{
            y: [-5, 5, -5],
            scale: 1.2,
            opacity: 1,
          }}
          transition={{
            y: {
              duration: 2,
              ease: "easeInOut",
              repeat: Infinity,
            },
            scale: {
              duration: 0.5,
            },
            opacity: {
              duration: 0.5,
            },
          }}
        >
          <Mail size={48} className="text-violet-500" />
        </motion.div>

        {/* Small decorative elements */}
        <motion.div
          className="absolute top-[25%] left-[20%] text-yellow-400"
          initial={{ opacity: 0, scale: 0.5, rotate: 0 }}
          animate={{
            opacity: [0, 1, 0],
            scale: [0.5, 1.2, 0.5],
            rotate: 180,
          }}
          transition={{
            duration: 2,
            ease: "easeInOut",
            repeat: Infinity,
            delay: 0.2,
          }}
        >
          <Star size={12} fill="currentColor" />
        </motion.div>

        <motion.div
          className="absolute top-[30%] left-[70%] text-blue-400"
          initial={{ opacity: 0, scale: 0.5, rotate: 0 }}
          animate={{
            opacity: [0, 1, 0],
            scale: [0.5, 1.2, 0.5],
            rotate: -180,
          }}
          transition={{
            duration: 2.3,
            ease: "easeInOut",
            repeat: Infinity,
            delay: 0.5,
          }}
        >
          <Sparkles size={14} />
        </motion.div>

        <motion.div
          className="absolute top-[70%] left-[30%] text-green-400"
          initial={{ opacity: 0, scale: 0.5, rotate: 0 }}
          animate={{
            opacity: [0, 1, 0],
            scale: [0.5, 1.2, 0.5],
            rotate: 180,
          }}
          transition={{
            duration: 1.8,
            ease: "easeInOut",
            repeat: Infinity,
            delay: 0.7,
          }}
        >
          <Star size={10} fill="currentColor" />
        </motion.div>

        <motion.div
          className="absolute top-[65%] left-[65%] text-purple-400"
          initial={{ opacity: 0, scale: 0.5, rotate: 0 }}
          animate={{
            opacity: [0, 1, 0],
            scale: [0.5, 1.2, 0.5],
            rotate: -180,
          }}
          transition={{
            duration: 2.1,
            ease: "easeInOut",
            repeat: Infinity,
            delay: 0.4,
          }}
        >
          <Sparkles size={12} />
        </motion.div>

        {/* Add subtle glow animation to the background */}
        <motion.div
          className="bg-primary/5 absolute inset-0 rounded-full opacity-50"
          animate={{
            scale: [0.8, 1.1, 0.8],
          }}
          transition={{
            duration: 3,
            ease: "easeInOut",
            repeat: Infinity,
          }}
        />
      </div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.5 }}
        className="text-center text-sm"
      >
        {description}
      </motion.p>
    </div>
  );
};
