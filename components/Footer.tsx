"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
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
                A comprehensive library management portal for {BRAND.institution}.
                Manage books, members, issue and return workflows, and fine tracking
                — all in one secure, role-aware system.
              </p>

              {/* Contact info with icons */}
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-2.5 group">
                  <div className="w-7 h-7 rounded-lg bg-[var(--accent)]/10 flex items-center justify-center flex-shrink-0 group-hover:bg-[var(--accent)]/20 transition-colors duration-200">
                    <MapPin className="w-3.5 h-3.5 text-[var(--accent)]" aria-hidden="true" />
                  </div>
                  <span className="text-white/60 text-xs leading-snug">
                    National College of Business Administration &amp; Economics, Lahore
                  </span>
                </div>
                <div className="flex items-center gap-2.5 group">
                  <div className="w-7 h-7 rounded-lg bg-[var(--accent)]/10 flex items-center justify-center flex-shrink-0 group-hover:bg-[var(--accent)]/20 transition-colors duration-200">
                    <Mail className="w-3.5 h-3.5 text-[var(--accent)]" aria-hidden="true" />
                  </div>
                  <a
                    href="mailto:library@ncbae.edu.pk"
                    className="text-white/60 text-xs hover:text-[var(--accent)] transition-colors duration-200"
                  >
                    library@ncbae.edu.pk
                  </a>
                </div>
                <div className="flex items-center gap-2.5 group">
                  <div className="w-7 h-7 rounded-lg bg-[var(--accent)]/10 flex items-center justify-center flex-shrink-0 group-hover:bg-[var(--accent)]/20 transition-colors duration-200">
                    <Phone className="w-3.5 h-3.5 text-[var(--accent)]" aria-hidden="true" />
                  </div>
                  <a
                    href="tel:+924235761999"
                    className="text-white/60 text-xs hover:text-[var(--accent)] transition-colors duration-200"
                  >
                    +92-42-35761999
                  </a>
                </div>
              </div>
            </div>

            {/* ── Navigation links ── */}
            <div>
              <h3 className="text-white font-semibold text-sm mb-5 flex items-center gap-2">
                <span
                  className="inline-block w-4 h-0.5 rounded-full"
                  style={{ background: "linear-gradient(90deg, #c8a96e, #b8944f)" }}
                />
                Navigation
              </h3>
              <ul className="flex flex-col gap-1">
                {footerLinks.map((link) => (
                  <li key={link.key}>
                    <Link
                      href={getNavHref(link.href)}
                      onClick={(e) => handleLinkClick(e, link.href)}
                      className="group flex items-center gap-2 text-white/60 text-sm py-1.5 hover:text-[var(--accent)] transition-colors duration-200"
                    >
                      <ChevronRight
                        className="w-3.5 h-3.5 text-[var(--accent)]/0 group-hover:text-[var(--accent)] transition-all duration-200 -translate-x-1 group-hover:translate-x-0"
                        aria-hidden="true"
                      />
                      <span>{navT[link.key] ?? link.label}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* ── Quick links ── */}
            <div>
              <h3 className="text-white font-semibold text-sm mb-5 flex items-center gap-2">
                <span
                  className="inline-block w-4 h-0.5 rounded-full"
                  style={{ background: "linear-gradient(90deg, #c8a96e, #b8944f)" }}
                />
                Quick Access
              </h3>
              <ul className="flex flex-col gap-1">
                {quickLinks.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="group flex items-center gap-2 text-white/60 text-sm py-1.5 hover:text-[var(--accent)] transition-colors duration-200"
                    >
                      <ChevronRight
                        className="w-3.5 h-3.5 text-[var(--accent)]/0 group-hover:text-[var(--accent)] transition-all duration-200 -translate-x-1 group-hover:translate-x-0"
                        aria-hidden="true"
                      />
                      <span>{link.label}</span>
                    </Link>
                  </li>
                ))}
              </ul>

              {/* FYP badge */}
              <div
                className="mt-8 inline-flex items-center gap-2 rounded-full px-3 py-1.5 border"
                style={{
                  background: "rgba(200,169,110,0.08)",
                  borderColor: "rgba(200,169,110,0.25)",
                }}
              >
                <span
                  className="w-1.5 h-1.5 rounded-full animate-pulse"
                  style={{ background: "#c8a96e" }}
                />
                <span className="text-[var(--accent)] text-[10px] font-semibold uppercase tracking-wider">
                  FYP 2026
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Gradient divider above bottom bar */}
        <div
          style={{
            height: "1px",
            background:
              "linear-gradient(90deg, transparent, rgba(200,169,110,0.3), rgba(255,255,255,0.08), rgba(200,169,110,0.3), transparent)",
          }}
        />

        {/* ── Bottom bar ── */}
        <div className="container-lms py-5">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            {/* Copyright */}
            <p className="text-white/45 text-xs text-center sm:text-left leading-relaxed">
              &copy; {BRAND.year}{" "}
              <span className="text-white/60 font-medium">NCBA&amp;E</span>{" "}
              &mdash; Library Management System. Final Year Project by{" "}
              <span className="text-[var(--accent)]/80">Rao Muhammad Hamza</span>.
            </p>

            {/* Right side: tech stack + back to top */}
            <div className="flex items-center gap-4">
              <span className="hidden sm:flex items-center gap-1.5 text-white/30 text-[10px] uppercase tracking-wider font-medium">
                Built with
                <span className="text-[var(--accent)]/60 font-semibold">MERN</span>
                +
                <span className="text-[var(--accent)]/60 font-semibold">Tailwind</span>
              </span>

              {/* Back to top button */}
              <button
                onClick={scrollToTop}
                aria-label="Back to top"
                className="group flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-all duration-200 hover:border-[var(--accent)]/60 hover:bg-[var(--accent)]/10"
                style={{
                  borderColor: "rgba(200,169,110,0.2)",
                  color: "rgba(255,255,255,0.5)",
                }}
              >
                <ArrowUp
                  className="w-3 h-3 transition-transform duration-200 group-hover:-translate-y-0.5"
                  style={{ color: "#c8a96e" }}
                  aria-hidden="true"
                />
                <span className="group-hover:text-[var(--accent)] transition-colors duration-200">
                  Top
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </motion.footer>
  );
}
