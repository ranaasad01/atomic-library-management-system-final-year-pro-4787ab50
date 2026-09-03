"use client";

import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Users, BookOpen, AlertCircle, TrendingUp, Clock, CheckCircle, XCircle, Activity, BookMarked, DollarSign, RefreshCw, ArrowUpRight, Plus, ArrowRight, BarChart2, Zap, TrendingDown } from 'lucide-react';
import { Reveal } from "@/components/Reveal";
import { staggerContainer, fadeInUp } from "@/lib/motion";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import Link from "next/link";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

// ─── Types ──────────────────────────────────────────────────────────────────────

interface DashboardStats {
  totalBooks: number;
  totalUsers: number;
  activeIssues: number;
  overdueIssues: number;
  pendingFines: number;
  totalFineAmount: number;
  returnedToday: number;
  issuedToday: number;
}

interface RecentActivity {
  id: string;
  action_type: string;
  entity_type: string;
  description: string | null;
  created_at: string;
}

interface CategoryStat {
  category: string;
  count: number;
}

interface MonthlyIssue {
  month: string;
  issued: number;
  returned: number;
}

// ─── Constants ──────────────────────────────────────────────────────────────────

const FINE_RATE_PER_DAY = 5;
const PIE_COLORS = ["#1e3a5f", "#c8a96e", "#e74c3c", "#4a90d9", "#27ae60"];

const MONTHLY_MOCK: MonthlyIssue[] = [
  { month: "Aug", issued: 42, returned: 38 },
  { month: "Sep", issued: 55, returned: 50 },
  { month: "Oct", issued: 61, returned: 57 },
  { month: "Nov", issued: 48, returned: 44 },
  { month: "Dec", issued: 35, returned: 33 },
  { month: "Jan", issued: 67, returned: 60 },
];

// ─── Helpers ────────────────────────────────────────────────────────────────────

function formatCurrency(amount: number) {
  return `PKR ${amount.toLocaleString("en-PK")}`;
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

function actionDotColor(actionType: string): string {
  if (actionType.includes("issue")) return "bg-blue-500";
  if (actionType.includes("return")) return "bg-emerald-500";
  if (actionType.includes("fine")) return "bg-amber-500";
  if (actionType.includes("user")) return "bg-purple-500";
  if (actionType.includes("overdue")) return "bg-red-500";
  return "bg-slate-400";
}

function actionIcon(actionType: string) {
  if (actionType.includes("issue"))
    return <BookMarked className="h-4 w-4 text-blue-600" />;
  if (actionType.includes("return"))
    return <CheckCircle className="h-4 w-4 text-emerald-600" />;
  if (actionType.includes("fine"))
    return <DollarSign className="h-4 w-4 text-amber-600" />;
  if (actionType.includes("user"))
    return <Users className="h-4 w-4 text-purple-600" />;
  return <Activity className="h-4 w-4 text-slate-500" />;
}

function actionBadgeClass(actionType: string) {
  if (actionType.includes("issue"))
    return "bg-blue-50 text-blue-700 border-blue-200";
  if (actionType.includes("return"))
    return "bg-green-50 text-green-700 border-green-200";
  if (actionType.includes("fine"))
    return "bg-amber-50 text-amber-700 border-amber-200";
  if (actionType.includes("overdue"))
    return "bg-red-50 text-red-700 border-red-200";
  return "bg-gray-50 text-gray-600 border-gray-200";
}

// ─── Stat Card ──────────────────────────────────────────────────────────────────

interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  iconBg: string;
  sub?: string;
  trend?: { value: string; up: boolean };
}

