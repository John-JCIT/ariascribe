"use client";
import Image from "next/image";
import { Star } from "lucide-react";
import { createAvatar } from "@dicebear/core";
import { lorelei } from "@dicebear/collection";
import { motion } from "framer-motion";
import { APP_NAME } from "@/config/config";
import LandingSectionTitle from "./LandingSectionTitle";

// Animated stars component
const TestimonialStars = ({ count }: { count: number }) => {
  return (
    <div className="flex">
      {Array(count)
        .fill(0)
        .map((_, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10, scale: 0.5 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: i * 0.1, duration: 0.3 }}
            viewport={{ once: true, margin: "-50px" }}
          >
            <Star className="h-4 w-4 fill-violet-400 text-violet-400" />
          </motion.div>
        ))}
    </div>
  );
};

export default function LandingTestimonials() {
  // Generate avatar data URIs with DiceBear
  const avatars = ["sarah", "mark", "jessica"].map((seed) =>
    createAvatar(lorelei, {
      seed,
      backgroundColor: ["b6e3f4", "c0aede", "d1d4f9"],
    }).toDataUri(),
  );

  const testimonials = [
    {
      avatar: avatars[0] || "",
      name: "Sarah Johnson",
      role: "CEO, TechStart",
      content: `${APP_NAME} has completely transformed how we operate. The ROI has been incredible, and our team productivity is up by 40%.`,
      stars: 5,
    },
    {
      avatar: avatars[1] || "",
      name: "Mark Thompson",
      role: "Marketing Director",
      content: `I've tried many similar tools, but nothing compares to the ease of use and powerful features ${APP_NAME} offers.`,
      stars: 5,
    },
    {
      avatar: avatars[2] || "",
      name: "Jessica Williams",
      role: "Product Designer",
      content:
        "The customer support is exceptional, and the platform keeps getting better with every update. Absolutely worth the investment.",
      stars: 4,
    },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
  };

  return (
    <section className="w-full py-24">
      <div className="container mx-auto px-4">
        <LandingSectionTitle
          title="What Our Clients Say"
          description={`Don't just take our word for it. Here's what our customers have to say about their experience with ${APP_NAME}.`}
        />

        <motion.div
          className="grid grid-cols-1 gap-8 md:grid-cols-3"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
        >
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={index}
              variants={itemVariants}
              className="relative flex flex-col overflow-hidden rounded-xl border border-gray-100 bg-white/50 p-8 backdrop-blur-sm dark:border-gray-700 dark:bg-gray-800/50"
              whileHover={{
                y: -10,
                boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
                transition: { duration: 0.3 },
              }}
            >
              <motion.div
                className="mb-6 flex items-center"
                whileHover={{ scale: 1.03 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <div className="relative mr-4 h-12 w-12 overflow-hidden rounded-full">
                  <Image
                    src={testimonial.avatar}
                    alt={testimonial.name}
                    fill
                    className="object-cover"
                  />
                </div>
                <div>
                  <h4 className="font-semibold">{testimonial.name}</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {testimonial.role}
                  </p>
                </div>
              </motion.div>

              <p className="mb-6 flex-grow text-gray-600 italic dark:text-gray-300">
                "{testimonial.content}"
              </p>

              <div className="flex items-center">
                <TestimonialStars count={testimonial.stars} />
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
