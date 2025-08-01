"use client";
import Link from "next/link";
import { Twitter, Github } from "lucide-react";
import { Logo } from "@/components/core/Logo";
import { motion } from "framer-motion";
import { APP_NAME } from "@/config/config";

export default function LandingFooter() {
  // Simplified footer links with fewer categories
  const footerLinks = [
    {
      title: "Product",
      links: [
        { label: "Features", href: "#" },
        { label: "Pricing", href: "#" },
      ],
    },
    {
      title: "Resources",
      links: [
        { label: "Documentation", href: "#" },
        { label: "Help Center", href: "#" },
      ],
    },
    {
      title: "Legal",
      links: [
        { label: "Privacy Policy", href: "#" },
        { label: "Terms of Service", href: "#" },
      ],
    },
  ];

  // Simplified social links
  const socialLinks = [
    { icon: <Twitter className="h-5 w-5" />, href: "#", label: "Twitter" },
    { icon: <Github className="h-5 w-5" />, href: "#", label: "GitHub" },
  ];

  return (
    <footer className="mx-auto mt-auto w-full max-w-[var(--container-max-width)] border-t border-gray-200 dark:border-gray-800">
      <div className="container mx-auto px-4 pt-8">
        <motion.div
          className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Logo and description */}
          <div className="col-span-1">
            <Logo />
            <p className="mt-3 text-sm text-gray-600 dark:text-gray-400">
              Helping businesses grow with {APP_NAME}.
            </p>
            <div className="mt-4 flex space-x-4">
              {socialLinks.map((link, i) => (
                <Link
                  key={i}
                  href={link.href}
                  className="text-gray-500 transition-colors duration-200 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                  aria-label={link.label}
                >
                  {link.icon}
                </Link>
              ))}
            </div>
          </div>

          {/* Footer navigation - simplified */}
          {footerLinks.map((section, i) => (
            <div key={i} className="col-span-1">
              <h3 className="mb-3 font-semibold text-gray-900 dark:text-white">
                {section.title}
              </h3>
              <ul className="space-y-1">
                {section.links.map((link, j) => (
                  <li key={j}>
                    <Link
                      href={link.href}
                      className="text-sm text-gray-600 transition-colors duration-200 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </motion.div>
      </div>

      {/* Giant app name that appears when in view */}
      <div className="relative w-full overflow-hidden">
        <motion.div
          className="pointer-events-none -mt-6 hidden overflow-hidden bg-gradient-to-b from-gray-900/10 from-25% to-gray-900/0 bg-clip-text text-[14rem] leading-none font-black text-transparent select-none sm:block sm:h-36 md:h-48 md:text-[18rem] lg:h-60 lg:text-[22rem] dark:from-white/10 dark:to-white/0"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          {APP_NAME}
        </motion.div>
      </div>
    </footer>
  );
}
