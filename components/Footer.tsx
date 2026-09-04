"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { BRAND } from "@/lib/data";
import { BookOpen, Mail, Phone, MapPin, ArrowUp, ChevronRight } from 'lucide-react';

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

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <motion.footer
      variants={footerVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-40px" }}
      className="mt-auto"
    >
      {/* Gold gradient top border */}
      <div
        style={{
          height: "1px",
          background: "linear-gradient(90deg, transparent, #c8a96e, transparent)",
        }}
      />

      {/* Main footer body */}
      <div
        className="bg-[var(--primary)] relative overflow-hidden"
        style={{
          backgroundImage:
            "radial-gradient(ellipse at 20% 50%, rgba(200,169,110,0.07) 0%, transparent 60%), radial-gradient(ellipse at 80% 20%, rgba(255,255,255,0.03) 0%, transparent 50%)",
        }}
      >
        <div className="container-lms py-14">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">

            {/* ── Brand column ── */}
            <div className="lg:col-span-2">
              <div className="flex items-center gap-3 mb-5">
                {/* Gold gradient icon container */}
                <div
                  className="w-10 h-10 rounded-[var(--radius-md)] flex items-center justify-center flex-shrink-0"
                  style={{
                    background: "linear-gradient(135deg, #c8a96e 0%, #b8944f 100%)",
                    boxShadow: "0 2px 12px rgba(200,169,110,0.35)",
                  }}
                >
                  <BookOpen className="w-5 h-5 text-white" aria-hidden="true" />
                </div>
                <div>
                  <span className="text-white font-bold text-base block leading-tight tracking-tight">
                    {BRAND.shortName}
                  </span>
                  <span className="text-[var(--accent)] text-[10px] uppercase tracking-widest block font-medium">
                    {BRAND.project}
                  </span>
                </div>
              </div>

              {/* Tagline */}
              <p className="text-[var(--accent)]/80 text-xs font-medium uppercase tracking-wider mb-3">
                {BRAND.tagline}
              </p>

              <p className="text-white/65 text-sm leading-relaxed max-w-sm mb-6">
                A comprehensive web-based Library Management System developed as a Final Year Project
                for {BRAND.institution}, Lahore. Built with the MERN stack.
              </p>

              {/* Contact info */}
              <div className="space-y-2.5">
                <div className="flex items-center gap-2.5 text-white/55 text-sm">
                  <MapPin className="w-3.5 h-3.5 text-[var(--accent)]/70 flex-shrink-0" aria-hidden="true" />
                  <span>NCBA&amp;E, Lahore, Pakistan</span>
                </div>
                <div className="flex items-center gap-2.5 text-white/55 text-sm">
                  <Mail className="w-3.5 h-3.5 text-[var(--accent)]/70 flex-shrink-0" aria-hidden="true" />
                  <span>library@ncbae.edu.pk</span>
                </div>
                <div className="flex items-center gap-2.5 text-white/55 text-sm">
                  <Phone className="w-3.5 h-3.5 text-[var(--accent)]/70 flex-shrink-0" aria-hidden="true" />
                  <span>+92 42 3570 0051</span>
                </div>
              </div>
            </div>

            {/* ── Navigation column ── */}
            <div>
              <h3 className="text-white font-semibold text-sm uppercase tracking-wider mb-5 pb-2 border-b border-white/10">
                Navigation
              </h3>
              <ul className="space-y-2.5">
                {footerLinks.map((link) => (
                  <li key={link.key}>
                    <Link
                      href={getNavHref(link.href)}
                      onClick={(e) => handleLinkClick(e, link.href)}
                      className="flex items-center gap-1.5 text-white/60 hover:text-[var(--accent)] text-sm transition-colors duration-200 group"
                    >
                      <ChevronRight
                        className="w-3 h-3 opacity-0 group-hover:opacity-100 -translate-x-1 group-hover:translate-x-0 transition-all duration-200"
                        aria-hidden="true"
                      />
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* ── Quick Links column ── */}
            <div>
              <h3 className="text-white font-semibold text-sm uppercase tracking-wider mb-5 pb-2 border-b border-white/10">
                Quick Access
              </h3>
              <ul className="space-y-2.5">
                {quickLinks.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="flex items-center gap-1.5 text-white/60 hover:text-[var(--accent)] text-sm transition-colors duration-200 group"
                    >
                      <ChevronRight
                        className="w-3 h-3 opacity-0 group-hover:opacity-100 -translate-x-1 group-hover:translate-x-0 transition-all duration-200"
                        aria-hidden="true"
                      />
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>

              {/* Back to top */}
              <button
                onClick={scrollToTop}
                className="mt-8 flex items-center gap-2 text-[var(--accent)]/70 hover:text-[var(--accent)] text-xs font-medium uppercase tracking-wider transition-colors duration-200 group"
                aria-label="Scroll back to top"
              >
                <span
                  className="w-6 h-6 rounded-full border border-[var(--accent)]/30 group-hover:border-[var(--accent)]/70 flex items-center justify-center transition-colors duration-200"
                >
                  <ArrowUp className="w-3 h-3" aria-hidden="true" />
                </span>
                Back to top
              </button>
            </div>
          </div>
        </div>

        {/* ── Bottom bar ── */}
        <div className="border-t border-white/10">
          <div className="container-lms py-5 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-white/40 text-xs text-center sm:text-left">
              &copy; {BRAND.year} {BRAND.name}. All rights reserved.
            </p>
            <p className="text-white/30 text-xs text-center sm:text-right">
              Developed by Rao Muhammad Hamza &mdash; {BRAND.project}, {BRAND.institution}
            </p>
          </div>
        </div>
      </div>
    </motion.footer>
  );
}
