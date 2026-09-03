"use client";

import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { Reveal } from "@/components/Reveal";
import { fadeInUp, staggerContainer, scaleIn } from "@/lib/motion";
import { BookOpen, Users, ArrowRight, CheckCircle, BarChart3, Shield, Clock, Search, AlertCircle, Star, BookMarked, UserCheck, Activity, ChevronRight } from 'lucide-react';
import Link from "next/link";
import { cn } from "@/lib/utils";
import { FINE_RATE_PER_DAY, DEFAULT_ISSUE_DAYS } from "@/lib/data";
type APP_NAME = any;
const APP_NAME: any = [];
type APP_TAGLINE = any;
const APP_TAGLINE: any = [];
type APP_BRAND = any;
const APP_BRAND: any = [];

// ─── Inline constants ──────────────────────────────────────────────────────────
const FINE_RATE = FINE_RATE_PER_DAY;
const LOAN_DAYS = DEFAULT_ISSUE_DAYS;

const STATS = [
  { value: "5,000+", label: "Books Catalogued" },
  { value: "1,200+", label: "Active Members" },
  { value: "98%", label: "Return Rate" },
  { value: `PKR ${FINE_RATE}/day`, label: "Overdue Fine Rate" },
];

const FEATURES = [
  {
    icon: BookOpen,
    title: "Complete Book Catalog",
    description:
      "Manage your entire library inventory with ISBN tracking, category filters, shelf locations, and real-time availability status.",
  },
  {
    icon: Users,
    title: "Member Management",
    description:
      "Add, edit, and manage library members with membership numbers, contact details, and role-based access control.",
  },
  {
    icon: Activity,
    title: "Issue & Return Workflow",
    description:
      `Track every book transaction with a ${LOAN_DAYS}-day default loan period, automated overdue detection, and full history logs.`,
  },
  {
    icon: AlertCircle,
    title: "Fine Tracking",
    description:
      `Automatically calculate overdue fines at PKR ${FINE_RATE} per day. Mark fines as paid or waived with full audit trails.`,
  },
  {
    icon: Shield,
    title: "JWT Authentication",
    description:
      "Secure role-based access control separates member and admin capabilities, protecting sensitive library operations.",
  },
  {
    icon: BarChart3,
    title: "Admin Dashboard",
    description:
      "Get a bird's-eye view of library activity — active issues, pending fines, recent transactions, and member statistics.",
  },
];

const HOW_IT_WORKS = [
  {
    step: "01",
    title: "Sign In Securely",
    description:
      "Members and admins authenticate with JWT-secured credentials. Role-based access ensures each user sees only what they need.",
  },
  {
    step: "02",
    title: "Search & Discover Books",
    description:
      "Browse the full catalog by title, author, ISBN, or category. Real-time availability shows exactly how many copies are on the shelf.",
  },
  {
    step: "03",
    title: "Issue & Return",
    description:
      `Admins issue books to members in seconds. The system sets a ${LOAN_DAYS}-day due date, tracks returns, and flags overdue items automatically.`,
  },
  {
    step: "04",
    title: "Manage Fines",
    description:
      "Overdue fines are calculated automatically. Admins can mark them paid or waive them with a reason — every action is logged.",
  },
];

const TESTIMONIALS = [
  {
    name: "Dr. Ayesha Malik",
    role: "Head Librarian, NCBA&E",
    quote:
      "This system transformed how we manage our collection. Issue and return workflows that used to take minutes now happen in seconds.",
    initials: "AM",
  },
  {
    name: "Usman Tariq",
    role: "Library Member",
    quote:
      "I can check book availability before visiting the library. The fine tracking keeps me on top of my due dates — no surprises.",
    initials: "UT",
  },
  {
    name: "Prof. Sana Riaz",
    role: "Faculty, Business Administration",
    quote:
      "The admin dashboard gives us a clear picture of library usage. We can see which books are most in demand and plan acquisitions accordingly.",
    initials: "SR",
  },
];

