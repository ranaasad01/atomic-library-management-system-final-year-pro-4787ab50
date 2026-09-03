"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { BookOpen, Users, AlertCircle, TrendingUp, Clock, CheckCircle, ArrowRight, RefreshCw, BookMarked, DollarSign } from 'lucide-react';
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Reveal } from "@/components/Reveal";
import { staggerContainer, fadeInUp } from "@/lib/motion";
type APP_NAME = any;
const APP_NAME: any = [];
type APP_TAGLINE = any;
const APP_TAGLINE: any = [];
type getIssueStatusLabel = any;
const getIssueStatusLabel: any = [];
type getFineStatusLabel = any;
const getFineStatusLabel: any = [];

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

// ─── Stat Card ───────────────────────────────────────────────────────────────────

interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  accent?: boolean;
  danger?: boolean;
  href?: string;
}

function StatCard({ label, value, icon, accent, danger, href }: StatCardProps) {
  const card = (
    <motion.div
      whileHover={{ y: -3, boxShadow: "0 8px 32px -8px rgba(30,58,95,0.18)" }}
      transition={{ duration: 0.2 }}
      className={`relative rounded-2xl border p-5 flex flex-col gap-3 cursor-pointer transition-all duration-200 ${
        accent
          ? "bg-[var(--brand-navy)] border-[var(--brand-navy)] text-white"
          : danger
          ? "bg-[var(--brand-danger)]/8 border-[var(--brand-danger)]/20 text-[hsl(var(--foreground))]"
          : "bg-[hsl(var(--card))] border-[hsl(var(--border))] text-[hsl(var(--foreground))]"
      }`}
    >
      <div
        className={`w-10 h-10 rounded-xl flex items-center justify-center ${
          accent
            ? "bg-white/15"
            : danger
            ? "bg-[var(--brand-danger)]/15"
            : "bg-[var(--brand-gold)]/15"
        }`}
      >
        <span className={accent ? "text-white" : danger ? "text-[var(--brand-danger)]" : "text-[var(--brand-gold)]"}>
          {icon}
        </span>
      </div>
      <div>
        <div className={`text-3xl font-bold tracking-tight ${accent ? "text-white" : ""}`}>{value}</div>
        <div className={`text-sm mt-0.5 ${accent ? "text-white/70" : "text-[hsl(var(--muted-foreground))]"}`}>
          {label}
        </div>
      </div>
      {href && (
        <ArrowRight
          className={`absolute top-5 right-5 w-4 h-4 opacity-40 ${accent ? "text-white" : "text-[hsl(var(--muted-foreground))]"}`}
        />
      )}
    </motion.div>
  );

  if (href) return <Link href={href}>{card}</Link>;
  return card;
}

// ─── Status Badge ────────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    issued: "bg-blue-100 text-blue-700",
    returned: "bg-green-100 text-green-700",
    overdue: "bg-red-100 text-red-700",
    pending: "bg-amber-100 text-amber-700",
    paid: "bg-green-100 text-green-700",
    waived: "bg-gray-100 text-gray-600",
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${map[status] ?? "bg-gray-100 text-gray-600"}`}>
      {getIssueStatusLabel(status) || getFineStatusLabel(status) || status}
    </span>
  );
}

// ─── Skeleton ────────────────────────────────────────────────────────────────────

function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-[hsl(var(--muted))]/60 ${className ?? ""}`} />;
}

// ─── Main Page ───────────────────────────────────────────────────────────────────

