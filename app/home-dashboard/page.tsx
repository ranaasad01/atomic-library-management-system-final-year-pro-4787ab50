"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { BookOpen, Users, AlertCircle, TrendingUp, Clock, CheckCircle, ArrowRight, RefreshCw, BookMarked, DollarSign, Search, BarChart3, Activity, ChevronRight, Zap } from 'lucide-react';
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Reveal } from "@/components/Reveal";
import { staggerContainer, fadeInUp } from "@/lib/motion";

// ─── Types ──────────────────────────────────────────────────────────────────────

interface DashboardStats {
  totalBooks: number;
  totalMembers: number;
  activeIssues: number;
  overdueIssues: number;
  pendingFines: number;
  totalFineAmount: number;
}

interface RecentTransaction {
  id: string;
  book_id: string;
  user_id: string;
  status: string;
  issue_date: string;
  due_date: string;
  return_date: string | null;
  bookTitle?: string;
  memberName?: string;
}

interface RecentActivity {
  id: string;
  action_type: string;
  entity_type: string;
  description: string | null;
  created_at: string;
}

// ─── Inline constants ────────────────────────────────────────────────────────────

const FINE_RATE_PER_DAY = 5;
const DEFAULT_ISSUE_DAYS = 14;

// ─── Helpers ────────────────────────────────────────────────────────────────────

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
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

function getStatusConfig(status: string): { label: string; className: string } {
  switch (status) {
    case "issued":
      return { label: "Issued", className: "bg-blue-100 text-blue-700 border border-blue-200" };
    case "returned":
      return { label: "Returned", className: "bg-emerald-100 text-emerald-700 border border-emerald-200" };
    case "overdue":
      return { label: "Overdue", className: "bg-red-100 text-red-700 border border-red-200" };
    case "pending":
      return { label: "Pending", className: "bg-amber-100 text-amber-700 border border-amber-200" };
    case "paid":
      return { label: "Paid", className: "bg-emerald-100 text-emerald-700 border border-emerald-200" };
    case "waived":
      return { label: "Waived", className: "bg-gray-100 text-gray-600 border border-gray-200" };
    default:
      return { label: status, className: "bg-gray-100 text-gray-600 border border-gray-200" };
  }
}

function getActivityIcon(actionType: string) {
  if (actionType.includes("issue")) return <BookMarked className="h-4 w-4 text-blue-600" />;
  if (actionType.includes("return")) return <CheckCircle className="h-4 w-4 text-emerald-600" />;
  if (actionType.includes("fine")) return <DollarSign className="h-4 w-4 text-amber-600" />;
  if (actionType.includes("user")) return <Users className="h-4 w-4 text-purple-600" />;
  if (actionType.includes("book")) return <BookOpen className="h-4 w-4 text-[#1e3a5f]" />;
  return <Activity className="h-4 w-4 text-slate-500" />;
}

function getActivityIconBg(actionType: string): string {
  if (actionType.includes("issue")) return "bg-blue-50";
  if (actionType.includes("return")) return "bg-emerald-50";
  if (actionType.includes("fine")) return "bg-amber-50";
  if (actionType.includes("user")) return "bg-purple-50";
  if (actionType.includes("book")) return "bg-[#1e3a5f]/8";
  return "bg-slate-50";
}

// ─── Stat Card ───────────────────────────────────────────────────────────────────

interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  sub?: string;
  accent?: boolean;
  danger?: boolean;
  gold?: boolean;
  href?: string;
}