const ADMIN_CAPABILITIES = [
  "Add, edit, and remove books from the catalog",
  "Manage member accounts and membership status",
  "Issue books and process returns on behalf of members",
  "View and manage all outstanding fines",
  "Access full transaction history and audit logs",
  "Monitor library activity through the admin dashboard",
];

export default function HomePage() {
  const t = useTranslations();

  return (
    <main className="overflow-x-hidden">
      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <Reveal>
        <section className="relative min-h-[88vh] flex items-center bg-[var(--brand-dark)] overflow-hidden">
          {/* Background texture */}
          <div
            className="absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage:
                "radial-gradient(circle at 1px 1px, var(--brand-gold) 1px, transparent 0)",
              backgroundSize: "32px 32px",
            }} />
          {/* Gradient glow */}
          <div className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full bg-[var(--brand-gold)]/10 blur-[120px] pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full bg-[var(--brand-gold)]/5 blur-[100px] pointer-events-none" />

          <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-12 py-24 grid lg:grid-cols-2 gap-16 items-center">
            {/* Left: copy */}
            <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="space-y-8">
              <motion.div variants={fadeInUp}>
                <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[var(--brand-gold)]/30 bg-[var(--brand-gold)]/10 text-[var(--brand-gold)] text-xs font-semibold tracking-wide uppercase">
                  <BookMarked className="h-3.5 w-3.5" aria-hidden="true" />
                  {t("hero.badge")}
                </span>
              </motion.div>

              <motion.h1
                variants={fadeInUp}
                className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight tracking-tight text-balance"
                style={{
                  color: "#84cc16"
                }}>
                {t("hero.headline1")}{" "}
                <span className="text-[var(--brand-gold)]">{t("hero.headline2")}</span>{" "}
                {t("hero.headline3")}
              </motion.h1>

              <motion.p variants={fadeInUp} className="text-lg text-white/70 leading-relaxed max-w-lg text-pretty">
                {t("hero.subheadline")}
              </motion.p>

              <motion.div variants={fadeInUp} className="flex flex-wrap gap-4">
                <Link href="/login" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[var(--brand-gold)] text-[var(--brand-dark)] font-semibold text-sm hover:bg-[var(--brand-gold)]/90 transition-all duration-300 shadow-[0_4px_24px_rgba(200,169,110,0.35)] hover:shadow-[0_6px_32px_rgba(200,169,110,0.5)] hover:-translate-y-0.5">
                  {t("hero.cta_primary")}
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
                <Link href="/books/search" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-white/20 text-white font-semibold text-sm hover:bg-white/10 hover:border-white/40 transition-all duration-300">
                  <Search className="h-4 w-4" aria-hidden="true" />
                  {t("hero.cta_secondary")}
                </Link>
              </motion.div>

              <motion.div variants={fadeInUp} className="flex items-center gap-6 pt-2">
                {[
                  t("hero.trust1"),
                  t("hero.trust2"),
                  t("hero.trust3"),
                ].map((item) => (<div key={item} className="flex items-center gap-1.5 text-white/60 text-xs">
                  <CheckCircle className="h-3.5 w-3.5 text-[var(--brand-gold)]" aria-hidden="true" />
                  {item}
                </div>))}
              </motion.div>
            </motion.div>

            {/* Right: mock dashboard card */}
            <motion.div variants={scaleIn} initial="hidden" animate="visible" className="hidden lg:block">
              <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-6 shadow-[0_8px_48px_rgba(0,0,0,0.4)] space-y-5">
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white/50 text-xs uppercase tracking-widest">{t("hero.card_title")}</p>
                    <p className="text-white font-semibold mt-0.5">{t("hero.card_subtitle")}</p>
                  </div>
                  <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-400 text-xs font-medium">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    {t("hero.card_live")}
                  </span>
                </div>

                {/* Stat row */}
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: t("hero.card_stat1_label"), value: "142", color: "text-[var(--brand-gold)]" },
                    { label: t("hero.card_stat2_label"), value: "18", color: "text-red-400" },
                    { label: t("hero.card_stat3_label"), value: "PKR 2,340", color: "text-amber-400" },
                  ].map((s) => (<div key={s.label} className="rounded-xl bg-white/5 border border-white/8 p-3 text-center">
                    <p className={cn("text-xl font-bold", s.color)}>{s.value}</p>
                    <p className="text-white/50 text-[10px] mt-0.5 leading-tight">{s.label}</p>
                  </div>))}
                </div>

                {/* Recent activity */}
                <div className="space-y-2">
                  <p className="text-white/40 text-[10px] uppercase tracking-widest">{t("hero.card_activity_label")}</p>
                  {[
                    { action: t("hero.activity1_action"), book: t("hero.activity1_book"), time: "2m ago", type: "issue" },
                    { action: t("hero.activity2_action"), book: t("hero.activity2_book"), time: "15m ago", type: "return" },
                    { action: t("hero.activity3_action"), book: t("hero.activity3_book"), time: "1h ago", type: "fine" },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center justify-between rounded-lg bg-white/5 px-3 py-2">
                      <div className="flex items-center gap-2.5">
                        <span
                          className={cn(
                            "h-2 w-2 rounded-full flex-shrink-0",
                            item.type === "issue"
                              ? "bg-[var(--brand-gold)]"
                              : item.type === "return"
                              ? "bg-emerald-400"
                              : "bg-red-400"
                          )} />
                        <div>
                          <p className="text-white/80 text-xs font-medium">{item.action}</p>
                          <p className="text-white/40 text-[10px]">{item.book}</p>
                        </div>
                      </div>
                      <span className="text-white/30 text-[10px]">{item.time}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </section>
      </Reveal>
      {/* ── Stats Bar ────────────────────────────────────────────────────── */}
      <Reveal>
        <section className="bg-[var(--brand-cream)] border-y border-[var(--brand-gold)]/20">
          <div className="max-w-7xl mx-auto px-6 lg:px-12 py-12">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-8">
              {STATS.map((stat, i) => (
                <motion.div key={stat.label} variants={fadeInUp} initial="hidden" whileInView="visible" viewport={{ once: true }} transition={{ delay: i * 0.08 }} className="text-center">
                  <p className="text-3xl font-bold text-[var(--brand-dark)] tracking-tight">
                    {stat.value}
                  </p>
                  <p className="mt-1 text-sm text-[var(--brand-dark)]/60">{stat.label}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      </Reveal>
      {/* ── Features ─────────────────────────────────────────────────────── */}
      <Reveal>
        <section id="features" className="bg-white py-24 md:py-32">
          <div className="max-w-7xl mx-auto px-6 lg:px-12">
            <div className="max-w-2xl mb-16">
              <span className="text-xs font-semibold uppercase tracking-widest text-[var(--brand-gold)]">
                {t("features.eyebrow")}
              </span>
              <h2 className="mt-3 text-3xl sm:text-4xl font-bold text-[var(--brand-dark)] tracking-tight text-balance">
                {t("features.heading")}
              </h2>
              <p className="mt-4 text-[var(--brand-dark)]/60 leading-relaxed text-pretty">
                {t("features.subheading")}
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {FEATURES.map((feat, i) => (
                <Reveal key={feat.title} delay={i * 0.07}>
                  <motion.div whileHover={{ y: -4, transition: { duration: 0.2 } }} className="group rounded-2xl border border-[var(--brand-dark)]/8 bg-[var(--brand-cream)]/50 p-6 hover:border-[var(--brand-gold)]/40 hover:bg-[var(--brand-cream)] hover:shadow-[0_4px_24px_rgba(30,58,95,0.08)] transition-all duration-300">
                    <div className="h-11 w-11 rounded-xl bg-[var(--brand-dark)] flex items-center justify-center mb-4 group-hover:bg-[var(--brand-gold)] transition-colors duration-300">
                      <feat.icon className="h-5 w-5 text-white group-hover:text-[var(--brand-dark)] transition-colors duration-300" aria-hidden="true" />
                    </div>
                    <h3 className="font-semibold text-[var(--brand-dark)] mb-2">{feat.title}</h3>
                    <p className="text-sm text-[var(--brand-dark)]/60 leading-relaxed">{feat.description}</p>
                  </motion.div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      </Reveal>
      {/* ── How It Works ─────────────────────────────────────────────────── */}
      <Reveal>
        <section id="how-it-works" className="bg-[var(--brand-dark)] py-24 md:py-32 relative overflow-hidden">
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
              backgroundSize: "40px 40px",
            }} />
          <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-12">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <span className="text-xs font-semibold uppercase tracking-widest text-[var(--brand-gold)]">
                {t("howItWorks.eyebrow")}
              </span>
              <h2 className="mt-3 text-3xl sm:text-4xl font-bold text-white tracking-tight text-balance">
                {t("howItWorks.heading")}
              </h2>
              <p className="mt-4 text-white/60 leading-relaxed text-pretty">
                {t("howItWorks.subheading")}
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {HOW_IT_WORKS.map((step, i) => (
                <Reveal key={step.step} delay={i * 0.1}>
                  <div className="relative rounded-2xl border border-white/10 bg-white/5 p-6 hover:border-[var(--brand-gold)]/30 hover:bg-white/8 transition-all duration-300">
                    <span className="text-5xl font-black text-[var(--brand-gold)]/20 leading-none block mb-4">
                      {step.step}
                    </span>
                    <h3 className="font-semibold text-white mb-2">{step.title}</h3>
                    <p className="text-sm text-white/60 leading-relaxed">{step.description}</p>
                    {i < HOW_IT_WORKS.length - 1 && (
                      <ChevronRight
                        className="absolute -right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[var(--brand-gold)]/40 hidden lg:block"
                        aria-hidden="true"
                      />
                    )}
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      </Reveal>
      {/* ── Admin Capabilities (split layout) ────────────────────────────── */}
      <Reveal>
        <section id="admin" className="bg-white py-24 md:py-32">
          <div className="max-w-7xl mx-auto px-6 lg:px-12">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              {/* Left: visual */}
              <div className="order-2 lg:order-1">
                <div className="rounded-2xl border border-[var(--brand-dark)]/10 bg-[var(--brand-cream)] p-8 shadow-[0_4px_32px_rgba(30,58,95,0.08)]">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="h-10 w-10 rounded-xl bg-[var(--brand-dark)] flex items-center justify-center">
                      <Shield className="h-5 w-5 text-[var(--brand-gold)]" aria-hidden="true" />
                    </div>
                    <div>
                      <p className="font-semibold text-[var(--brand-dark)] text-sm">{t("admin.card_title")}</p>
                      <p className="text-[var(--brand-dark)]/50 text-xs">{t("admin.card_subtitle")}</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    {ADMIN_CAPABILITIES.map((cap, i) => (
                      <motion.div key={i} initial={{ opacity: 0, x: -12 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.07, duration: 0.4, ease: "easeOut" }} className="flex items-start gap-3 rounded-xl bg-white border border-[var(--brand-dark)]/6 px-4 py-3">
                        <CheckCircle className="h-4 w-4 text-[var(--brand-gold)] flex-shrink-0 mt-0.5" aria-hidden="true" />
                        <span className="text-sm text-[var(--brand-dark)]/80">{cap}</span>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right: copy */}
              <div className="order-1 lg:order-2 space-y-6">
                <span className="text-xs font-semibold uppercase tracking-widest text-[var(--brand-gold)]">
                  {t("admin.eyebrow")}
                </span>
                <h2 className="text-3xl sm:text-4xl font-bold text-[var(--brand-dark)] tracking-tight text-balance">
                  {t("admin.heading")}
                </h2>
                <p className="text-[var(--brand-dark)]/60 leading-relaxed text-pretty">
                  {t("admin.body1")}
                </p>
                <p className="text-[var(--brand-dark)]/60 leading-relaxed text-pretty">
                  {t("admin.body2")}
                </p>
                <div className="flex flex-wrap gap-4 pt-2">
                  <Link href="/admin/dashboard" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[var(--brand-dark)] text-white text-sm font-semibold hover:bg-[var(--brand-dark)]/90 transition-all duration-300 hover:-translate-y-0.5 shadow-[0_4px_16px_rgba(30,58,95,0.25)]">
                    <UserCheck className="h-4 w-4" aria-hidden="true" />
                    {t("admin.cta")}
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </Reveal>
      {/* ── Testimonials ─────────────────────────────────────────────────── */}
      <Reveal>
        <section id="testimonials" className="bg-[var(--brand-cream)] py-24 md:py-32">
          <div className="max-w-7xl mx-auto px-6 lg:px-12">
            <div className="text-center max-w-xl mx-auto mb-16">
              <span className="text-xs font-semibold uppercase tracking-widest text-[var(--brand-gold)]">
                {t("testimonials.eyebrow")}
              </span>
              <h2 className="mt-3 text-3xl sm:text-4xl font-bold text-[var(--brand-dark)] tracking-tight text-balance">
                {t("testimonials.heading")}
              </h2>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {TESTIMONIALS.map((t_item, i) => (
                <Reveal key={t_item.name} delay={i * 0.1}>
                  <motion.div whileHover={{ y: -4, transition: { duration: 0.2 } }} className="rounded-2xl border border-[var(--brand-dark)]/8 bg-white p-6 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_-8px_rgba(0,0,0,0.08)] hover:shadow-[0_4px_32px_rgba(30,58,95,0.12)] transition-all duration-300">
                    <div className="flex gap-1 mb-4">
                      {Array.from({ length: 5 }).map((_, si) => (
                        <Star key={si} className="h-4 w-4 fill-[var(--brand-gold)] text-[var(--brand-gold)]" aria-hidden="true" />
                      ))}
                    </div>
                    <p className="text-[var(--brand-dark)]/70 text-sm leading-relaxed mb-6">
                      &ldquo;{t_item.quote}&rdquo;
                    </p>
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-[var(--brand-dark)] flex items-center justify-center flex-shrink-0">
                        <span className="text-[var(--brand-gold)] text-xs font-bold">{t_item.initials}</span>
                      </div>
                      <div>
                        <p className="font-semibold text-[var(--brand-dark)] text-sm">{t_item.name}</p>
                        <p className="text-[var(--brand-dark)]/50 text-xs">{t_item.role}</p>
                      </div>
                    </div>
                  </motion.div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      </Reveal>
      {/* ── CTA Banner ───────────────────────────────────────────────────── */}
      <Reveal>
        <section id="get-started" className="bg-[var(--brand-dark)] py-20 md:py-28 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-[var(--brand-gold)]/10 via-transparent to-transparent pointer-events-none" />
          <div className="relative z-10 max-w-4xl mx-auto px-6 lg:px-12 text-center space-y-8">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[var(--brand-gold)]/30 bg-[var(--brand-gold)]/10 text-[var(--brand-gold)] text-xs font-semibold tracking-wide uppercase">
              <Clock className="h-3.5 w-3.5" aria-hidden="true" />
              {t("cta.badge")}
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white tracking-tight text-balance">
              {t("cta.heading")}
            </h2>
            <p className="text-white/60 text-lg leading-relaxed max-w-2xl mx-auto text-pretty">
              {t("cta.subheading")}
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link href="/login" className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-[var(--brand-gold)] text-[var(--brand-dark)] font-bold text-sm hover:bg-[var(--brand-gold)]/90 transition-all duration-300 shadow-[0_4px_24px_rgba(200,169,110,0.4)] hover:shadow-[0_6px_32px_rgba(200,169,110,0.55)] hover:-translate-y-0.5">
                {t("cta.primary")}
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
              <Link href="/books/search" className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl border border-white/20 text-white font-semibold text-sm hover:bg-white/10 hover:border-white/40 transition-all duration-300">
                <Search className="h-4 w-4" aria-hidden="true" />
                {t("cta.secondary")}
              </Link>
            </div>
            <p className="text-white/30 text-xs">
              {t("cta.footnote")}
            </p>
          </div>
        </section>
      </Reveal>
    </main>
  );
}