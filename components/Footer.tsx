"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { BRAND } from "@/lib/data";
import { BookOpen, Mail, Phone, MapPin } from 'lucide-react';

const footerVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: "easeOut" },
  },
};

const footerLinks = [
  { label: "Dashboard", href: "/dashboard", key: "dashboard" },
  { label: "Book Search", href: "/books/search", key: "book-search" },
  { label: "Issue & Return", href: "/transactions/issue-return", key: "issue-return" },
  { label: "My Fines", href: "/fines", key: "fines" },
  { label: "Admin Panel", href: "/admin/dashboard", key: "admin" },
];

const quickLinks = [
  { label: "Login", href: "/login" },
  { label: "Dashboard", href: "/dashboard" },
  { label: "Book Search", href: "/books/search" },
  { label: "Transactions", href: "/transactions/issue-return" },
  { label: "Fine Management", href: "/fines" },
];

export default function Footer() {
  const t = useTranslations();
  const navT = (t.raw("nav") as Record<string, string>) ?? {};
  const pathname = usePathname();

  const getNavHref = (href: string) => {
    if (href.startsWith("#")) {
      return pathname === "/" ? href : "/" + href;
    }
    return href;
  };

  const handleLinkClick = (
    e: React.MouseEvent<HTMLAnchorElement>,
    href: string
  ) => {
    if (href.startsWith("#") && pathname === "/") {
      e.preventDefault();
      document.querySelector(href)?.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <motion.footer
      variants={footerVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-40px" }}
      className="bg-[var(--primary)] text-white mt-auto"
    >
      {/* Main footer content */}
      <div className="container-lms py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand column */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 rounded-[var(--radius)] bg-[var(--accent)] flex items-center justify-center flex-shrink-0">
                <BookOpen className="w-4 h-4 text-[var(--foreground)]" aria-hidden="true" />
              </div>
              <div>
                <span className="text-white font-semibold text-sm block leading-tight">
                  {BRAND.shortName}
                </span>
                <span className="text-white/50 text-[10px] uppercase tracking-wide block">
                  {BRAND.project}
                </span>
              </div>
            </div>
            <p className="text-white/70 text-sm leading-relaxed max-w-sm mb-4">
              A comprehensive library management portal for {BRAND.institution}.
              Manage books, members, issue and return workflows, and fine tracking
              — all in one secure, role-aware system.
            </p>
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2 text-white/60 text-xs">
                <MapPin className="w-3.5 h-3.5 flex-shrink-0" aria-hidden="true" />
                <span>National College of Business Administration &amp; Economics</span>
              </div>
              <div className="flex items-center gap-2 text-white/60 text-xs">
                <Mail className="w-3.5 h-3.5 flex-shrink-0" aria-hidden="true" />
                <span>library@ncbae.edu.pk</span>
              </div>
              <div className="flex items-center gap-2 text-white/60 text-xs">
                <Phone className="w-3.5 h-3.5 flex-shrink-0" aria-hidden="true" />
                <span>+92-42-35761999</span>
              </div>
            </div>
          </div>

          {/* Navigation links */}
          <div>
            <h3 className="text-white font-semibold text-sm mb-4 uppercase tracking-wide">
              Navigation
            </h3>
            <ul className="flex flex-col gap-2">
              {footerLinks.map((link) => {
                const label = navT[link.key] ?? link.label;
                return (
                  <li key={link.key}>
                    <Link
                      href={getNavHref(link.href)}
                      onClick={(e) => handleLinkClick(e, link.href)}
                      className="text-white/70 hover:text-[var(--accent)] text-sm transition-colors duration-200"
                    >
                      {label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Tech stack */}
          <div>
            <h3 className="text-white font-semibold text-sm mb-4 uppercase tracking-wide">
              Built With
            </h3>
            <ul className="flex flex-col gap-2">
              {[
                "MongoDB Atlas",
                "Express.js",
                "React.js",
                "Node.js",
                "Tailwind CSS",
                "JWT Authentication",
                "Supabase",
              ].map((tech) => (
                <li key={tech} className="text-white/60 text-sm flex items-center gap-1.5">
                  <span className="w-1 h-1 rounded-full bg-[var(--accent)] flex-shrink-0" aria-hidden="true" />
                  {tech}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/10">
        <div className="container-lms py-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-white/50 text-xs text-center sm:text-left">
            &copy; {BRAND.year} {BRAND.name}. All rights reserved. {BRAND.project}.
          </p>
          <div className="flex items-center gap-4">
            {quickLinks.slice(0, 3).map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-white/40 hover:text-white/70 text-xs transition-colors duration-200"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </motion.footer>
  );
}