function StatCard({ label, value, icon, sub, accent, danger, gold, href }: StatCardProps) {
  const card = (
    <motion.div
      whileHover={{ y: -4, boxShadow: "0 12px 40px -8px rgba(30,58,95,0.22)" }}
      transition={{ duration: 0.22, ease: "easeOut" }}
      className={`relative overflow-hidden rounded-2xl border p-5 flex flex-col gap-3 cursor-pointer transition-all duration-200 ${
        accent
          ? "bg-[#1e3a5f] border-[#1e3a5f] text-white"
          : danger
          ? "bg-white border-red-200 text-[#1a2a3a]"
          : gold
          ? "bg-white border-[#c8a96e]/30 text-[#1a2a3a]"
          : "bg-white border-[#d6cfc2] text-[#1a2a3a]"
      } shadow-[0_1px_2px_rgba(0,0,0,0.04),0_4px_16px_-4px_rgba(0,0,0,0.08)]`}
    >
      {/* Subtle background decoration */}
      <div
        className={`absolute -top-4 -right-4 w-20 h-20 rounded-full opacity-10 ${
          accent ? "bg-white" : danger ? "bg-red-400" : gold ? "bg-[#c8a96e]" : "bg-[#1e3a5f]"
        }`}
      />

      <div className="flex items-start justify-between relative z-10">
        <div
          className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${
            accent
              ? "bg-white/15"
              : danger
              ? "bg-red-50"
              : gold
              ? "bg-[#c8a96e]/15"
              : "bg-[#1e3a5f]/8"
          }`}
        >
          <span
            className={`${
              accent ? "text-white" : danger ? "text-[#e74c3c]" : gold ? "text-[#c8a96e]" : "text-[#1e3a5f]"
            }`}
          >
            {icon}
          </span>
        </div>
        {href && (
          <ArrowRight
            className={`w-4 h-4 opacity-40 mt-1 ${
              accent ? "text-white" : "text-slate-400"
            }`}
          />
        )}
      </div>

      <div className="relative z-10">
        <div
          className={`text-3xl font-bold tracking-tight ${
            accent ? "text-white" : danger ? "text-[#e74c3c]" : "text-[#1e3a5f]"
          }`}
        >
          {value}
        </div>
        <div
          className={`text-sm mt-0.5 font-medium ${
            accent ? "text-white/70" : "text-slate-500"
          }`}
        >
          {label}
        </div>
        {sub && (
          <div
            className={`text-xs mt-1 ${
              accent ? "text-white/50" : "text-slate-400"
            }`}
          >
            {sub}
          </div>
        )}
      </div>
    </motion.div>
  );

  if (href) return <Link href={href}>{card}</Link>;
  return card;
}

// ─── Status Badge ────────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const config = getStatusConfig(status);
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
        config.className
      }`}
    >
      {config.label}
    </span>
  );
}

// ─── Quick Action Card ───────────────────────────────────────────────────────────