export default function HomeDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentTransactions, setRecentTransactions] = useState<RecentTransaction[]>([]);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<{ full_name: string; role: string } | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    async function loadDashboard() {
      const supabase = createClient();

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from("users")
          .select("full_name, role")
          .eq("id", user.id)
          .single();
        if (profile) setCurrentUser(profile);
      }

      // Fetch books count
      const { count: totalBooks } = await supabase
        .from("books")
        .select("*", { count: "exact", head: true });

      // Fetch members count
      const { count: totalMembers } = await supabase
        .from("users")
        .select("*", { count: "exact", head: true })
        .eq("role", "member")
        .eq("is_active", true);

      // Fetch active issues
      const { count: activeIssues } = await supabase
        .from("book_issues")
        .select("*", { count: "exact", head: true })
        .eq("status", "issued");

      // Fetch overdue issues
      const { count: overdueIssues } = await supabase
        .from("book_issues")
        .select("*", { count: "exact", head: true })
        .eq("status", "overdue");

      // Fetch pending fines
      const { count: pendingFines, data: fineData } = await supabase
        .from("fines")
        .select("total_amount")
        .eq("status", "pending");

      const totalFineAmount = (fineData ?? []).reduce((sum, f) => sum + Number(f.total_amount), 0);

      setStats({
        totalBooks: totalBooks ?? 0,
        totalMembers: totalMembers ?? 0,
        activeIssues: activeIssues ?? 0,
        overdueIssues: overdueIssues ?? 0,
        pendingFines: pendingFines ?? 0,
        totalFineAmount,
      });

      // Fetch recent transactions
      const { data: issues } = await supabase
        .from("book_issues")
        .select("id, book_id, user_id, status, issue_date, due_date, return_date")
        .order("created_at", { ascending: false })
        .limit(6);

      if (issues && issues.length > 0) {
        // Fetch book titles
        const bookIds = [...new Set(issues.map((i) => i.book_id))];
        const userIds = [...new Set(issues.map((i) => i.user_id))];

        const { data: books } = await supabase
          .from("books")
          .select("id, title")
          .in("id", bookIds);

        const { data: users } = await supabase
          .from("users")
          .select("id, full_name")
          .in("id", userIds);

        const bookMap = Object.fromEntries((books ?? []).map((b) => [b.id, b.title]));
        const userMap = Object.fromEntries((users ?? []).map((u) => [u.id, u.full_name]));

        setRecentTransactions(
          issues.map((i) => ({
            ...i,
            bookTitle: bookMap[i.book_id] ?? "Unknown Book",
            memberName: userMap[i.user_id] ?? "Unknown Member",
          }))
        );
      }

      // Fetch recent activity logs
      const { data: logs } = await supabase
        .from("activity_logs")
        .select("id, action_type, entity_type, description, created_at")
        .order("created_at", { ascending: false })
        .limit(8);

      setRecentActivity(logs ?? []);
      setLoading(false);
    }

    loadDashboard();
  }, []);

  // Subscribe to realtime updates
  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel("dashboard-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "book_issues" }, () => {
        // Reload stats on change
        setLoading(true);
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "activity_logs" }, (payload) => {
        const newLog = payload.new as RecentActivity;
        if (newLog?.id) {
          setRecentActivity((prev) => [newLog, ...prev].slice(0, 8));
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getActionIcon = (actionType: string) => {
    if (actionType.includes("issue")) return <BookMarked className="w-4 h-4 text-blue-500" />;
    if (actionType.includes("return")) return <CheckCircle className="w-4 h-4 text-green-500" />;
    if (actionType.includes("fine")) return <DollarSign className="w-4 h-4 text-amber-500" />;
    if (actionType.includes("user")) return <Users className="w-4 h-4 text-purple-500" />;
    if (actionType.includes("book")) return <BookOpen className="w-4 h-4 text-[var(--brand-navy)]" />;
    return <TrendingUp className="w-4 h-4 text-gray-400" />;
  };

  return (
    <div className="min-h-screen bg-[hsl(var(--background))]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">

        {/* ── Hero Header ── */}
        <Reveal>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-[hsl(var(--foreground))]">
                {mounted && currentUser
                  ? `Welcome back, ${currentUser.full_name.split(" ")[0]}`
                  : "Dashboard"}
              </h1>
              <p className="mt-1 text-[hsl(var(--muted-foreground))] text-sm">
                {APP_TAGLINE}
              </p>
            </div>
            <div className="flex items-center gap-3">
              {mounted && currentUser?.role === "admin" && (
                <Link
                  href="/admin/dashboard"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--brand-navy)] text-white text-sm font-medium hover:bg-[var(--brand-navy)]/90 transition-colors"
                >
                  <TrendingUp className="w-4 h-4" />
                  Admin Panel
                </Link>
              )}
              <Link
                href="/books/search"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] text-sm font-medium text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))]/40 transition-colors"
              >
                <BookOpen className="w-4 h-4" />
                Browse Books
              </Link>
            </div>
          </div>
        </Reveal>

        {/* ── Stat Cards ── */}
        <Reveal>
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-32 rounded-2xl" />
              ))}
            </div>
          ) : (
            <motion.div
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4"
            >
              <motion.div variants={fadeInUp} className="col-span-1">
                <StatCard
                  label="Total Books"
                  value={stats?.totalBooks ?? 0}
                  icon={<BookOpen className="w-5 h-5" />}
                  href="/books/search"
                  accent
                />
              </motion.div>
              <motion.div variants={fadeInUp} className="col-span-1">
                <StatCard
                  label="Active Members"
                  value={stats?.totalMembers ?? 0}
                  icon={<Users className="w-5 h-5" />}
                  href="/admin/users"
                />
              </motion.div>
              <motion.div variants={fadeInUp} className="col-span-1">
                <StatCard
                  label="Books Issued"
                  value={stats?.activeIssues ?? 0}
                  icon={<BookMarked className="w-5 h-5" />}
                  href="/transactions/issue-return"
                />
              </motion.div>
              <motion.div variants={fadeInUp} className="col-span-1">
                <StatCard
                  label="Overdue"
                  value={stats?.overdueIssues ?? 0}
                  icon={<AlertCircle className="w-5 h-5" />}
                  danger
                  href="/transactions/issue-return"
                />
              </motion.div>
              <motion.div variants={fadeInUp} className="col-span-1">
                <StatCard
                  label="Pending Fines"
                  value={stats?.pendingFines ?? 0}
                  icon={<Clock className="w-5 h-5" />}
                  href="/fines"
                />
              </motion.div>
              <motion.div variants={fadeInUp} className="col-span-1">
                <StatCard
                  label="Fine Amount"
                  value={`PKR ${(stats?.totalFineAmount ?? 0).toLocaleString("en-US")}`}
                  icon={<DollarSign className="w-5 h-5" />}
                  href="/fines"
                />
              </motion.div>
            </motion.div>
          )}
        </Reveal>

        {/* ── Quick Actions ── */}
        <Reveal>
          <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6">
            <h2 className="text-base font-semibold text-[hsl(var(--foreground))] mb-4">Quick Actions</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: "Issue a Book", href: "/transactions/issue-return", icon: <BookMarked className="w-5 h-5" />, color: "text-blue-600 bg-blue-50" },
                { label: "Return a Book", href: "/transactions/issue-return", icon: <RefreshCw className="w-5 h-5" />, color: "text-green-600 bg-green-50" },
                { label: "Search Books", href: "/books/search", icon: <BookOpen className="w-5 h-5" />, color: "text-[var(--brand-navy)] bg-[var(--brand-navy)]/8" },
                { label: "Manage Fines", href: "/fines", icon: <DollarSign className="w-5 h-5" />, color: "text-amber-600 bg-amber-50" },
              ].map((action, i) => (
                <motion.div key={action.label} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                  <Link
                    href={action.href}
                    className="flex flex-col items-center gap-2 p-4 rounded-xl border border-[hsl(var(--border))] hover:border-[var(--brand-gold)]/40 hover:bg-[var(--brand-gold)]/5 transition-all duration-200 text-center group"
                  >
                    <span className={`w-10 h-10 rounded-xl flex items-center justify-center ${action.color}`}>
                      {action.icon}
                    </span>
                    <span className="text-sm font-medium text-[hsl(var(--foreground))] group-hover:text-[var(--brand-navy)]">
                      {action.label}
                    </span>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        </Reveal>

        {/* ── Two-column: Recent Transactions + Activity Log ── */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

          {/* Recent Transactions */}
          <Reveal className="lg:col-span-3">
            <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] overflow-hidden h-full">
              <div className="flex items-center justify-between px-6 py-4 border-b border-[hsl(var(--border))]">
                <h2 className="text-base font-semibold text-[hsl(var(--foreground))]">Recent Transactions</h2>
                <Link
                  href="/transactions/issue-return"
                  className="text-xs text-[var(--brand-gold)] hover:underline font-medium flex items-center gap-1"
                >
                  View all <ArrowRight className="w-3 h-3" />
                </Link>
              </div>

              {loading ? (
                <div className="p-6 space-y-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-14 rounded-xl" />
                  ))}
                </div>
              ) : recentTransactions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-[hsl(var(--muted-foreground))]">
                  <BookOpen className="w-10 h-10 mb-3 opacity-30" />
                  <p className="text-sm">No transactions yet</p>
                </div>
              ) : (
                <div className="divide-y divide-[hsl(var(--border))]">
                  {recentTransactions.map((tx) => (
                    <div key={tx.id} className="flex items-center gap-4 px-6 py-3.5 hover:bg-[hsl(var(--muted))]/30 transition-colors">
                      <div className="w-9 h-9 rounded-xl bg-[var(--brand-navy)]/8 flex items-center justify-center flex-shrink-0">
                        <BookOpen className="w-4 h-4 text-[var(--brand-navy)]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[hsl(var(--foreground))] truncate">
                          {tx.bookTitle}
                        </p>
                        <p className="text-xs text-[hsl(var(--muted-foreground))] truncate">
                          {tx.memberName} &middot; Due {formatDate(tx.due_date)}
                        </p>
                      </div>
                      <StatusBadge status={tx.status} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Reveal>

          {/* Activity Log */}
          <Reveal className="lg:col-span-2">
            <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] overflow-hidden h-full">
              <div className="flex items-center justify-between px-6 py-4 border-b border-[hsl(var(--border))]">
                <h2 className="text-base font-semibold text-[hsl(var(--foreground))]">Activity Log</h2>
                <span className="text-xs text-[hsl(var(--muted-foreground))]">Live</span>
              </div>

              {loading ? (
                <div className="p-6 space-y-3">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <Skeleton key={i} className="h-12 rounded-xl" />
                  ))}
                </div>
              ) : recentActivity.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-[hsl(var(--muted-foreground))]">
                  <TrendingUp className="w-10 h-10 mb-3 opacity-30" />
                  <p className="text-sm">No activity yet</p>
                </div>
              ) : (
                <div className="divide-y divide-[hsl(var(--border))]">
                  {recentActivity.map((log) => (
                    <div key={log.id} className="flex items-start gap-3 px-6 py-3 hover:bg-[hsl(var(--muted))]/30 transition-colors">
                      <div className="w-7 h-7 rounded-lg bg-[hsl(var(--muted))]/60 flex items-center justify-center flex-shrink-0 mt-0.5">
                        {getActionIcon(log.action_type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-[hsl(var(--foreground))] leading-snug truncate">
                          {log.description ?? `${log.action_type} on ${log.entity_type}`}
                        </p>
                        <p className="text-xs text-[hsl(var(--muted-foreground))] mt-0.5">
                          {formatDate(log.created_at)} at {formatTime(log.created_at)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Reveal>
        </div>

        {/* ── Library Info Banner ── */}
        <Reveal>
          <div className="rounded-2xl bg-[var(--brand-navy)] text-white p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold">{APP_NAME}</h3>
              <p className="text-white/70 text-sm mt-1">
                Fine rate: PKR {FINE_RATE_PER_DAY}/day overdue &middot; Default loan period: {DEFAULT_ISSUE_DAYS} days
              </p>
            </div>
            <div className="flex gap-3 flex-wrap">
              <Link
                href="/books/search"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-white text-sm font-medium transition-colors"
              >
                <BookOpen className="w-4 h-4" />
                Browse Catalog
              </Link>
              <Link
                href="/admin/dashboard"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--brand-gold)] hover:bg-[var(--brand-gold)]/90 text-[var(--brand-navy)] text-sm font-medium transition-colors"
              >
                <TrendingUp className="w-4 h-4" />
                Admin Panel
              </Link>
            </div>
          </div>
        </Reveal>

      </div>
    </div>
  );
}