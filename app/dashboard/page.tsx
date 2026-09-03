"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { BookOpen, AlertCircle, Clock, Search, ArrowRight, CheckCircle, RotateCcw, TrendingUp, Calendar, User, ChevronRight } from 'lucide-react';
import { Reveal } from "@/components/Reveal";
import { staggerContainer, fadeInUp } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
type APP_NAME = any;
const APP_NAME: any = [];
type APP_TAGLINE = any;
const APP_TAGLINE: any = [];

// ─── Types ──────────────────────────────────────────────────────────────────────

interface BookIssueRow {
  id: string;
  book_id: string;
  user_id: string;
  issued_by: string;
  issue_date: string;
  due_date: string;
  return_date: string | null;
  status: string;
  remarks: string | null;
  created_at: string;
  updated_at: string;
}

interface BookRow {
  id: string;
  title: string;
  author: string;
  isbn: string | null;
  category: string | null;
  shelf_location: string | null;
}

interface FineRow {
  id: string;
  issue_id: string;
  user_id: string;
  overdue_days: number;
  fine_per_day: number;
  total_amount: number;
  status: string;
  paid_at: string | null;
}

interface ActivityLogRow {
  id: string;
  actor_id: string;
  action_type: string;
  entity_type: string;
  entity_id: string | null;
  description: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

interface UserRow {
  id: string;
  full_name: string;
  email: string;
  role: string;
  membership_number: string | null;
  is_active: boolean;
}

interface EnrichedIssue extends BookIssueRow {
  book?: BookRow;
}

// ─── Helpers ────────────────────────────────────────────────────────────────────

const FINE_RATE = 5; // PKR per day

function daysUntilDue(dueDateStr: string): number {
  const due = new Date(dueDateStr);
  const now = new Date();
  const diffMs = due.getTime() - now.getTime();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function getStatusColor(status: string): string {
  switch (status) {
    case "returned":
      return "bg-emerald-100 text-emerald-700";
    case "overdue":
      return "bg-red-100 text-red-700";
    case "issued":
      return "bg-blue-100 text-blue-700";
    default:
      return "bg-gray-100 text-gray-600";
  }
}

function getDueBadge(daysLeft: number, status: string) {
  if (status === "returned") return null;
  if (daysLeft < 0)
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700">
        <AlertCircle className="h-3 w-3" />
        {Math.abs(daysLeft)}d overdue
      </span>
    );
  if (daysLeft === 0)
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700">
        <Clock className="h-3 w-3" />
        Due today
      </span>
    );
  if (daysLeft <= 3)
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-600">
        <Clock className="h-3 w-3" />
        {daysLeft}d left
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-600">
      <CheckCircle className="h-3 w-3" />
      {daysLeft}d left
    </span>
  );
}

// ─── Mini Donut Chart ────────────────────────────────────────────────────────────

function DonutChart({ paid, pending, waived }: { paid: number; pending: number; waived: number }) {
  const total = paid + pending + waived || 1;
  const paidPct = (paid / total) * 100;
  const pendingPct = (pending / total) * 100;
  const waivedPct = (waived / total) * 100;

  const r = 40;
  const circ = 2 * Math.PI * r;

  const paidDash = (paidPct / 100) * circ;
  const pendingDash = (pendingPct / 100) * circ;
  const waivedDash = (waivedPct / 100) * circ;

  const paidOffset = 0;
  const pendingOffset = -paidDash;
  const waivedOffset = -(paidDash + pendingDash);

  return (
    <svg viewBox="0 0 100 100" className="h-28 w-28 -rotate-90">
      <circle cx="50" cy="50" r={r} fill="none" stroke="#f3f4f6" strokeWidth="14" />
      {paid > 0 && (
        <circle
          cx="50"
          cy="50"
          r={r}
          fill="none"
          stroke="#10b981"
          strokeWidth="14"
          strokeDasharray={`${paidDash} ${circ - paidDash}`}
          strokeDashoffset={paidOffset}
          strokeLinecap="butt"
        />
      )}
      {pending > 0 && (
        <circle
          cx="50"
          cy="50"
          r={r}
          fill="none"
          stroke="#ef4444"
          strokeWidth="14"
          strokeDasharray={`${pendingDash} ${circ - pendingDash}`}
          strokeDashoffset={pendingOffset}
          strokeLinecap="butt"
        />
      )}
      {waived > 0 && (
        <circle
          cx="50"
          cy="50"
          r={r}
          fill="none"
          stroke="#c8a96e"
          strokeWidth="14"
          strokeDasharray={`${waivedDash} ${circ - waivedDash}`}
          strokeDashoffset={waivedOffset}
          strokeLinecap="butt"
        />
      )}
    </svg>
  );
}