function QuickActionCard({
  icon,
  label,
  description,
  href,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  description: string;
  href: string;
  color: string;
}) {
  return (
    <Link href={href}>
      <motion.div
        whileHover={{ y: -3, boxShadow: "0 8px 32px -8px rgba(30,58,95,0.18)" }}
        transition={{ duration: 0.2 }}
        className="bg-white border border-[#d6cfc2] rounded-2xl p-4 flex items-center gap-4 cursor-pointer group shadow-[0_1px_2px_rgba(0,0,0,0.04),0_4px_16px_-4px_rgba(0,0,0,0.06)] hover:border-[#c8a96e]/40 transition-all duration-200"
      >
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-[#1e3a5f] group-hover:text-[#c8a96e] transition-colors duration-200">
            {label}
          </p>
          <p className="text-xs text-slate-500 mt-0.5 truncate">{description}</p>
        </div>
        <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-[#c8a96e] group-hover:translate-x-0.5 transition-all duration-200 flex-shrink-0" />
      </motion.div>
    </Link>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────────

export default function HomeDashboardPage() {
  const supabase = createClient();

  const [stats, setStats] = useState<DashboardStats>({
    totalBooks: 0,
    totalMembers: 0,
    activeIssues: 0,
    overdueIssues: 0,
    pendingFines: 0,
    totalFineAmount: 0,
  });
  const [recentTransactions, setRecentTransactions] = useState<RecentTransaction[]>([]);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);

  async function fetchDashboardData() {
    setLoading(true);
    setError(null);
    try {
      const [booksRes, usersRes, issuesRes, finesRes, activityRes] = await Promise.all([
        supabase.from("books").select("id", { count: "exact", head: true }),
        supabase.from("users").select("id", { count: "exact", head: true }).eq("role", "member"),
        supabase.from("book_issues").select("id, book_id, user_id, status, issue_date, due_date, return_date"),
        supabase.from("fines").select("id, total_amount, status"),
        supabase
          .from("activity_logs")
          .select("id, action_type, entity_type, description, created_at")
          .order("created_at", { ascending: false })
          .limit(8),
      ]);

      const allIssues = issuesRes.data ?? [];
      const allFines = finesRes.data ?? [];

      const activeIssues = allIssues.filter((i) => i.status === "issued").length;
      const overdueIssues = allIssues.filter((i) => i.status === "overdue").length;
      const pendingFines = allFines.filter((f) => f.status === "pending").length;
      const totalFineAmount = allFines
        .filter((f) => f.status === "pending")
        .reduce((sum, f) => sum + (f.total_amount ?? 0), 0);

      setStats({
        totalBooks: booksRes.count ?? 0,
        totalMembers: usersRes.count ?? 0,
        activeIssues,
        overdueIssues,
        pendingFines,
        totalFineAmount,
      });

      // Enrich recent transactions with book/member names
      const recentIssues = allIssues.slice(0, 6);
      const bookIds = [...new Set(recentIssues.map((i) => i.book_id))];
      const userIds = [...new Set(recentIssues.map((i) => i.user_id))];

      const [booksDetail, usersDetail] = await Promise.all([
        bookIds.length > 0
          ? supabase.from("books").select("id, title").in("id", bookIds)
          : Promise.resolve({ data: [] }),
        userIds.length > 0
          ? supabase.from("users").select("id, full_name").in("id", userIds)
          : Promise.resolve({ data: [] }),
      ]);

      const bookMap = Object.fromEntries(
        (booksDetail.data ?? []).map((b) => [b.id, b.title])
      );
      const userMap = Object.fromEntries(
        (usersDetail.data ?? []).map((u) => [u.id, u.full_name])
      );

      setRecentTransactions(
        recentIssues.map((i) => ({
          ...i,
          bookTitle: bookMap[i.book_id] ?? "Unknown Book",
          memberName: userMap[i.user_id] ?? "Unknown Member",
        }))
      );

      setRecentActivity(activityRes.data ?? []);
      setLastRefreshed(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load dashboard data.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchDashboardData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen bg-[#f5f0e8]">
      {/* ── Page Header ─────────────────────────────────────────────────────── */}
      <div
        className="relative overflow-hidden"
        style={{
          background: "linear-gradient(135deg, #1e3a5f 0%, #162d4a 60%, #0f1f33 100%)",
        }}
      >
        {/* Decorative circles */}
        <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-white/5 pointer-events-none" />
        <div className="absolute -bottom-8 -left-8 w-40 h-40 rounded-full bg-[#c8a96e]/10 pointer-events-none" />
        <div className="absolute top-1/2 right-1/4 w-24 h-24 rounded-full bg-white/3 pointer-events-none" />

        <div className="container-lms py-10 relative z-10">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-[#c8a96e]/20 border border-[#c8a96e]/30 flex items-center justify-center">
                  <BarChart3 className="w-4 h-4 text-[#c8a96e]" />
                </div>
                <span className="text-[#c8a96e] text-xs font-semibold uppercase tracking-widest">
                  Library Overview
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                Home Dashboard
              </h1>
              <p className="text-white/60 text-sm mt-1">
                Real-time snapshot of library activity and key metrics
              </p>
            </div>

            <div className="flex items-center gap-3">
              {lastRefreshed && (
                <span className="text-white/40 text-xs hidden sm:block">
                  Updated {timeAgo(lastRefreshed.toISOString())}
                </span>
              )}
              <button
                onClick={fetchDashboardData}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-white text-sm font-medium transition-all duration-200 disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                Refresh
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Main Content ─────────────────────────────────────────────────────── */}
      <div className="container-lms py-8 space-y-8">
        {/* Error Banner */}
        {error && (
          <div className="flex items-center gap-3 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-red-700">
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            <p className="text-sm font-medium">{error}</p>
          </div>
        )}

        {/* ── Stats Grid ──────────────────────────────────────────────────────── */}
        <Reveal>
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4"
          >
            <motion.div variants={fadeInUp} className="xl:col-span-1">
              <StatCard
                label="Total Books"
                value={loading ? "—" : stats.totalBooks.toLocaleString("en-US")}
                icon={<BookOpen className="w-5 h-5" />}
                sub="In catalog"
                accent
                href="/book-management"
              />
            </motion.div>
            <motion.div variants={fadeInUp} className="xl:col-span-1">
              <StatCard
                label="Members"
                value={loading ? "—" : stats.totalMembers.toLocaleString("en-US")}
                icon={<Users className="w-5 h-5" />}
                sub="Active"
                href="/user-management"
              />
            </motion.div>
            <motion.div variants={fadeInUp} className="xl:col-span-1">
              <StatCard
                label="Active Issues"
                value={loading ? "—" : stats.activeIssues}
                icon={<BookMarked className="w-5 h-5" />}
                sub={`${DEFAULT_ISSUE_DAYS}-day loan period`}
                href="/transactions/issue-return"
              />
            </motion.div>
            <motion.div variants={fadeInUp} className="xl:col-span-1">
              <StatCard
                label="Overdue"
                value={loading ? "—" : stats.overdueIssues}
                icon={<Clock className="w-5 h-5" />}
                sub="Need attention"
                danger
                href="/transactions/issue-return"
              />
            </motion.div>
            <motion.div variants={fadeInUp} className="xl:col-span-1">
              <StatCard
                label="Pending Fines"
                value={loading ? "—" : stats.pendingFines}
                icon={<AlertCircle className="w-5 h-5" />}
                sub={`PKR ${FINE_RATE_PER_DAY}/day rate`}
                danger
                href="/fine-management"
              />
            </motion.div>
            <motion.div variants={fadeInUp} className="xl:col-span-1">
              <StatCard
                label="Fine Amount"
                value={loading ? "—" : `PKR ${stats.totalFineAmount.toLocaleString("en-US")}`}
                icon={<DollarSign className="w-5 h-5" />}
                sub="Pending collection"
                gold
                href="/fine-management"
              />
            </motion.div>
          </motion.div>
        </Reveal>

        {/* ── Main Grid: Transactions + Activity ──────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Transactions */}
          <Reveal className="lg:col-span-2">
            <div className="bg-white rounded-2xl border border-[#d6cfc2] shadow-[0_1px_2px_rgba(0,0,0,0.04),0_4px_16px_-4px_rgba(0,0,0,0.08)] overflow-hidden">
              {/* Card Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-[#ede8df]">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-[#1e3a5f]/8 flex items-center justify-center">
                    <TrendingUp className="w-4 h-4 text-[#1e3a5f]" />
                  </div>
                  <div>
                    <h2 className="text-sm font-semibold text-[#1e3a5f]">Recent Transactions</h2>
                    <p className="text-xs text-slate-400">Latest book issue and return activity</p>
                  </div>
                </div>
                <Link
                  href="/transactions/issue-return"
                  className="flex items-center gap-1 text-xs font-medium text-[#c8a96e] hover:text-[#b8944f] transition-colors duration-200"
                >
                  View all
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {/* Table */}
              {loading ? (
                <div className="divide-y divide-[#ede8df]">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="px-6 py-4 flex items-center gap-4 animate-pulse">
                      <div className="w-8 h-8 rounded-lg bg-slate-100 flex-shrink-0" />
                      <div className="flex-1 space-y-1.5">
                        <div className="h-3.5 bg-slate-100 rounded w-2/3" />
                        <div className="h-3 bg-slate-100 rounded w-1/2" />
                      </div>
                      <div className="h-5 w-16 bg-slate-100 rounded-full" />
                    </div>
                  ))}
                </div>
              ) : recentTransactions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                  <BookOpen className="w-10 h-10 mb-3 opacity-30" />
                  <p className="text-sm font-medium">No transactions yet</p>
                  <p className="text-xs mt-1">Issue a book to see activity here</p>
                </div>
              ) : (
                <div className="divide-y divide-[#ede8df]">
                  {recentTransactions.map((tx) => (
                    <motion.div
                      key={tx.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="px-6 py-4 flex items-center gap-4 hover:bg-[#faf8f4] transition-colors duration-150"
                    >
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                          tx.status === "overdue"
                            ? "bg-red-50"
                            : tx.status === "returned"
                            ? "bg-emerald-50"
                            : "bg-blue-50"
                        }`}
                      >
                        {tx.status === "returned" ? (
                          <CheckCircle className="w-4 h-4 text-emerald-600" />
                        ) : tx.status === "overdue" ? (
                          <AlertCircle className="w-4 h-4 text-red-600" />
                        ) : (
                          <BookMarked className="w-4 h-4 text-blue-600" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[#1a2a3a] truncate">
                          {tx.bookTitle}
                        </p>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {tx.memberName} &middot; Due {formatDate(tx.due_date)}
                        </p>
                      </div>
                      <StatusBadge status={tx.status} />
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </Reveal>

          {/* Recent Activity */}
          <Reveal>
            <div className="bg-white rounded-2xl border border-[#d6cfc2] shadow-[0_1px_2px_rgba(0,0,0,0.04),0_4px_16px_-4px_rgba(0,0,0,0.08)] overflow-hidden h-full">
              {/* Card Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-[#ede8df]">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-[#c8a96e]/12 flex items-center justify-center">
                    <Activity className="w-4 h-4 text-[#c8a96e]" />
                  </div>
                  <div>
                    <h2 className="text-sm font-semibold text-[#1e3a5f]">Recent Activity</h2>
                    <p className="text-xs text-slate-400">System event log</p>
                  </div>
                </div>
              </div>

              {/* Activity List */}
              {loading ? (
                <div className="divide-y divide-[#ede8df]">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="px-5 py-3.5 flex items-start gap-3 animate-pulse">
                      <div className="w-7 h-7 rounded-lg bg-slate-100 flex-shrink-0 mt-0.5" />
                      <div className="flex-1 space-y-1.5">
                        <div className="h-3 bg-slate-100 rounded w-3/4" />
                        <div className="h-2.5 bg-slate-100 rounded w-1/3" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : recentActivity.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                  <Activity className="w-8 h-8 mb-2 opacity-30" />
                  <p className="text-xs font-medium">No activity logged</p>
                </div>
              ) : (
                <div className="divide-y divide-[#ede8df]">
                  {recentActivity.map((act) => (
                    <div
                      key={act.id}
                      className="px-5 py-3.5 flex items-start gap-3 hover:bg-[#faf8f4] transition-colors duration-150"
                    >
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${
                          getActivityIconBg(act.action_type)
                        }`}
                      >
                        {getActivityIcon(act.action_type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-[#1a2a3a] leading-snug line-clamp-2">
                          {act.description ?? act.action_type.replace(/_/g, " ")}
                        </p>
                        <p className="text-[10px] text-slate-400 mt-1">
                          {timeAgo(act.created_at)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Reveal>
        </div>

        {/* ── Quick Actions ────────────────────────────────────────────────────── */}
        <Reveal>
          <div className="bg-white rounded-2xl border border-[#d6cfc2] shadow-[0_1px_2px_rgba(0,0,0,0.04),0_4px_16px_-4px_rgba(0,0,0,0.08)] p-6">
            <div className="flex items-center gap-2.5 mb-5">
              <div className="w-8 h-8 rounded-lg bg-[#1e3a5f]/8 flex items-center justify-center">
                <Zap className="w-4 h-4 text-[#1e3a5f]" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-[#1e3a5f]">Quick Actions</h2>
                <p className="text-xs text-slate-400">Jump to common library tasks</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <QuickActionCard
                icon={<Search className="w-5 h-5 text-[#1e3a5f]" />}
                label="Search Books"
                description="Browse the full catalog"
                href="/books/search"
                color="bg-[#1e3a5f]/8"
              />
              <QuickActionCard
                icon={<BookMarked className="w-5 h-5 text-blue-600" />}
                label="Issue a Book"
                description="Record a new book issue"
                href="/transactions/issue-return"
                color="bg-blue-50"
              />
              <QuickActionCard
                icon={<CheckCircle className="w-5 h-5 text-emerald-600" />}
                label="Process Return"
                description="Mark a book as returned"
                href="/transactions/issue-return"
                color="bg-emerald-50"
              />
              <QuickActionCard
                icon={<DollarSign className="w-5 h-5 text-amber-600" />}
                label="Manage Fines"
                description="View and settle overdue fines"
                href="/fine-management"
                color="bg-amber-50"
              />
            </div>
          </div>
        </Reveal>

        {/* ── Admin Shortcuts ──────────────────────────────────────────────────── */}
        <Reveal>
          <div
            className="rounded-2xl p-6 relative overflow-hidden"
            style={{
              background: "linear-gradient(135deg, #1e3a5f 0%, #162d4a 100%)",
            }}
          >
            {/* Decorative */}
            <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full bg-white/5 pointer-events-none" />
            <div className="absolute bottom-0 left-1/3 w-24 h-24 rounded-full bg-[#c8a96e]/10 pointer-events-none" />

            <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <div className="w-6 h-6 rounded-md bg-[#c8a96e]/20 flex items-center justify-center">
                    <BarChart3 className="w-3.5 h-3.5 text-[#c8a96e]" />
                  </div>
                  <span className="text-[#c8a96e] text-xs font-semibold uppercase tracking-wider">
                    Admin Panel
                  </span>
                </div>
                <h3 className="text-white font-bold text-lg">
                  Full Library Management
                </h3>
                <p className="text-white/60 text-sm mt-0.5">
                  Access books, users, transactions, and fine management from the admin panel.
                </p>
              </div>
              <div className="flex flex-wrap gap-2 flex-shrink-0">
                <Link
                  href="/admin/dashboard"
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#c8a96e] hover:bg-[#b8944f] text-[#1a2a3a] text-sm font-semibold transition-all duration-200 shadow-[0_2px_8px_rgba(200,169,110,0.4)]"
                >
                  Admin Dashboard
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/admin/books"
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-white text-sm font-medium transition-all duration-200"
                >
                  Manage Books
                </Link>
                <Link
                  href="/admin/users"
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-white text-sm font-medium transition-all duration-200"
                >
                  Manage Users
                </Link>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </div>
  );
}
