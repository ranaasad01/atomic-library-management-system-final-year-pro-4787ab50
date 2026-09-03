"use client";

import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { Reveal } from "@/components/Reveal";
import { fadeInUp, staggerContainer, scaleIn, fadeInRight } from "@/lib/motion";
import { BookOpen, Users, ArrowRight, CheckCircle, BarChart3, Shield, Clock, Search, AlertCircle, Star, BookMarked, Activity, Sparkles, TrendingUp } from 'lucide-react';
import Link from "next/link";
import { FINE_RATE_PER_DAY, DEFAULT_ISSUE_DAYS, BRAND } from "@/lib/data";

const FINE_RATE = FINE_RATE_PER_DAY;
const LOAN_DAYS = DEFAULT_ISSUE_DAYS;

const STATS = [
  { value: "5,000+", label: "Books Catalogued", icon: BookOpen },
  { value: "1,200+", label: "Active Members", icon: Users },
  { value: "98%", label: "Return Rate", icon: TrendingUp },
  { value: `PKR ${FINE_RATE}/day`, label: "Overdue Fine Rate", icon: AlertCircle },
];

const FEATURES = [
  {
    icon: BookOpen,
    title: "Complete Book Catalog",
    description:
      "Manage your entire library inventory with ISBN tracking, category filters, shelf locations, and real-time availability status.",
    color: "#1e3a5f",
  },
  {
    icon: Users,
    title: "Member Management",
    description:
      "Add, edit, and manage library members with membership numbers, contact details, and role-based access control.",
    color: "#c8a96e",
  },
  {
    icon: Activity,
    title: "Issue & Return Workflow",
    description: `Track every book transaction with a ${LOAN_DAYS}-day default loan period, automated overdue detection, and full history logs.`,
    color: "#27ae60",
  },
  {
    icon: AlertCircle,
    title: "Fine Tracking",
    description: `Automatically calculate overdue fines at PKR ${FINE_RATE} per day. Mark fines as paid or waived with full audit trails.`,
    color: "#e74c3c",
  },
  {
    icon: Shield,
    title: "JWT Authentication",
    description:
      "Secure role-based access control separates member and admin capabilities, protecting sensitive library operations.",
    color: "#2980b9",
  },
  {
    icon: BarChart3,
    title: "Admin Dashboard",
    description:
      "Get a bird's-eye view of library activity — active issues, pending fines, recent transactions, and member statistics.",
    color: "#8e44ad",
  },
];