// ─── Action type icon ────────────────────────────────────────────────────────────

function ActionIcon({ type }: { type: string }) {
  if (type.includes("issue"))
    return <BookOpen className="h-4 w-4 text-[var(--brand-primary)]" />;
  if (type.includes("return"))
    return <RotateCcw className="h-4 w-4 text-emerald-600" />;
  if (type.includes("fine") || type.includes("paid"))
    return <AlertCircle className="h-4 w-4 text-amber-500" />;
  return <TrendingUp className="h-4 w-4 text-gray-400" />;
}

// ─── Page ────────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const supabase = createClient();

  const [user, setUser] = useState<UserRow | null>(null);
  const [issues, setIssues] = useState<EnrichedIssue[]>([]);
  const [fines, setFines] = useState<FineRow[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLogRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        // Auth user
        const {
          data: { user: authUser },
        } = await supabase.auth.getUser();

        if (!authUser) {
          setLoading(false);
          return;
        }

        // User profile
        const { data: profile } = await supabase
          .from("users")
          .select("id, full_name, email, role, membership_number, is_active")
          .eq("id", authUser.id)
          .single();

        if (profile) setUser(profile as UserRow);

        // Book issues for this user
        const { data: issueData } = await supabase
          .from("book_issues")
          .select("*")
          .eq("user_id", authUser.id)
          .order("created_at", { ascending: false });

        const rawIssues: BookIssueRow[] = (issueData as BookIssueRow[]) ?? [];

        // Enrich with book data
        const bookIds = [...new Set(rawIssues.map((i) => i.book_id))];
        let bookMap: Record<string, BookRow> = {};
        if (bookIds.length > 0) {
          const { data: bookData } = await supabase
            .from("books")
            .select("id, title, author, isbn, category, shelf_location")
            .in("id", bookIds);
          if (bookData) {
            bookMap = Object.fromEntries(
              (bookData as BookRow[]).map((b) => [b.id, b])
            );
          }
        }

        const enriched: EnrichedIssue[] = rawIssues.map((issue) => ({
          ...issue,
          book: bookMap[issue.book_id],
        }));
        setIssues(enriched);

        // Fines for this user
        const { data: fineData } = await supabase
          .from("fines")
          .select("*")
          .eq("user_id", authUser.id)
          .order("created_at", { ascending: false });
        setFines((fineData as FineRow[]) ?? []);

        // Activity logs for this user
        const { data: logData } = await supabase
          .from("activity_logs")
          .select("*")
          .eq("actor_id", authUser.id)
          .order("created_at", { ascending: false })
          .limit(10);
        setActivityLogs((logData as ActivityLogRow[]) ?? []);
      } catch (err) {
        console.error("Dashboard load error:", err);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  // ── Derived stats ──────────────────────────────────────────────────────────
  const activeIssues = issues.filter((i) => i.status !== "returned");
  const overdueIssues = issues.filter((i) => i.status === "overdue");
  const pendingFines = fines.filter((f) => f.status === "pending");
  const paidFines = fines.filter((f) => f.status === "paid");
  const waivedFines = fines.filter((f) => f.status === "waived");
  const totalPendingAmount = pendingFines.reduce(
    (sum, f) => sum + Number(f.total_amount),
    0
  );

  const minDaysLeft =
    activeIssues.length > 0
      ? Math.min(...activeIssues.map((i) => daysUntilDue(i.due_date)))
      : null;

  const kpis = [
    {
      label: "Books Issued",
      value: activeIssues.length,
      sub: `${issues.length} total transactions`,
      icon: BookOpen,
      color: "text-[var(--brand-primary)]",
      bg: "bg-[var(--brand-primary)]/10",
    },
    {
      label: "Pending Fines",
      value: `PKR ${totalPendingAmount.toFixed(0)}`,
      sub: `${pendingFines.length} unpaid fine${pendingFines.length !== 1 ? "s" : ""}`,
      icon: AlertCircle,
      color: "text-red-600",
      bg: "bg-red-50",
    },
    {
      label: "Days Until Overdue",
      value:
        minDaysLeft === null
          ? "N/A"
          : minDaysLeft < 0
          ? `${Math.abs(minDaysLeft)}d late`
          : `${minDaysLeft}d`,
      sub:
        overdueIssues.length > 0
          ? `${overdueIssues.length} book(s) overdue`
          : "All books on time",
      icon: Clock,
      color:
        minDaysLeft !== null && minDaysLeft < 0
          ? "text-red-600"
          : "text-amber-600",
      bg:
        minDaysLeft !== null && minDaysLeft < 0 ? "bg-red-50" : "bg-amber-50",
    },
  ];

  // ── Quick actions ──────────────────────────────────────────────────────────
  const quickActions = [
    {
      label: "Search Books",
      desc: "Find and browse the catalog",
      href: "/books/search",
      icon: Search,
      color: "bg-[var(--brand-primary)]",
    },
    {
      label: "View Fines",
      desc: "Check and pay outstanding fines",
      href: "/fines",
      icon: AlertCircle,
      color: "bg-red-500",
    },
    {
      label: "Issue History",
      desc: "All your past transactions",
      href: "/transactions/issue-return",
      icon: RotateCcw,
      color: "bg-[var(--brand-gold)]",
    },
    {
      label: "My Profile",
      desc: "View membership details",
      href: "/profile",
      icon: User,
      color: "bg-emerald-600",
    },
  ];

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-[var(--brand-primary)] border-t-transparent" />
          <p className="text-sm text-gray-500">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[var(--brand-cream)]">
      {/* ── Sidebar ── */}
      <aside className="sticky top-0 hidden h-screen w-56 shrink-0 flex-col border-r border-gray-200 bg-white pt-6 shadow-sm lg:flex">
        <div className="px-5 pb-4">
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">
            Member Portal
          </p>
        </div>
        <nav className="flex flex-col gap-1 px-3">
          {[
            { label: "My Books", href: "/transactions/issue-return", icon: BookOpen },
            { label: "Search", href: "/books/search", icon: Search },
            { label: "Fines", href: "/fines", icon: AlertCircle },
            { label: "Transactions", href: "/transactions/issue-return", icon: RotateCcw },
          ].map((item) => (
            <Link
              key={item.key ?? item.label}
              href={item.href}
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-600 transition-all duration-200 hover:bg-[var(--brand-primary)]/8 hover:text-[var(--brand-primary)]"
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="mt-auto border-t border-gray-100 p-4">
          <div className="rounded-lg bg-[var(--brand-primary)]/5 p-3">
            <p className="text-xs font-medium text-[var(--brand-primary)]">
              {APP_NAME}
            </p>
            <p className="mt-0.5 text-[10px] text-gray-400 leading-tight">
              {APP_TAGLINE}
            </p>
          </div>
        </div>
      </aside>

      {/* ── Main content ── */}
      <main className="flex-1 overflow-x-hidden px-4 py-8 sm:px-6 lg:px-8">
        {/* Welcome Banner */}
        <Reveal>
          <div className="mb-8 overflow-hidden rounded-2xl bg-gradient-to-br from-[var(--brand-primary)] to-[#2a4f7a] p-6 text-white shadow-[0_4px_24px_-6px_rgba(30,58,95,0.35)]">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-medium text-white/70">
                  Welcome back
                </p>
                <h1 className="mt-1 text-2xl font-bold tracking-tight text-white">
                  {user?.full_name ?? "Library Member"}
                </h1>
                {user?.membership_number && (
                  <p className="mt-1 text-sm text-white/60">
                    Membership No: {user.membership_number}
                  </p>
                )}
              </div>
              <div className="flex flex-wrap gap-3">
                <div className="rounded-xl bg-white/10 px-4 py-2 text-center backdrop-blur-sm">
                  <p className="text-lg font-bold text-white">
                    {activeIssues.length}
                  </p>
                  <p className="text-xs text-white/70">Active Issues</p>
                </div>
                <div className="rounded-xl bg-white/10 px-4 py-2 text-center backdrop-blur-sm">
                  <p className="text-lg font-bold text-white">
                    {pendingFines.length}
                  </p>
                  <p className="text-xs text-white/70">Pending Fines</p>
                </div>
              </div>
            </div>
          </div>
        </Reveal>

        {/* KPI Row */}
        <Reveal>
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3"
          >
            {kpis.map((kpi) => (
              <motion.div
                key={kpi.label}
                variants={fadeInUp}
                className="rounded-2xl border border-gray-100 bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04),0_8px_20px_-8px_rgba(0,0,0,0.08)]"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">
                      {kpi.label}
                    </p>
                    <p
                      className={cn(
                        "mt-1 text-2xl font-bold tracking-tight",
                        kpi.color
                      )}
                    >
                      {kpi.value}
                    </p>
                    <p className="mt-0.5 text-xs text-gray-400">{kpi.sub}</p>
                  </div>
                  <div className={cn("rounded-xl p-2.5", kpi.bg)}>
                    <kpi.icon className={cn("h-5 w-5", kpi.color)} />
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </Reveal>

        {/* Issued Books Table + Fines Overview */}
        <div className="mb-8 grid grid-cols-1 gap-6 xl:grid-cols-3">
          {/* Issued Books Table */}
          <Reveal className="xl:col-span-2">
            <div className="rounded-2xl border border-gray-100 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04),0_8px_20px_-8px_rgba(0,0,0,0.08)]">
              <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
                <h2 className="text-base font-semibold text-gray-800">
                  Currently Issued Books
                </h2>
                <Link
                  href="/transactions/issue-return"
                  className="flex items-center gap-1 text-xs font-medium text-[var(--brand-primary)] hover:underline"
                >
                  View all <ChevronRight className="h-3 w-3" />
                </Link>
              </div>
              <div className="overflow-x-auto">
                {activeIssues.length === 0 ? (
                  <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
                    <BookOpen className="h-10 w-10 text-gray-200" />
                    <p className="text-sm text-gray-400">
                      No books currently issued
                    </p>
                    <Link
                      href="/books/search"
                      className="mt-1 text-xs font-medium text-[var(--brand-primary)] hover:underline"
                    >
                      Browse the catalog
                    </Link>
                  </div>
                ) : (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-50 bg-gray-50/60">
                        <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">
                          Book
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">
                          Due Date
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">
                          Status
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">
                          Countdown
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {activeIssues.map((issue) => {
                        const daysLeft = daysUntilDue(issue.due_date);
                        const isOverdue = daysLeft < 0;
                        return (
                          <tr
                            key={issue.id}
                            className={cn(
                              "transition-colors hover:bg-gray-50/50",
                              isOverdue && "bg-red-50/40"
                            )}
                          >
                            <td className="px-5 py-3.5">
                              <p
                                className={cn(
                                  "font-medium",
                                  isOverdue
                                    ? "text-red-700"
                                    : "text-gray-800"
                                )}
                              >
                                {issue.book?.title ?? "Unknown Title"}
                              </p>
                              <p className="text-xs text-gray-400">
                                {issue.book?.author ?? ""}
                              </p>
                            </td>
                            <td className="px-4 py-3.5 text-gray-600">
                              <div className="flex items-center gap-1.5">
                                <Calendar className="h-3.5 w-3.5 text-gray-300" />
                                {formatDate(issue.due_date)}
                              </div>
                            </td>
                            <td className="px-4 py-3.5">
                              <span
                                className={cn(
                                  "rounded-full px-2.5 py-0.5 text-xs font-semibold",
                                  getStatusColor(issue.status)
                                )}
                              >
                                {issue.status.charAt(0).toUpperCase() +
                                  issue.status.slice(1)}
                              </span>
                            </td>
                            <td className="px-4 py-3.5">
                              {getDueBadge(daysLeft, issue.status)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </Reveal>

          {/* Fines Overview Card */}
          <Reveal>
            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04),0_8px_20px_-8px_rgba(0,0,0,0.08)]">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-base font-semibold text-gray-800">
                  Fines Overview
                </h2>
                <Link
                  href="/fines"
                  className="flex items-center gap-1 text-xs font-medium text-[var(--brand-primary)] hover:underline"
                >
                  Details <ChevronRight className="h-3 w-3" />
                </Link>
              </div>

              {fines.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-2 py-8 text-center">
                  <CheckCircle className="h-10 w-10 text-emerald-200" />
                  <p className="text-sm font-medium text-emerald-600">
                    No fines on record
                  </p>
                  <p className="text-xs text-gray-400">
                    Keep returning books on time!
                  </p>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-center">
                    <DonutChart
                      paid={paidFines.length}
                      pending={pendingFines.length}
                      waived={waivedFines.length}
                    />
                  </div>
                  <div className="mt-4 space-y-2">
                    {[
                      {
                        label: "Paid",
                        count: paidFines.length,
                        color: "bg-emerald-500",
                        amount: paidFines.reduce(
                          (s, f) => s + Number(f.total_amount),
                          0
                        ),
                      },
                      {
                        label: "Pending",
                        count: pendingFines.length,
                        color: "bg-red-500",
                        amount: totalPendingAmount,
                      },
                      {
                        label: "Waived",
                        count: waivedFines.length,
                        color: "bg-[var(--brand-gold)]",
                        amount: waivedFines.reduce(
                          (s, f) => s + Number(f.total_amount),
                          0
                        ),
                      },
                    ].map((row) => (
                      <div
                        key={row.label}
                        className="flex items-center justify-between text-sm"
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className={cn(
                              "h-2.5 w-2.5 rounded-full",
                              row.color
                            )}
                          />
                          <span className="text-gray-600">{row.label}</span>
                          <span className="text-xs text-gray-400">
                            ({row.count})
                          </span>
                        </div>
                        <span className="font-semibold text-gray-700">
                          PKR {row.amount.toFixed(0)}
                        </span>
                      </div>
                    ))}
                  </div>
                  {totalPendingAmount > 0 && (
                    <Link
                      href="/fines"
                      className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-red-500 px-4 py-2.5 text-sm font-semibold text-white transition-all duration-200 hover:bg-red-600"
                    >
                      Pay PKR {totalPendingAmount.toFixed(0)}
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  )}
                </>
              )}
            </div>
          </Reveal>
        </div>

        {/* Transaction Timeline + Quick Actions */}
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          {/* Recent Transaction Timeline */}
          <Reveal className="xl:col-span-2">
            <div className="rounded-2xl border border-gray-100 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04),0_8px_20px_-8px_rgba(0,0,0,0.08)]">
              <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
                <h2 className="text-base font-semibold text-gray-800">
                  Recent Activity
                </h2>
                <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-500">
                  Last 10 events
                </span>
              </div>
              <div className="px-5 py-4">
                {activityLogs.length === 0 ? (
                  <div className="flex flex-col items-center justify-center gap-2 py-8 text-center">
                    <TrendingUp className="h-10 w-10 text-gray-200" />
                    <p className="text-sm text-gray-400">
                      No recent activity found
                    </p>
                  </div>
                ) : (
                  <ol className="relative border-l border-gray-100 pl-5">
                    {activityLogs.map((log, idx) => (
                      <li
                        key={log.id}
                        className={cn(
                          "relative pb-5",
                          idx === activityLogs.length - 1 && "pb-0"
                        )}
                      >
                        <span className="absolute -left-[22px] flex h-8 w-8 items-center justify-center rounded-full border border-gray-100 bg-white shadow-sm">
                          <ActionIcon type={log.action_type} />
                        </span>
                        <div className="ml-2">
                          <p className="text-sm font-medium text-gray-800">
                            {log.description ??
                              log.action_type
                                .replace(/_/g, " ")
                                .replace(/\b\w/g, (c) => c.toUpperCase())}
                          </p>
                          <p className="mt-0.5 text-xs text-gray-400">
                            {formatDate(log.created_at)}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ol>
                )}
              </div>
            </div>
          </Reveal>

          {/* Quick Actions */}
          <Reveal>
            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04),0_8px_20px_-8px_rgba(0,0,0,0.08)]">
              <h2 className="mb-4 text-base font-semibold text-gray-800">
                Quick Actions
              </h2>
              <div className="grid grid-cols-2 gap-3">
                {quickActions.map((action) => (
                  <motion.div
                    key={action.label}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    transition={{ duration: 0.15 }}
                  >
                    <Link
                      href={action.href}
                      className="flex flex-col items-center gap-2.5 rounded-xl border border-gray-100 p-4 text-center transition-all duration-200 hover:border-[var(--brand-primary)]/20 hover:shadow-md"
                    >
                      <div
                        className={cn(
                          "flex h-10 w-10 items-center justify-center rounded-xl text-white",
                          action.color
                        )}
                      >
                        <action.icon className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-gray-700">
                          {action.label}
                        </p>
                        <p className="mt-0.5 text-[10px] leading-tight text-gray-400">
                          {action.desc}
                        </p>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>

              {/* Fine rate info */}
              <div className="mt-4 rounded-xl bg-amber-50 p-3">
                <div className="flex items-start gap-2">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                  <div>
                    <p className="text-xs font-semibold text-amber-700">
                      Fine Policy
                    </p>
                    <p className="mt-0.5 text-[11px] leading-relaxed text-amber-600">
                      PKR {FINE_RATE} per day for overdue books. Return on time
                      to avoid charges.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </main>
    </div>
  );
}