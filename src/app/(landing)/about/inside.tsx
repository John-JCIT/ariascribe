"use client";

import {
  ArrowRight,
  CheckCircle2,
  HeartHandshake,
  Lightbulb,
  Users,
} from "lucide-react";
import Link from "next/link";
import { createAvatar } from "@dicebear/core";
import { personas } from "@dicebear/collection";
import { motion } from "framer-motion";
import { GradientText } from "@/components/GradientText";

export default function AboutPageContent() {
  // Generate team avatars using DiceBear
  const teamAvatars = [
    createAvatar(personas, {
      seed: "jane",
      backgroundColor: ["b6e3f4"],
    }).toDataUri(),
    createAvatar(personas, {
      seed: "john",
      backgroundColor: ["c0aede"],
    }).toDataUri(),
    createAvatar(personas, {
      seed: "sarah",
      backgroundColor: ["ffdfbf"],
    }).toDataUri(),
  ];

  // Animation variants
  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6 },
    },
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
      },
    },
  };

  const scaleUp = {
    hidden: { scale: 0.8, opacity: 0 },
    visible: {
      scale: 1,
      opacity: 1,
      transition: { type: "spring", stiffness: 100 },
    },
  };

  return (
    <div className="container max-w-4xl py-10 lg:py-16">
      {/* Hero Section */}
      <motion.div
        className="mb-16 text-center"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-50px" }}
        variants={fadeIn}
      >
        <div className="relative mb-3">
          <motion.div
            className="from-primary/20 to-primary-foreground/5 absolute inset-0 -z-10 mx-auto h-full w-3/4 rounded-full bg-gradient-to-tr blur-3xl"
            animate={{
              scale: [1, 1.1, 1],
              opacity: [0.5, 0.7, 0.5],
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              repeatType: "reverse",
            }}
          />
          <h1 className="font-heading mb-2 text-5xl font-bold lg:text-6xl">
            <GradientText
              size="text-5xl lg:text-6xl"
              className="bg-gradient-to-r from-violet-500 to-violet-700"
            >
              Our Story
            </GradientText>
          </h1>
        </div>
        <p className="text-muted-foreground mx-auto max-w-2xl text-xl">
          Building tools that help businesses scale and succeed in the digital
          economy.
        </p>
      </motion.div>

      {/* Team Section - Moved higher */}
      <motion.div
        className="mb-16"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-50px" }}
        variants={staggerContainer}
      >
        <motion.div
          className="grid grid-cols-1 gap-8 md:grid-cols-3"
          variants={staggerContainer}
        >
          {[
            { avatar: teamAvatars[0], name: "Jane Doe", role: "Founder & CEO" },
            { avatar: teamAvatars[1], name: "John Smith", role: "CTO" },
            {
              avatar: teamAvatars[2],
              name: "Sarah Johnson",
              role: "Lead Designer",
            },
          ].map((member, index) => (
            <motion.div
              key={index}
              className="text-center"
              variants={scaleUp}
              whileHover={{ y: -10, transition: { duration: 0.3 } }}
            >
              <div className="mx-auto mb-6">
                <div className="bg-muted border-primary/10 mx-auto flex h-36 w-36 items-center justify-center overflow-hidden rounded-full border-2">
                  <img
                    src={member.avatar}
                    alt={member.name}
                    className="h-full w-full object-cover"
                  />
                </div>
              </div>
              <h3 className="text-lg font-bold">{member.name}</h3>
              <p className="text-muted-foreground">{member.role}</p>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>

      {/* Mission Section */}
      <motion.div
        className="mb-16"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-50px" }}
        variants={fadeIn}
      >
        <div className="border-primary/20 relative overflow-hidden rounded-xl border p-8">
          <div className="from-primary/10 via-background absolute inset-0 bg-gradient-to-br to-violet-500/10" />
          <div className="relative z-10">
            <motion.h2
              className="font-heading mb-3 text-3xl font-bold"
              variants={{
                hidden: { opacity: 0, x: -20 },
                visible: { opacity: 1, x: 0, transition: { duration: 0.5 } },
              }}
            >
              <GradientText
                size="text-3xl"
                className="bg-gradient-to-r from-violet-500 to-violet-700"
              >
                Our Mission
              </GradientText>
            </motion.h2>
            <motion.p
              className="text-muted-foreground mb-6"
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: {
                  opacity: 1,
                  y: 0,
                  transition: { duration: 0.5, delay: 0.2 },
                },
              }}
            >
              We believe that powerful tools should be accessible to everyone.
              Our mission is to democratize business solutions and empower
              entrepreneurs to focus on what they do best - creating value for
              their customers.
            </motion.p>
            <motion.p
              className="text-muted-foreground"
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: {
                  opacity: 1,
                  y: 0,
                  transition: { duration: 0.5, delay: 0.4 },
                },
              }}
            >
              Every feature we build is designed with simplicity and
              effectiveness in mind, ensuring you can grow your business without
              complexity getting in the way.
            </motion.p>
          </div>
        </div>
      </motion.div>

      {/* Values Section */}
      <motion.div
        className="mb-16"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-50px" }}
        variants={staggerContainer}
      >
        <motion.h2
          className="font-heading mb-3 text-3xl font-bold"
          variants={fadeIn}
        >
          <GradientText
            size="text-3xl"
            className="bg-gradient-to-r from-violet-500 to-violet-700"
          >
            Our Values
          </GradientText>
        </motion.h2>
        <motion.div
          className="grid grid-cols-1 gap-6 md:grid-cols-2"
          variants={staggerContainer}
        >
          {[
            {
              title: "Simplicity",
              description:
                "We believe in creating straightforward solutions that solve real problems without unnecessary complexity.",
              icon: CheckCircle2,
            },
            {
              title: "Transparency",
              description:
                "Open communication and honest business practices are at the core of everything we do.",
              icon: HeartHandshake,
            },
            {
              title: "Innovation",
              description:
                "We're constantly exploring new ways to improve our products and create more value for our users.",
              icon: Lightbulb,
            },
            {
              title: "Customer-Centric",
              description:
                "Your success is our success. We prioritize features that directly impact your bottom line.",
              icon: Users,
            },
          ].map((value, index) => (
            <motion.div
              key={index}
              className="border-primary/20 from-background to-primary/5 hover:from-primary/10 rounded-lg border bg-gradient-to-br p-6 transition-colors hover:to-violet-500/10"
              variants={scaleUp}
              whileHover={{
                y: -5,
                boxShadow:
                  "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
                transition: { duration: 0.3 },
              }}
            >
              <div className="flex items-start gap-4">
                <div className="mt-1">
                  <value.icon className="text-primary h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-primary mb-2 text-lg font-bold">
                    {value.title}
                  </h3>
                  <p className="text-muted-foreground">{value.description}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>

      {/* CTA Section */}
      <motion.div
        className="relative overflow-hidden rounded-xl p-8 text-center"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-50px" }}
        variants={fadeIn}
      >
        <div className="from-primary/20 via-background absolute inset-0 bg-gradient-to-br to-violet-500/20" />
        <div className="relative z-10">
          <motion.h2
            className="font-heading mb-3 text-3xl font-bold"
            variants={{
              hidden: { opacity: 0, scale: 0.9 },
              visible: { opacity: 1, scale: 1, transition: { duration: 0.5 } },
            }}
          >
            <GradientText
              size="text-3xl"
              className="bg-gradient-to-r from-violet-500 to-violet-700"
            >
              Ready to get started?
            </GradientText>
          </motion.h2>
          <motion.p
            className="text-muted-foreground mx-auto mb-6 max-w-xl"
            variants={{
              hidden: { opacity: 0, y: 20 },
              visible: {
                opacity: 1,
                y: 0,
                transition: { duration: 0.5, delay: 0.2 },
              },
            }}
          >
            Join thousands of businesses already using our platform to grow
            their revenue.
          </motion.p>
          <motion.div
            variants={{
              hidden: { opacity: 0, y: 20 },
              visible: {
                opacity: 1,
                y: 0,
                transition: { duration: 0.5, delay: 0.4 },
              },
            }}
          >
            <Link
              href="/blog"
              className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex items-center gap-2 rounded-md px-6 py-3 font-medium transition-colors"
            >
              Learn More
              <ArrowRight className="h-4 w-4" />
            </Link>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