const HOW_IT_WORKS = [
  {
    step: "01",
    title: "Sign In Securely",
    description:
      "Members and admins authenticate with JWT-secured credentials. Role-based access ensures each user sees only what they need.",
    icon: Shield,
  },
  {
    step: "02",
    title: "Search & Discover Books",
    description:
      "Browse the full catalog by title, author, ISBN, or category. Real-time availability shows exactly how many copies are on the shelf.",
    icon: Search,
  },
  {
    step: "03",
    title: "Issue & Return",
    description: `Admins issue books to members in seconds. The system sets a ${LOAN_DAYS}-day due date, tracks returns, and flags overdue items automatically.`,
    icon: BookMarked,
  },
  {
    step: "04",
    title: "Manage Fines",
    description: `Overdue fines are calculated at PKR ${FINE_RATE}/day. Admins can mark fines as paid or waived with reason tracking.`,
    icon: CheckCircle,
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section
        className="relative overflow-hidden"
        style={{
          background:
            "linear-gradient(135deg, #0f1f33 0%, #1e3a5f 40%, #2a4f7c 100%)",
        }}
      >
        {/* Decorative background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div
            className="absolute -top-40 -right-40 w-96 h-96 rounded-full opacity-10"
            style={{
              background: "radial-gradient(circle, #c8a96e, transparent)",
            }}
          />
          <div
            className="absolute -bottom-20 -left-20 w-80 h-80 rounded-full opacity-10"
            style={{
              background: "radial-gradient(circle, #c8a96e, transparent)",
            }}
          />
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-5"
            style={{
              background: "radial-gradient(circle, #ffffff, transparent)",
            }}
          />
          {/* Subtle grid pattern */}
          <div
            className="absolute inset-0"
            style={{
              backgroundImage:
                "linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)",
              backgroundSize: "60px 60px",
            }}
          />
        </div>

        <div className="container-lms relative z-10 py-24 lg:py-32">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left: Text */}
            <motion.div
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
              className="text-white"
            >
              {/* Badge */}
              <motion.div variants={fadeInUp} className="mb-6">
                <span
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold"
                  style={{
                    background: "rgba(200,169,110,0.2)",
                    border: "1px solid rgba(200,169,110,0.4)",
                    color: "#e8c98e",
                  }}
                >
                  <Sparkles className="w-4 h-4" />
                  Final Year Project — NCBA&amp;E, Lahore
                </span>
              </motion.div>

              {/* Headline */}
              <motion.h1
                variants={fadeInUp}
                className="text-5xl lg:text-6xl font-bold leading-tight mb-6 tracking-tight"
              >
                Your Library,{" "}
                <span
                  style={{
                    background:
                      "linear-gradient(135deg, #c8a96e, #e8c98e)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                  }}
                >
                  Digitally
                </span>
                <br />
                Organized
              </motion.h1>

              <motion.p
                variants={fadeInUp}
                className="text-lg text-white/70 leading-relaxed mb-8 max-w-lg"
              >
                A modern web-based Library Management System built with the MERN
                stack — delivering speed, reliability, and ease of use for
                librarians and patrons alike.
              </motion.p>

              {/* Trust badges */}
              <motion.div
                variants={fadeInUp}
                className="flex flex-wrap gap-3 mb-10"
              >
                {["NCBA&E Approved", "Production Ready", "MERN Stack"].map(
                  (badge) => (
                    <span
                      key={badge}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium"
                      style={{
                        background: "rgba(255,255,255,0.1)",
                        border: "1px solid rgba(255,255,255,0.2)",
                        color: "rgba(255,255,255,0.85)",
                      }}
                    >
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                      {badge}
                    </span>
                  )
                )}
              </motion.div>

              {/* CTAs */}
              <motion.div
                variants={fadeInUp}
                className="flex flex-wrap gap-4"
              >
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl font-semibold text-[#1a2a3a] transition-all duration-200 hover:scale-105 hover:shadow-xl"
                  style={{
                    background:
                      "linear-gradient(135deg, #c8a96e, #e8c98e)",
                    boxShadow: "0 4px 20px rgba(200,169,110,0.4)",
                  }}
                >
                  Get Started
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/books/search"
                  className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl font-semibold text-white transition-all duration-200 hover:scale-105"
                  style={{
                    background: "rgba(255,255,255,0.1)",
                    border: "1px solid rgba(255,255,255,0.25)",
                    backdropFilter: "blur(8px)",
                  }}
                >
                  <Search className="w-4 h-4" />
                  Browse Books
                </Link>
              </motion.div>
            </motion.div>

            {/* Right: Floating card UI mockup */}
            <motion.div
              variants={fadeInRight}
              initial="hidden"
              animate="visible"
              className="hidden lg:block relative"
            >
              {/* Main card */}
              <div
                className="rounded-2xl p-6 shadow-2xl"
                style={{
                  background: "rgba(255,255,255,0.08)",
                  border: "1px solid rgba(255,255,255,0.15)",
                  backdropFilter: "blur(20px)",
                }}
              >
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center"
                      style={{
                        background:
                          "linear-gradient(135deg, #c8a96e, #b8944f)",
                      }}
                    >
                      <BookOpen className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-white font-semibold text-sm">
                      Library Dashboard
                    </span>
                  </div>
                  <span
                    className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full"
                    style={{
                      background: "rgba(39,174,96,0.2)",
                      color: "#4ade80",
                    }}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Live
                  </span>
                </div>

                {/* Stats row */}
                <div className="grid grid-cols-3 gap-3 mb-5">
                  {[
                    { label: "Books", value: "5,240", color: "#c8a96e" },
                    { label: "Members", value: "1,180", color: "#4a90d9" },
                    { label: "Active", value: "342", color: "#27ae60" },
                  ].map((s) => (
                    <div
                      key={s.label}
                      className="rounded-xl p-3 text-center"
                      style={{ background: "rgba(255,255,255,0.06)" }}
                    >
                      <div
                        className="text-xl font-bold"
                        style={{ color: s.color }}
                      >
                        {s.value}
                      </div>
                      <div className="text-xs text-white/50 mt-0.5">
                        {s.label}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Recent activity */}
                <div className="space-y-2.5">
                  <p className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3">
                    Recent Activity
                  </p>
                  {[
                    {
                      action: "Issued",
                      book: "Introduction to Algorithms",
                      time: "2m ago",
                      color: "#4a90d9",
                    },
                    {
                      action: "Returned",
                      book: "Database System Concepts",
                      time: "15m ago",
                      color: "#27ae60",
                    },
                    {
                      action: "Fine Paid",
                      book: "Clean Code",
                      time: "1h ago",
                      color: "#c8a96e",
                    },
                  ].map((item, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-3 rounded-lg px-3 py-2.5"
                      style={{ background: "rgba(255,255,255,0.05)" }}
                    >
                      <span
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ background: item.color }}
                      />
                      <div className="flex-1 min-w-0">
                        <span
                          className="text-xs font-medium"
                          style={{ color: item.color }}
                        >
                          {item.action}
                        </span>
                        <span className="text-xs text-white/60 ml-1.5 truncate">
                          {item.book}
                        </span>
                      </div>
                      <span className="text-xs text-white/30 flex-shrink-0">
                        {item.time}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Floating badge — books available */}
              <motion.div
                animate={{ y: [0, -8, 0] }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className="absolute -top-6 -right-6 rounded-xl px-4 py-3 shadow-xl"
                style={{
                  background: "linear-gradient(135deg, #c8a96e, #b8944f)",
                  color: "#1a2a3a",
                }}
              >
                <div className="text-xs font-semibold">Books Available</div>
                <div className="text-2xl font-bold">4,892</div>
              </motion.div>

              {/* Floating badge — return rate */}
              <motion.div
                animate={{ y: [0, 8, 0] }}
                transition={{
                  duration: 3.5,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: 0.5,
                }}
                className="absolute -bottom-6 -left-6 rounded-xl px-4 py-3 shadow-xl"
                style={{
                  background: "rgba(255,255,255,0.12)",
                  border: "1px solid rgba(255,255,255,0.2)",
                  backdropFilter: "blur(12px)",
                  color: "white",
                }}
              >
                <div className="text-xs text-white/60">Return Rate</div>
                <div className="text-2xl font-bold text-emerald-400">98%</div>
              </motion.div>
            </motion.div>
          </div>
        </div>

        {/* Wave divider */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg
            viewBox="0 0 1440 60"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full"
          >
            <path
              d="M0 60L1440 60L1440 20C1200 60 960 0 720 20C480 40 240 0 0 20L0 60Z"
              fill="#f5f0e8"
            />
          </svg>
        </div>
      </section>

      {/* ── STATS BAR ────────────────────────────────────────────────────── */}
      <section className="py-16 bg-[var(--background)]">
        <div className="container-lms">
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {STATS.map((stat) => (
              <motion.div
                key={stat.label}
                variants={scaleIn}
                className="relative rounded-2xl p-6 text-center group cursor-default overflow-hidden"
                style={{
                  background: "white",
                  border: "1px solid var(--border)",
                  boxShadow: "var(--shadow-sm)",
                }}
                whileHover={{
                  y: -4,
                  boxShadow: "0 12px 40px -8px rgba(30,58,95,0.2)",
                }}
                transition={{ duration: 0.2 }}
              >
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  style={{
                    background:
                      "linear-gradient(135deg, rgba(30,58,95,0.03), rgba(200,169,110,0.05))",
                  }}
                />
                <div className="relative z-10">
                  <div
                    className="w-12 h-12 rounded-2xl mx-auto mb-4 flex items-center justify-center"
                    style={{
                      background:
                        "linear-gradient(135deg, rgba(30,58,95,0.1), rgba(200,169,110,0.15))",
                    }}
                  >
                    <stat.icon
                      className="w-6 h-6"
                      style={{ color: "#1e3a5f" }}
                    />
                  </div>
                  <div
                    className="text-3xl font-bold mb-1"
                    style={{ color: "#1e3a5f" }}
                  >
                    {stat.value}
                  </div>
                  <div
                    className="text-sm font-medium"
                    style={{ color: "#5a6a7a" }}
                  >
                    {stat.label}
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── FEATURES ─────────────────────────────────────────────────────── */}
      <section
        className="py-20"
        style={{
          background: "linear-gradient(180deg, #f5f0e8 0%, #ede8df 100%)",
        }}
      >
        <div className="container-lms">
          <Reveal className="text-center mb-14">
            <span
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold mb-4"
              style={{
                background: "rgba(200,169,110,0.15)",
                border: "1px solid rgba(200,169,110,0.35)",
                color: "#b8944f",
              }}
            >
              <Star className="w-3.5 h-3.5" />
              Core Features
            </span>
            <h2
              className="text-4xl font-bold mb-4 tracking-tight"
              style={{ color: "#1e3a5f" }}
            >
              Everything You Need to Run a Modern Library
            </h2>
            <p
              className="text-lg max-w-2xl mx-auto leading-relaxed"
              style={{ color: "#5a6a7a" }}
            >
              From book cataloging to fine management — all in one integrated
              platform built for academic institutions.
            </p>
          </Reveal>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {FEATURES.map((feature) => (
              <motion.div
                key={feature.title}
                variants={fadeInUp}
                className="group rounded-2xl p-6 bg-white border border-[var(--border)] transition-all duration-300 hover:shadow-xl cursor-default relative overflow-hidden"
                whileHover={{ y: -4 }}
              >
                {/* Accent top line */}
                <div
                  className="absolute top-0 left-0 right-0 h-0.5 rounded-t-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  style={{
                    background: `linear-gradient(90deg, ${feature.color}, transparent)`,
                  }}
                />
                <div
                  className="w-12 h-12 rounded-2xl mb-5 flex items-center justify-center transition-transform duration-300 group-hover:scale-110"
                  style={{ background: `${feature.color}18` }}
                >
                  <feature.icon
                    className="w-6 h-6"
                    style={{ color: feature.color }}
                  />
                </div>
                <h3
                  className="text-lg font-bold mb-2"
                  style={{ color: "#1e3a5f" }}
                >
                  {feature.title}
                </h3>
                <p
                  className="text-sm leading-relaxed"
                  style={{ color: "#5a6a7a" }}
                >
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────────────────────── */}
      <section className="py-20 bg-[var(--background)]">
        <div className="container-lms">
          <Reveal className="text-center mb-14">
            <span
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold mb-4"
              style={{
                background: "rgba(30,58,95,0.1)",
                border: "1px solid rgba(30,58,95,0.2)",
                color: "#1e3a5f",
              }}
            >
              <Clock className="w-3.5 h-3.5" />
              How It Works
            </span>
            <h2
              className="text-4xl font-bold mb-4 tracking-tight"
              style={{ color: "#1e3a5f" }}
            >
              Simple, Streamlined Workflow
            </h2>
            <p
              className="text-lg max-w-2xl mx-auto leading-relaxed"
              style={{ color: "#5a6a7a" }}
            >
              Four steps from login to library management — designed for
              efficiency and ease of use.
            </p>
          </Reveal>

          <div className="relative">
            {/* Connector line */}
            <div
              className="hidden lg:block absolute top-8 left-[12.5%] right-[12.5%] h-px"
              style={{
                background:
                  "linear-gradient(90deg, transparent, var(--border), var(--border), transparent)",
              }}
            />

            <motion.div
              variants={staggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="grid md:grid-cols-2 lg:grid-cols-4 gap-8"
            >
              {HOW_IT_WORKS.map((step, i) => (
                <motion.div
                  key={step.step}
                  variants={fadeInUp}
                  className="text-center group"
                >
                  <div className="relative inline-flex mb-6">
                    <div
                      className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg transition-transform duration-300 group-hover:scale-110"
                      style={{
                        background:
                          "linear-gradient(135deg, #1e3a5f, #2a4f7c)",
                      }}
                    >
                      <step.icon className="w-7 h-7 text-white" />
                    </div>
                    <div
                      className="absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                      style={{
                        background:
                          "linear-gradient(135deg, #c8a96e, #b8944f)",
                        color: "#1a2a3a",
                      }}
                    >
                      {i + 1}
                    </div>
                  </div>
                  <h3
                    className="text-lg font-bold mb-2"
                    style={{ color: "#1e3a5f" }}
                  >
                    {step.title}
                  </h3>
                  <p
                    className="text-sm leading-relaxed"
                    style={{ color: "#5a6a7a" }}
                  >
                    {step.description}
                  </p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── CTA BANNER ───────────────────────────────────────────────────── */}
      <section
        className="py-20 relative overflow-hidden"
        style={{
          background:
            "linear-gradient(135deg, #1e3a5f 0%, #2a4f7c 50%, #1e3a5f 100%)",
        }}
      >
        <div className="absolute inset-0 pointer-events-none">
          <div
            className="absolute top-0 right-0 w-96 h-96 rounded-full opacity-10"
            style={{
              background: "radial-gradient(circle, #c8a96e, transparent)",
            }}
          />
          <div
            className="absolute bottom-0 left-0 w-64 h-64 rounded-full opacity-10"
            style={{
              background: "radial-gradient(circle, #c8a96e, transparent)",
            }}
          />
        </div>
        <div className="container-lms relative z-10 text-center">
          <Reveal>
            <div
              className="w-16 h-16 rounded-2xl mx-auto mb-6 flex items-center justify-center"
              style={{
                background: "linear-gradient(135deg, #c8a96e, #b8944f)",
              }}
            >
              <BookOpen className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-4xl font-bold text-white mb-4 tracking-tight">
              Ready to Modernize Your Library?
            </h2>
            <p className="text-lg text-white/70 mb-10 max-w-xl mx-auto leading-relaxed">
              Join the digital revolution in library management. Sign in to
              explore the full system or browse the book catalog.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link
                href="/login"
                className="inline-flex items-center gap-2 px-8 py-4 rounded-xl font-semibold text-[#1a2a3a] transition-all duration-200 hover:scale-105 hover:shadow-2xl"
                style={{
                  background: "linear-gradient(135deg, #c8a96e, #e8c98e)",
                  boxShadow: "0 4px 20px rgba(200,169,110,0.4)",
                }}
              >
                Sign In to LMS
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                href="/admin/dashboard"
                className="inline-flex items-center gap-2 px-8 py-4 rounded-xl font-semibold text-white transition-all duration-200 hover:scale-105"
                style={{
                  background: "rgba(255,255,255,0.1)",
                  border: "1px solid rgba(255,255,255,0.25)",
                }}
              >
                <BarChart3 className="w-5 h-5" />
                Admin Panel
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── TECH STACK ───────────────────────────────────────────────────── */}
      <section className="py-16 bg-[var(--background)]">
        <div className="container-lms">
          <Reveal className="text-center">
            <p
              className="text-sm font-semibold uppercase tracking-widest mb-6"
              style={{ color: "#5a6a7a" }}
            >
              Built With
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              {[
                "MongoDB",
                "Express.js",
                "React.js",
                "Node.js",
                "Tailwind CSS",
                "JWT Auth",
                "Supabase",
              ].map((tech) => (
                <span
                  key={tech}
                  className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 hover:scale-105"
                  style={{
                    background: "white",
                    border: "1px solid var(--border)",
                    color: "#1e3a5f",
                    boxShadow: "var(--shadow-sm)",
                  }}
                >
                  {tech}
                </span>
              ))}
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  );
}