function StatCard({ label, value, icon, iconBg, sub, trend }: StatCardProps) {
  return (
    <motion.div
      whileHover={{
        y: -4,
        boxShadow:
          "0 12px 40px -8px rgba(30,58,95,0.18), 0 2px 8px rgba(30,58,95,0.08)",
      }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="group relative overflow-hidden rounded-2xl border border-[#d6cfc2] bg-white p-5 flex flex-col gap-4 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_4px_16px_-4px_rgba(0,0,0,0.08)] cursor-default"
    >
      {/* Gradient accent line on hover */}
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-[#1e3a5f] via-[#c8a96e] to-[#1e3a5f] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

      <div className="flex items-start justify-between">
        <div
          className={cn(
            "w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0",
            iconBg
          )}
        >
          {icon}
        </div>
        {trend && (
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold",
              trend.up
                ? "bg-emerald-50 text-emerald-700"
                : "bg-red-50 text-red-600"
            )}
          >
            {trend.up ? (
              <TrendingUp className="h-3 w-3" />
            ) : (
              <TrendingDown className="h-3 w-3" />
            )}
            {trend.value}
          </span>
        )}
      </div>

      <div>
        <div className="text-3xl font-bold tracking-tight text-[#1a2a3a]">
          {value}
        </div>
        <div className="text-sm font-medium text-[#5a6a7a] mt-0.5">{label}</div>
        {sub && <div className="text-xs text-slate-400 mt-1">{sub}</div>}
      </div>
    </motion.div>
  );
}

// ─── Quick Action Card ───────────────────────────────────────────────────────────

