"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { BookOpen, AlertCircle, Clock, Search, ArrowRight, CheckCircle, RotateCcw, TrendingUp, Calendar, User, ChevronRight, DollarSign, Activity, BookMarked, Zap } from 'lucide-react';
import { Reveal } from "@/components/Reveal";
import { staggerContainer, fadeInUp } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

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
      return "bg-emerald-100 text-emerald-700 border-emerald-200";
    case "overdue":
      return "bg-red-100 text-red-700 border-red-200";
    case "issued":
      return "bg-blue-100 text-blue-700 border-blue-200";
    default:
      return "bg-gray-100 text-gray-600 border-gray-200";
  }
}

function getStatusIcon(status: string) {
  switch (status) {
    case "returned":
      return <CheckCircle className="h-3 w-3" />;
    case "overdue":
      return <AlertCircle className="h-3 w-3" />;
    case "issued":
      return <BookOpen className="h-3 w-3" />;
    default:
      return null;
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

  const r = 28;
  const circ = 2 * Math.PI * r;
  const paidDash = (paidPct / 100) * circ;
  const pendingDash = (pendingPct / 100) * circ;
  const waivedDash = (waivedPct / 100) * circ;

  let offset = 0;
  const segments = [
    { dash: paidDash, color: "#27ae60", offset },
    { dash: pendingDash, color: "#f39c12", offset: (offset += paidDash) },
    { dash: waivedDash, color: "#2980b9", offset: (offset += pendingDash) },
  ];

  return (
    <svg width="72" height="72" viewBox="0 0 72 72" className="rotate-[-90deg]">
      <circle cx="36" cy="36" r={r} fill="none" stroke="#e5e7eb" strokeWidth="8" />
      {segments.map((seg, i) =>
        seg.dash > 0 ? (
          <circle
            key={i}
            cx="36"
            cy="36"
            r={r}
            fill="none"
            stroke={seg.color}
            strokeWidth="8"
            strokeDasharray={`${seg.dash} ${circ - seg.dash}`}
            strokeDashoffset={-seg.offset}
            strokeLinecap="round"
          />
        ) : null
      )}
    </svg>
  );
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function activityDotColor(actionType: string): string {
  if (actionType.includes("issue")) return "bg-blue-500";
  if (actionType.includes("return")) return "bg-emerald-500";
  if (actionType.includes("fine")) return "bg-amber-500";
  if (actionType.includes("login")) return "bg-purple-500";
  return "bg-slate-400";
}

function activityIcon(actionType: string) {
  if (actionType.includes("issue")) return <BookMarked className="h-3.5 w-3.5 text-blue-600" />;
  if (actionType.includes("return")) return <RotateCcw className="h-3.5 w-3.5 text-emerald-600" />;
  if (actionType.includes("fine")) return <DollarSign className="h-3.5 w-3.5 text-amber-600" />;
  return <Activity className="h-3.5 w-3.5 text-slate-500" />;
}

// ─── Quick Action Card ───────────────────────────────────────────────────────────

function QuickActionCard({
  href,
  icon: Icon,
  title,
  description,
  accentColor,
  bgColor,
}: {
  href: string;
  icon: React.ElementType;
  title: string;
  description: string;
  accentColor: string;
  bgColor: string;
}) {
  return (
    <Link href={href}>
      <motion.div
        whileHover={{ y: -4, boxShadow: "0 12px 40px -8px rgba(30,58,95,0.20)" }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        className="group relative flex items-center gap-4 rounded-2xl border border-[#d6cfc2] bg-white p-5 cursor-pointer transition-all duration-200 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_4px_16px_-4px_rgba(0,0,0,0.08)] overflow-hidden"
      >
        {/* Subtle background accent */}
        <div
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          style={{ background: `radial-gradient(ellipse at top left, ${bgColor} 0%, transparent 60%)` }}
        />
        <div
          className="relative flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center"
          style={{ backgroundColor: bgColor }}
        >
          <Icon className="w-5 h-5" style={{ color: accentColor }} />
        </div>
        <div className="relative flex-1 min-w-0">
          <p className="font-semibold text-[#1a2a3a] text-sm leading-tight">{title}</p>
          <p className="text-xs text-slate-500 mt-0.5 leading-snug">{description}</p>
        </div>
        <ArrowRight
          className="relative flex-shrink-0 w-4 h-4 text-slate-300 group-hover:text-slate-500 group-hover:translate-x-1 transition-all duration-200"
        />
      </motion.div>
    </Link>
  );
}

// ─── Stat Card ───────────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  icon: Icon,
  iconBg,
  iconColor,
  borderColor,
  sub,
}: {
  label: string;
  value: string | number;
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
  borderColor: string;
  sub?: string;
}) {
  return (
    <motion.div
      whileHover={{ y: -4, boxShadow: "0 12px 40px -8px rgba(30,58,95,0.18)" }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className="relative bg-white rounded-2xl border border-[#d6cfc2] p-5 flex items-center gap-4 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_4px_16px_-4px_rgba(0,0,0,0.08)] overflow-hidden"
    >
      {/* Left border accent */}
      <div
        className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl"
        style={{ backgroundColor: borderColor }}
      />
      <div
        className="flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center"
        style={{ backgroundColor: iconBg }}
      >
        <Icon className="w-5 h-5" style={{ color: iconColor }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-2xl font-bold text-[#1a2a3a] leading-none tracking-tight">{value}</p>
        <p className="text-xs text-slate-500 mt-1 leading-snug">{label}</p>
        {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
      </div>
    </motion.div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────────

export default function MemberDashboard() {
  const supabase = createClient();

  const [user, setUser] = useState<UserRow | null>(null);
  const [issuedBooks, setIssuedBooks] = useState<EnrichedIssue[]>([]);
  const [fines, setFines] = useState<FineRow[]>([]);
  const [activity, setActivity] = useState<ActivityLogRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError(null);

      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session?.user) {
          setError("Not authenticated.");
          setLoading(false);
          return;
        }

        const userId = session.user.id;

        // Fetch user profile
        const { data: userRow, error: userErr } = await supabase
          .from("users")
          .select("id, full_name, email, role, membership_number, is_active")
          .eq("id", userId)
          .single();

        if (userErr) throw new Error(userErr.message);
        setUser(userRow);

        // Fetch issued books
        const { data: issues, error: issueErr } = await supabase
          .from("book_issues")
          .select("*")
          .eq("user_id", userId)
          .order("created_at", { ascending: false })
          .limit(10);

        if (issueErr) throw new Error(issueErr.message);

        // Enrich with book data
        const enriched: EnrichedIssue[] = [];
        for (const issue of issues ?? []) {
          const { data: book } = await supabase
            .from("books")
            .select("id, title, author, isbn, category, shelf_location")
            .eq("id", issue.book_id)
            .single();
          enriched.push({ ...issue, book: book ?? undefined });
        }
        setIssuedBooks(enriched);

        // Fetch fines
        const { data: fineRows, error: fineErr } = await supabase
          .from("fines")
          .select("*")
          .eq("user_id", userId)
          .order("created_at", { ascending: false });

        if (fineErr) throw new Error(fineErr.message);
        setFines(fineRows ?? []);

        // Fetch activity
        const { data: activityRows, error: actErr } = await supabase
          .from("activity_logs")
          .select("*")
          .eq("actor_id", userId)
          .order("created_at", { ascending: false })
          .limit(8);

        if (actErr) throw new Error(actErr.message);
        setActivity(activityRows ?? []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load dashboard.");
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  // ─── Derived stats ─────────────────────────────────────────────────────────
  const activeIssues = issuedBooks.filter((i) => i.status === "issued" || i.status === "overdue");
  const overdueIssues = issuedBooks.filter((i) => i.status === "overdue");
  const pendingFines = fines.filter((f) => f.status === "pending");
  const totalPendingAmount = pendingFines.reduce((sum, f) => sum + f.total_amount, 0);
  const paidFines = fines.filter((f) => f.status === "paid").length;
  const waivedFines = fines.filter((f) => f.status === "waived").length;

  // ─── Loading ───────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f5f0e8]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-4 border-[#1e3a5f]/20 border-t-[#1e3a5f] animate-spin" />
          <p className="text-sm text-slate-500 font-medium">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f5f0e8]">
        <div className="bg-white rounded-2xl border border-red-200 p-8 max-w-md text-center shadow-lg">
          <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-3" />
          <h2 className="text-lg font-semibold text-[#1a2a3a] mb-1">Something went wrong</h2>
          <p className="text-sm text-slate-500">{error}</p>
          <Link
            href="/login"
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#1e3a5f] text-white px-5 py-2.5 text-sm font-medium hover:bg-[#162d4a] transition-colors"
          >
            Back to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f0e8]">
      {/* ── Page Header ─────────────────────────────────────────────────────── */}
      <div
        className="relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, #1e3a5f 0%, #2a4f7c 100%)" }}
      >
        {/* Decorative blobs */}
        <div
          className="absolute -top-24 -right-24 w-96 h-96 rounded-full opacity-10"
          style={{
            background:
              "radial-gradient(circle, #c8a96e 0%, transparent 70%)",
          }}
        />
        <div
          className="absolute -bottom-16 -left-16 w-72 h-72 rounded-full opacity-10"
          style={{
            background:
              "radial-gradient(circle, #ffffff 0%, transparent 70%)",
          }}
        />
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] opacity-5"
          style={{
            background:
              "radial-gradient(ellipse, #c8a96e 0%, transparent 60%)",
          }}
        />

        <div className="container-lms relative py-10 md:py-14">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              {/* Greeting */}
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-full bg-[#c8a96e]/20 border border-[#c8a96e]/40 flex items-center justify-center">
                  <User className="w-4 h-4 text-[#c8a96e]" />
                </div>
                <span className="text-[#c8a96e] text-sm font-medium tracking-wide">
                  Member Dashboard
                </span>
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight text-balance">
                Welcome back,{" "}
                <span className="text-[#c8a96e]">
                  {user?.full_name?.split(" ")[0] ?? "Member"}
                </span>
              </h1>
              <p className="mt-2 text-white/60 text-sm leading-relaxed">
                Here is an overview of your library activity and current borrowings.
              </p>
              {user?.membership_number && (
                <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-white/10 border border-white/20 px-3 py-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-[#c8a96e]" />
                  <span className="text-white/80 text-xs font-mono">
                    {user.membership_number}
                  </span>
                </div>
              )}
            </div>

            {/* Header quick stats */}
            <div className="flex gap-3 flex-wrap">
              <div className="rounded-2xl bg-white/10 border border-white/20 px-5 py-3 text-center min-w-[90px]">
                <p className="text-2xl font-bold text-white">{activeIssues.length}</p>
                <p className="text-white/60 text-xs mt-0.5">Active Issues</p>
              </div>
              <div className="rounded-2xl bg-white/10 border border-white/20 px-5 py-3 text-center min-w-[90px]">
                <p className="text-2xl font-bold text-[#e74c3c]">{overdueIssues.length}</p>
                <p className="text-white/60 text-xs mt-0.5">Overdue</p>
              </div>
              <div className="rounded-2xl bg-white/10 border border-white/20 px-5 py-3 text-center min-w-[90px]">
                <p className="text-2xl font-bold text-[#c8a96e]">{pendingFines.length}</p>
                <p className="text-white/60 text-xs mt-0.5">Pending Fines</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Main Content ─────────────────────────────────────────────────────── */}
      <div className="container-lms py-8 md:py-10 space-y-8">

        {/* ── Stats Row ──────────────────────────────────────────────────────── */}
        <Reveal>
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-2 lg:grid-cols-4 gap-4"
          >
            <motion.div variants={fadeInUp}>
              <StatCard
                label="Books Currently Issued"
                value={activeIssues.length}
                icon={BookOpen}
                iconBg="rgba(30,58,95,0.10)"
                iconColor="#1e3a5f"
                borderColor="#1e3a5f"
              />
            </motion.div>
            <motion.div variants={fadeInUp}>
              <StatCard
                label="Overdue Books"
                value={overdueIssues.length}
                icon={AlertCircle}
                iconBg="rgba(231,76,60,0.10)"
                iconColor="#e74c3c"
                borderColor="#e74c3c"
                sub={overdueIssues.length > 0 ? `PKR ${overdueIssues.length * FINE_RATE}/day accruing` : undefined}
              />
            </motion.div>
            <motion.div variants={fadeInUp}>
              <StatCard
                label="Pending Fine Amount"
                value={`PKR ${totalPendingAmount}`}
                icon={DollarSign}
                iconBg="rgba(200,169,110,0.15)"
                iconColor="#c8a96e"
                borderColor="#c8a96e"
                sub={pendingFines.length > 0 ? `${pendingFines.length} unpaid fine${pendingFines.length > 1 ? "s" : ""}` : "All clear"}
              />
            </motion.div>
            <motion.div variants={fadeInUp}>
              <StatCard
                label="Total Books Borrowed"
                value={issuedBooks.length}
                icon={TrendingUp}
                iconBg="rgba(39,174,96,0.10)"
                iconColor="#27ae60"
                borderColor="#27ae60"
                sub={`${paidFines + waivedFines} fines resolved`}
              />
            </motion.div>
          </motion.div>
        </Reveal>

        {/* ── Quick Actions ───────────────────────────────────────────────────── */}
        <Reveal delay={0.05}>
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Zap className="w-4 h-4 text-[#c8a96e]" />
              <h2 className="text-base font-semibold text-[#1a2a3a]">Quick Actions</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <QuickActionCard
                href="/books/search"
                icon={Search}
                title="Search Books"
                description="Browse the full catalog and check availability"
                accentColor="#1e3a5f"
                bgColor="rgba(30,58,95,0.08)"
              />
              <QuickActionCard
                href="/transactions/issue-return"
                icon={RotateCcw}
                title="Issue & Return"
                description="View your active transactions and return books"
                accentColor="#c8a96e"
                bgColor="rgba(200,169,110,0.12)"
              />
              <QuickActionCard
                href="/fines"
                icon={DollarSign}
                title="My Fines"
                description="Check pending fines and payment history"
                accentColor="#e74c3c"
                bgColor="rgba(231,76,60,0.08)"
              />
            </div>
          </div>
        </Reveal>

        {/* ── Issued Books ────────────────────────────────────────────────────── */}
        <Reveal delay={0.08}>
          <div className="bg-white rounded-2xl border border-[#d6cfc2] shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_-8px_rgba(0,0,0,0.10)] overflow-hidden">
            {/* Section header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#ede8df]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#1e3a5f]/10 flex items-center justify-center">
                  <BookMarked className="w-4 h-4 text-[#1e3a5f]" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-[#1a2a3a]">Issued Books</h2>
                  <p className="text-xs text-slate-400">{issuedBooks.length} total records</p>
                </div>
              </div>
              <Link
                href="/transactions/issue-return"
                className="inline-flex items-center gap-1.5 text-xs font-medium text-[#1e3a5f] hover:text-[#c8a96e] transition-colors"
              >
                View all <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {issuedBooks.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-14 h-14 rounded-2xl bg-[#f5f0e8] flex items-center justify-center mb-4">
                  <BookOpen className="w-6 h-6 text-slate-300" />
                </div>
                <p className="text-sm font-medium text-slate-500">No books issued yet</p>
                <p className="text-xs text-slate-400 mt-1">Visit the library to borrow books</p>
                <Link
                  href="/books/search"
                  className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#1e3a5f] text-white px-4 py-2 text-xs font-medium hover:bg-[#162d4a] transition-colors"
                >
                  <Search className="w-3.5 h-3.5" /> Browse Books
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-[#f0ece4]">
                {issuedBooks.map((issue) => {
                  const daysLeft = daysUntilDue(issue.due_date);
                  return (
                    <motion.div
                      key={issue.id}
                      whileHover={{ backgroundColor: "#faf8f4" }}
                      transition={{ duration: 0.15 }}
                      className="flex flex-col sm:flex-row sm:items-center gap-3 px-6 py-4"
                    >
                      {/* Book icon */}
                      <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-[#1e3a5f]/8 flex items-center justify-center">
                        <BookOpen className="w-4 h-4 text-[#1e3a5f]" />
                      </div>

                      {/* Book info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-[#1a2a3a] truncate">
                          {issue.book?.title ?? "Unknown Book"}
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {issue.book?.author ?? ""}
                          {issue.book?.category ? ` · ${issue.book.category}` : ""}
                          {issue.book?.shelf_location ? ` · Shelf: ${issue.book.shelf_location}` : ""}
                        </p>
                      </div>

                      {/* Dates */}
                      <div className="flex flex-col items-start sm:items-end gap-1 text-xs text-slate-400 flex-shrink-0">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          <span>Issued: {formatDate(issue.issue_date)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>Due: {formatDate(issue.due_date)}</span>
                        </div>
                      </div>

                      {/* Badges */}
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span
                          className={cn(
                            "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium",
                            getStatusColor(issue.status)
                          )}
                        >
                          {getStatusIcon(issue.status)}
                          {issue.status.charAt(0).toUpperCase() + issue.status.slice(1)}
                        </span>
                        {getDueBadge(daysLeft, issue.status)}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        </Reveal>

        {/* ── Bottom Row: Activity + Fine Summary ─────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

          {/* Recent Activity */}
          <Reveal delay={0.1} className="lg:col-span-3">
            <div className="bg-white rounded-2xl border border-[#d6cfc2] shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_-8px_rgba(0,0,0,0.10)] overflow-hidden h-full">
              <div className="flex items-center justify-between px-6 py-4 border-b border-[#ede8df]">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-[#c8a96e]/15 flex items-center justify-center">
                    <Activity className="w-4 h-4 text-[#c8a96e]" />
                  </div>
                  <div>
                    <h2 className="text-sm font-semibold text-[#1a2a3a]">Recent Activity</h2>
                    <p className="text-xs text-slate-400">Your latest library interactions</p>
                  </div>
                </div>
              </div>

              {activity.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Activity className="w-8 h-8 text-slate-200 mb-3" />
                  <p className="text-sm text-slate-400">No recent activity</p>
                </div>
              ) : (
                <div className="px-6 py-4">
                  <div className="relative">
                    {/* Timeline line */}
                    <div className="absolute left-3.5 top-0 bottom-0 w-px bg-[#ede8df]" />

                    <div className="space-y-5">
                      {activity.map((log, idx) => (
                        <div key={log.id} className="relative flex gap-4 pl-10">
                          {/* Timeline dot */}
                          <div
                            className={cn(
                              "absolute left-0 top-1 w-7 h-7 rounded-full border-2 border-white flex items-center justify-center shadow-sm",
                              idx === 0 ? "bg-[#1e3a5f]" : "bg-white border-[#ede8df]"
                            )}
                          >
                            <span className={idx === 0 ? "text-white" : ""}>
                              {activityIcon(log.action_type)}
                            </span>
                          </div>

                          <div className="flex-1 min-w-0 pb-1">
                            <p className="text-sm font-medium text-[#1a2a3a] leading-snug">
                              {log.description ?? log.action_type.replace(/_/g, " ")}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs text-slate-400">{timeAgo(log.created_at)}</span>
                              <span className="w-1 h-1 rounded-full bg-slate-200" />
                              <span className="text-xs text-slate-400 capitalize">{log.entity_type}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </Reveal>

          {/* Fine Summary */}
          <Reveal delay={0.12} className="lg:col-span-2">
            <div className="bg-white rounded-2xl border border-[#d6cfc2] shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_-8px_rgba(0,0,0,0.10)] overflow-hidden h-full">
              <div className="flex items-center gap-2.5 px-6 py-4 border-b border-[#ede8df]">
                <div className="w-8 h-8 rounded-lg bg-[#e74c3c]/10 flex items-center justify-center">
                  <DollarSign className="w-4 h-4 text-[#e74c3c]" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-[#1a2a3a]">Fine Summary</h2>
                  <p className="text-xs text-slate-400">{fines.length} total records</p>
                </div>
              </div>

              <div className="px-6 py-5">
                {fines.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <CheckCircle className="w-8 h-8 text-emerald-400 mb-2" />
                    <p className="text-sm font-medium text-emerald-600">No fines on record</p>
                    <p className="text-xs text-slate-400 mt-1">Keep returning books on time!</p>
                  </div>
                ) : (
                  <>
                    {/* Donut */}
                    <div className="flex items-center justify-center mb-5">
                      <div className="relative">
                        <DonutChart
                          paid={paidFines}
                          pending={pendingFines.length}
                          waived={waivedFines}
                        />
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <span className="text-lg font-bold text-[#1a2a3a]">{fines.length}</span>
                          <span className="text-[10px] text-slate-400">total</span>
                        </div>
                      </div>
                    </div>

                    {/* Legend */}
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                          <span className="text-xs text-slate-600">Paid</span>
                        </div>
                        <span className="text-xs font-semibold text-[#1a2a3a]">{paidFines}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                          <span className="text-xs text-slate-600">Pending</span>
                        </div>
                        <span className="text-xs font-semibold text-[#e74c3c]">{pendingFines.length}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                          <span className="text-xs text-slate-600">Waived</span>
                        </div>
                        <span className="text-xs font-semibold text-[#1a2a3a]">{waivedFines}</span>
                      </div>
                    </div>

                    {/* Pending amount callout */}
                    {totalPendingAmount > 0 && (
                      <div className="mt-4 rounded-xl bg-red-50 border border-red-100 px-4 py-3">
                        <p className="text-xs text-red-600 font-medium">Outstanding Balance</p>
                        <p className="text-xl font-bold text-red-700 mt-0.5">PKR {totalPendingAmount}</p>
                      </div>
                    )}

                    <Link
                      href="/fines"
                      className="mt-4 flex items-center justify-center gap-2 w-full rounded-xl border border-[#d6cfc2] bg-[#f5f0e8] text-[#1e3a5f] text-xs font-medium py-2.5 hover:bg-[#ede8df] transition-colors"
                    >
                      View Fine Details <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </>
                )}
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </div>
  );
}