function QuickActionCard({
  href,
  icon,
  iconBg,
  label,
  description,
}: {
  href: string;
  icon: React.ReactNode;
  iconBg: string;
  label: string;
  description: string;
}) {
  return (
    <Link href={href}>
      <motion.div
        whileHover={{
          y: -3,
          boxShadow:
            "0 8px 32px -8px rgba(30,58,95,0.18)",
        }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        className="group flex items-center gap-4 rounded-2xl border border-[#d6cfc2] bg-white p-4 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_4px_16px_-4px_rgba(0,0,0,0.06)] cursor-pointer transition-all duration-200 hover:border-[#c8a96e]/50"
      >
        <div
          className={cn(
            "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0",
            iconBg
          )}
        >
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-[#1a2a3a] leading-tight">
            {label}
          </p>
          <p className="text-xs text-[#5a6a7a] mt-0.5 truncate">{description}</p>
        </div>
        <ArrowRight className="w-4 h-4 text-[#5a6a7a] group-hover:text-[#c8a96e] group-hover:translate-x-0.5 transition-all duration-200 flex-shrink-0" />
      </motion.div>
    </Link>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────────

export default function AdminDashboardPage() {
  const supabase = createClient();

  const [stats, setStats] = useState<DashboardStats>({
    totalBooks: 0,
    totalUsers: 0,
    activeIssues: 0,
    overdueIssues: 0,
    pendingFines: 0,
    totalFineAmount: 0,
    returnedToday: 0,
    issuedToday: 0,
  });
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [categoryStats, setCategoryStats] = useState<CategoryStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);

  const fetchDashboardData = useCallback(async () => {
    try {
      const [booksRes, usersRes, issuesRes, finesRes, activityRes] =
        await Promise.all([
          supabase.from("books").select("id, category, available_copies, total_copies"),
          supabase.from("users").select("id, role, is_active"),
          supabase.from("book_issues").select("id, status, issue_date, return_date"),
          supabase.from("fines").select("id, status, total_amount"),
          supabase
            .from("activity_logs")
            .select("id, action_type, entity_type, description, created_at")
            .order("created_at", { ascending: false })
            .limit(8),
        ]);

      const books = booksRes.data ?? [];
      const users = usersRes.data ?? [];
      const issues = issuesRes.data ?? [];
      const fines = finesRes.data ?? [];
      const activity = activityRes.data ?? [];

      const today = new Date().toISOString().split("T")[0];

      const activeIssues = issues.filter((i) => i.status === "issued").length;
      const overdueIssues = issues.filter((i) => i.status === "overdue").length;
      const pendingFines = fines.filter((f) => f.status === "pending").length;
      const totalFineAmount = fines
        .filter((f) => f.status === "pending")
        .reduce((sum, f) => sum + (f.total_amount ?? 0), 0);
      const returnedToday = issues.filter(
        (i) => i.return_date && i.return_date.startsWith(today)
      ).length;
      const issuedToday = issues.filter(
        (i) => i.issue_date && i.issue_date.startsWith(today)
      ).length;

      setStats({
        totalBooks: books.length,
        totalUsers: users.length,
        activeIssues,
        overdueIssues,
        pendingFines,
        totalFineAmount,
        returnedToday,
        issuedToday,
      });

      // Category stats
      const catMap: Record<string, number> = {};
      books.forEach((b) => {
        const cat = (b as { category?: string | null }).category ?? "General";
        catMap[cat] = (catMap[cat] ?? 0) + 1;
      });
      const catStats: CategoryStat[] = Object.entries(catMap)
        .map(([category, count]) => ({ category, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);
      setCategoryStats(catStats);

      setRecentActivity(activity as RecentActivity[]);
      setLastRefreshed(new Date());
    } catch (err) {
      console.error("Dashboard fetch error:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchDashboardData();
  };

  const STAT_CARDS: StatCardProps[] = [
    {
      label: "Total Books",
      value: stats.totalBooks,
      icon: <BookOpen className="w-5 h-5 text-[#1e3a5f]" />,
      iconBg: "bg-[#1e3a5f]/10",
      sub: "In catalog",
      trend: { value: "+12%", up: true },
    },
    {
      label: "Registered Users",
      value: stats.totalUsers,
      icon: <Users className="w-5 h-5 text-purple-600" />,
      iconBg: "bg-purple-50",
      sub: "Active members",
      trend: { value: "+5%", up: true },
    },
    {
      label: "Active Issues",
      value: stats.activeIssues,
      icon: <BookMarked className="w-5 h-5 text-blue-600" />,
      iconBg: "bg-blue-50",
      sub: `${stats.issuedToday} issued today`,
    },
    {
      label: "Overdue Books",
      value: stats.overdueIssues,
      icon: <AlertCircle className="w-5 h-5 text-red-600" />,
      iconBg: "bg-red-50",
      sub: "Needs attention",
      trend:
        stats.overdueIssues > 0
          ? { value: `${stats.overdueIssues} items`, up: false }
          : undefined,
    },
    {
      label: "Pending Fines",
      value: stats.pendingFines,
      icon: <Clock className="w-5 h-5 text-amber-600" />,
      iconBg: "bg-amber-50",
      sub: formatCurrency(stats.totalFineAmount),
    },
    {
      label: "Returned Today",
      value: stats.returnedToday,
      icon: <CheckCircle className="w-5 h-5 text-emerald-600" />,
      iconBg: "bg-emerald-50",
      sub: "Books returned",
      trend:
        stats.returnedToday > 0
          ? { value: `+${stats.returnedToday}`, up: true }
          : undefined,
    },
  ];

  const QUICK_ACTIONS = [
    {
      href: "/admin/books",
      icon: <Plus className="w-5 h-5 text-[#1e3a5f]" />,
      iconBg: "bg-[#1e3a5f]/10",
      label: "Add Book",
      description: "Add a new book to the catalog",
    },
    {
      href: "/admin/users",
      icon: <Users className="w-5 h-5 text-purple-600" />,
      iconBg: "bg-purple-50",
      label: "Add User",
      description: "Register a new library member",
    },
    {
      href: "/transactions/issue-return",
      icon: <BookMarked className="w-5 h-5 text-blue-600" />,
      iconBg: "bg-blue-50",
      label: "Issue Book",
      description: "Issue a book to a member",
    },
    {
      href: "/fines",
      icon: <DollarSign className="w-5 h-5 text-amber-600" />,
      iconBg: "bg-amber-50",
      label: "Manage Fines",
      description: "View and resolve pending fines",
    },
  ];

  return (
    <div className="min-h-screen bg-[#f5f0e8]">
      {/* ── Page Header ─────────────────────────────────────────────────────── */}
      <div
        className="relative overflow-hidden"
        style={{
          background:
            "linear-gradient(135deg, #0f1f33 0%, #1e3a5f 55%, #2a4f7c 100%)",
        }}
      >
        {/* Decorative radial glows */}
        <div
          className="pointer-events-none absolute -top-24 -right-24 w-96 h-96 rounded-full opacity-20"
          style={{
            background:
              "radial-gradient(circle, #c8a96e 0%, transparent 70%)",
          }}
        />
        <div
          className="pointer-events-none absolute -bottom-16 -left-16 w-72 h-72 rounded-full opacity-10"
          style={{
            background:
              "radial-gradient(circle, #4a90d9 0%, transparent 70%)",
          }}
        />
        {/* Subtle grid pattern */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />

        <div className="container-lms relative py-10 md:py-14">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2.5 mb-3">
                <div className="w-9 h-9 rounded-xl bg-[#c8a96e]/20 border border-[#c8a96e]/30 flex items-center justify-center">
                  <BarChart2 className="w-5 h-5 text-[#c8a96e]" />
                </div>
                <span className="text-[#c8a96e] text-sm font-semibold tracking-wide uppercase">
                  Admin Panel
                </span>
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight">
                Admin Dashboard
              </h1>
              <p className="text-white/60 mt-1.5 text-sm md:text-base">
                Library Management Overview — NCBA&amp;E LMS
              </p>
              {lastRefreshed && (
                <p className="text-white/40 text-xs mt-2">
                  Last updated:{" "}
                  {lastRefreshed.toLocaleTimeString("en-US", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              )}
            </div>

            <motion.button
              onClick={handleRefresh}
              disabled={refreshing || loading}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              className="inline-flex items-center gap-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 px-5 py-2.5 text-sm font-medium text-white transition-all duration-200 disabled:opacity-50 self-start sm:self-auto"
            >
              <RefreshCw
                className={cn("h-4 w-4", refreshing && "animate-spin")}
              />
              {refreshing ? "Refreshing..." : "Refresh Data"}
            </motion.button>
          </div>
        </div>
      </div>

      {/* ── Main Content ─────────────────────────────────────────────────────── */}
      <div className="container-lms py-8 md:py-10 space-y-8">
        {/* ── Stat Cards ──────────────────────────────────────────────────────── */}
        <Reveal>
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            {loading
              ? Array.from({ length: 6 }).map((_, i) => (
                  <div
                    key={i}
                    className="rounded-2xl border border-[#d6cfc2] bg-white p-5 h-36 animate-pulse"
                  >
                    <div className="w-11 h-11 rounded-xl bg-slate-100 mb-4" />
                    <div className="h-8 w-20 bg-slate-100 rounded mb-2" />
                    <div className="h-4 w-28 bg-slate-100 rounded" />
                  </div>
                ))
              : STAT_CARDS.map((card) => (
                  <motion.div key={card.label} variants={fadeInUp}>
                    <StatCard {...card} />
                  </motion.div>
                ))}
          </motion.div>
        </Reveal>

        {/* ── Quick Actions ────────────────────────────────────────────────────── */}
        <Reveal>
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Zap className="w-4 h-4 text-[#c8a96e]" />
              <h2 className="text-base font-semibold text-[#1a2a3a]">
                Quick Actions
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {QUICK_ACTIONS.map((action) => (
                <QuickActionCard key={action.href} {...action} />
              ))}
            </div>
          </div>
        </Reveal>

        {/* ── Charts Row ──────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Monthly Bar Chart */}
          <Reveal className="lg:col-span-3">
            <div className="rounded-2xl border border-[#d6cfc2] bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04),0_4px_16px_-4px_rgba(0,0,0,0.08)] overflow-hidden">
              <div className="px-6 py-5 border-b border-[#ede8df] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[#1e3a5f]/10 flex items-center justify-center">
                    <TrendingUp className="w-4 h-4 text-[#1e3a5f]" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[#1a2a3a]">
                      Monthly Transactions
                    </p>
                    <p className="text-xs text-[#5a6a7a]">
                      Issues vs Returns — last 6 months
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-xs text-[#5a6a7a]">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-sm bg-[#1e3a5f]" />
                    Issued
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-sm bg-[#c8a96e]" />
                    Returned
                  </span>
                </div>
              </div>
              <div className="p-6 bg-[#faf8f4]">
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart
                    data={MONTHLY_MOCK}
                    margin={{ top: 4, right: 4, left: -16, bottom: 0 }}
                    barCategoryGap="30%"
                    barGap={4}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="#e8e2d8"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="month"
                      tick={{ fontSize: 12, fill: "#5a6a7a" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 12, fill: "#5a6a7a" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      contentStyle={{
                        background: "#fff",
                        border: "1px solid #d6cfc2",
                        borderRadius: 10,
                        fontSize: 12,
                        boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
                      }}
                      cursor={{ fill: "rgba(30,58,95,0.04)" }}
                    />
                    <Bar
                      dataKey="issued"
                      fill="#1e3a5f"
                      radius={[4, 4, 0, 0]}
                      name="Issued"
                    />
                    <Bar
                      dataKey="returned"
                      fill="#c8a96e"
                      radius={[4, 4, 0, 0]}
                      name="Returned"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </Reveal>

          {/* Category Pie Chart */}
          <Reveal className="lg:col-span-2">
            <div className="rounded-2xl border border-[#d6cfc2] bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04),0_4px_16px_-4px_rgba(0,0,0,0.08)] overflow-hidden h-full">
              <div className="px-6 py-5 border-b border-[#ede8df] flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#c8a96e]/15 flex items-center justify-center">
                  <BookOpen className="w-4 h-4 text-[#c8a96e]" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#1a2a3a]">
                    Books by Category
                  </p>
                  <p className="text-xs text-[#5a6a7a]">
                    Top 5 categories
                  </p>
                </div>
              </div>
              <div className="p-4 bg-[#faf8f4] flex items-center justify-center">
                {categoryStats.length > 0 ? (
                  <ResponsiveContainer width="100%" height={240}>
                    <PieChart>
                      <Pie
                        data={categoryStats}
                        dataKey="count"
                        nameKey="category"
                        cx="50%"
                        cy="45%"
                        outerRadius={80}
                        innerRadius={44}
                        paddingAngle={3}
                      >
                        {categoryStats.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={PIE_COLORS[index % PIE_COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          background: "#fff",
                          border: "1px solid #d6cfc2",
                          borderRadius: 10,
                          fontSize: 12,
                          boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
                        }}
                      />
                      <Legend
                        iconType="circle"
                        iconSize={8}
                        wrapperStyle={{ fontSize: 11, color: "#5a6a7a" }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex flex-col items-center justify-center h-48 text-[#5a6a7a]">
                    <BookOpen className="w-10 h-10 opacity-20 mb-2" />
                    <p className="text-sm">
                      {loading ? "Loading..." : "No category data"}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </Reveal>
        </div>

        {/* ── Recent Activity ──────────────────────────────────────────────────── */}
        <Reveal>
          <div className="rounded-2xl border border-[#d6cfc2] bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04),0_4px_16px_-4px_rgba(0,0,0,0.08)] overflow-hidden">
            {/* Card header */}
            <div className="px-6 py-5 border-b border-[#ede8df] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#1e3a5f]/10 flex items-center justify-center">
                  <Activity className="w-4 h-4 text-[#1e3a5f]" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#1a2a3a]">
                    Recent Activity
                  </p>
                  <p className="text-xs text-[#5a6a7a]">
                    Latest library events
                  </p>
                </div>
              </div>
              <Link
                href="/transactions/issue-return"
                className="inline-flex items-center gap-1.5 text-xs font-medium text-[#1e3a5f] hover:text-[#c8a96e] transition-colors duration-200"
              >
                View all
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Activity list */}
            <div className="divide-y divide-[#ede8df]">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-start gap-4 px-6 py-4 animate-pulse">
                    <div className="w-8 h-8 rounded-full bg-slate-100 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <div className="h-4 w-3/4 bg-slate-100 rounded mb-2" />
                      <div className="h-3 w-1/3 bg-slate-100 rounded" />
                    </div>
                  </div>
                ))
              ) : recentActivity.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-[#5a6a7a]">
                  <Activity className="w-10 h-10 opacity-20 mb-3" />
                  <p className="text-sm font-medium">No recent activity</p>
                  <p className="text-xs mt-1 opacity-70">
                    Activity will appear here as library events occur
                  </p>
                </div>
              ) : (
                recentActivity.map((item, idx) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.04, duration: 0.3 }}
                    className="flex items-start gap-4 px-6 py-4 hover:bg-[#faf8f4] transition-colors duration-150"
                  >
                    {/* Timeline dot + icon */}
                    <div className="relative flex-shrink-0 mt-0.5">
                      <div
                        className={cn(
                          "w-8 h-8 rounded-full flex items-center justify-center",
                          item.action_type.includes("issue")
                            ? "bg-blue-50"
                            : item.action_type.includes("return")
                            ? "bg-emerald-50"
                            : item.action_type.includes("fine")
                            ? "bg-amber-50"
                            : item.action_type.includes("user")
                            ? "bg-purple-50"
                            : "bg-slate-100"
                        )}
                      >
                        {actionIcon(item.action_type)}
                      </div>
                      {/* Timeline connector */}
                      {idx < recentActivity.length - 1 && (
                        <div className="absolute left-1/2 top-8 -translate-x-1/2 w-px h-full bg-[#ede8df]" />
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0 pb-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm text-[#1a2a3a] leading-snug">
                          {item.description ?? `${item.action_type} on ${item.entity_type}`}
                        </p>
                        <span className="text-xs text-[#5a6a7a] whitespace-nowrap flex-shrink-0">
                          {timeAgo(item.created_at)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span
                          className={cn(
                            "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                            actionBadgeClass(item.action_type)
                          )}
                        >
                          {item.action_type.replace(/_/g, " ")}
                        </span>
                        <span className="text-[10px] text-[#5a6a7a] capitalize">
                          {item.entity_type}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </div>
        </Reveal>

        {/* ── Summary Row ─────────────────────────────────────────────────────── */}
        <Reveal>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Fine Rate Info */}
            <div className="rounded-2xl border border-[#d6cfc2] bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_4px_16px_-4px_rgba(0,0,0,0.06)]">
              <div className="flex items-center gap-2 mb-3">
                <DollarSign className="w-4 h-4 text-[#c8a96e]" />
                <span className="text-xs font-semibold text-[#5a6a7a] uppercase tracking-wide">
                  Fine Policy
                </span>
              </div>
              <p className="text-2xl font-bold text-[#1a2a3a]">
                PKR {FINE_RATE_PER_DAY}/day
              </p>
              <p className="text-xs text-[#5a6a7a] mt-1">
                Applied automatically on overdue books
              </p>
            </div>

            {/* Total Fine Amount */}
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_4px_16px_-4px_rgba(0,0,0,0.06)]">
              <div className="flex items-center gap-2 mb-3">
                <AlertCircle className="w-4 h-4 text-amber-600" />
                <span className="text-xs font-semibold text-amber-700 uppercase tracking-wide">
                  Outstanding Fines
                </span>
              </div>
              <p className="text-2xl font-bold text-amber-800">
                {formatCurrency(stats.totalFineAmount)}
              </p>
              <p className="text-xs text-amber-600 mt-1">
                {stats.pendingFines} fine{stats.pendingFines !== 1 ? "s" : ""} pending resolution
              </p>
            </div>

            {/* System Status */}
            <div
              className="rounded-2xl p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_4px_16px_-4px_rgba(0,0,0,0.06)]"
              style={{
                background:
                  "linear-gradient(135deg, #1e3a5f 0%, #2a4f7c 100%)",
              }}
            >
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle className="w-4 h-4 text-[#c8a96e]" />
                <span className="text-xs font-semibold text-white/70 uppercase tracking-wide">
                  System Status
                </span>
              </div>
              <p className="text-2xl font-bold text-white">Operational</p>
              <p className="text-xs text-white/60 mt-1">
                All services running normally
              </p>
            </div>
          </div>
        </Reveal>
      </div>
    </div>
  );
}
