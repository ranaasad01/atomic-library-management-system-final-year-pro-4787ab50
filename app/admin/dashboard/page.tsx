"use client";

import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Users, BookOpen, AlertCircle, Clock, CheckCircle, Activity, BookMarked, DollarSign, RefreshCw, Plus, ArrowRight, TrendingUp, TrendingDown, BarChart2, BookCopy, UserCheck, ChevronRight, GraduationCap, Layers } from 'lucide-react';
import { Reveal } from "@/components/Reveal";
import { staggerContainer, fadeInUp, fadeInLeft, fadeInRight, scaleIn } from "@/lib/motion";
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

const PIE_COLORS = ["#1e3a5f", "#c8a96e", "#e74c3c", "#4a90d9", "#27ae60", "#8e44ad", "#f39c12"];

const MONTHLY_MOCK: MonthlyIssue[] = [
  { month: "Aug", issued: 42, returned: 38 },
  { month: "Sep", issued: 55, returned: 50 },
  { month: "Oct", issued: 61, returned: 57 },
  { month: "Nov", issued: 48, returned: 44 },
  { month: "Dec", issued: 35, returned: 33 },
  { month: "Jan", issued: 67, returned: 60 },
];

// ─── Helpers ────────────────────────────────────────────────────────────────────

function formatCurrency(amount: number): string {
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

function actionIcon(actionType: string) {
  if (actionType.includes("issue"))
    return <BookMarked className="h-4 w-4 text-blue-600" />;
  if (actionType.includes("return"))
    return <CheckCircle className="h-4 w-4 text-emerald-600" />;
  if (actionType.includes("fine"))
    return <DollarSign className="h-4 w-4 text-amber-600" />;
  if (actionType.includes("user"))
    return <Users className="h-4 w-4 text-purple-600" />;
  if (actionType.includes("book"))
    return <BookOpen className="h-4 w-4 text-[#1e3a5f]" />;
  return <Activity className="h-4 w-4 text-slate-500" />;
}

function actionIconBg(actionType: string): string {
  if (actionType.includes("issue")) return "bg-blue-50 border-blue-100";
  if (actionType.includes("return")) return "bg-emerald-50 border-emerald-100";
  if (actionType.includes("fine")) return "bg-amber-50 border-amber-100";
  if (actionType.includes("user")) return "bg-purple-50 border-purple-100";
  if (actionType.includes("book")) return "bg-[#1e3a5f]/5 border-[#1e3a5f]/10";
  return "bg-slate-50 border-slate-100";
}

function actionBadgeClass(actionType: string): string {
  if (actionType.includes("issue"))
    return "bg-blue-50 text-blue-700 border-blue-200";
  if (actionType.includes("return"))
    return "bg-green-50 text-green-700 border-green-200";
  if (actionType.includes("fine"))
    return "bg-amber-50 text-amber-700 border-amber-200";
  if (actionType.includes("overdue"))
    return "bg-red-50 text-red-700 border-red-200";
  if (actionType.includes("book"))
    return "bg-[#1e3a5f]/5 text-[#1e3a5f] border-[#1e3a5f]/20";
  return "bg-gray-50 text-gray-600 border-gray-200";
}

// ─── Skeleton ────────────────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl border border-[#d6cfc2] p-5 animate-pulse shadow-[0_1px_2px_rgba(0,0,0,0.04),0_4px_16px_-4px_rgba(0,0,0,0.08)]">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-[#f5f0e8]" />
        <div className="flex-1 space-y-2">
          <div className="h-6 w-16 bg-[#f5f0e8] rounded" />
          <div className="h-3 w-24 bg-[#f5f0e8] rounded" />
        </div>
      </div>
    </div>
  );
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
      whileHover={{ y: -4, boxShadow: "0 16px 48px -8px rgba(30,58,95,0.18)" }}
      transition={{ duration: 0.22, ease: "easeOut" }}
      className="bg-white rounded-2xl border border-[#d6cfc2] p-5 flex items-start gap-4 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_4px_16px_-4px_rgba(0,0,0,0.08)] cursor-default group"
    >
      <div
        className={cn(
          "w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform duration-300 group-hover:scale-110",
          iconBg
        )}
      >
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-2xl font-bold text-[#1e3a5f] leading-none tracking-tight">
          {value}
        </p>
        <p className="text-xs text-slate-500 mt-1 font-medium">{label}</p>
        {sub && (
          <p className="text-[11px] text-slate-400 mt-0.5 truncate">{sub}</p>
        )}
        {trend && (
          <div
            className={cn(
              "inline-flex items-center gap-1 mt-1.5 text-[11px] font-semibold",
              trend.up ? "text-emerald-600" : "text-red-500"
            )}
          >
            {trend.up ? (
              <TrendingUp className="h-3 w-3" />
            ) : (
              <TrendingDown className="h-3 w-3" />
            )}
            {trend.value}
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ─── Quick Action Card ───────────────────────────────────────────────────────────

interface QuickActionProps {
  href: string;
  icon: React.ReactNode;
  iconBg: string;
  title: string;
  description: string;
}

function QuickActionCard({ href, icon, iconBg, title, description }: QuickActionProps) {
  return (
    <Link href={href}>
      <motion.div
        whileHover={{ x: 4, boxShadow: "0 8px 32px -8px rgba(30,58,95,0.16)" }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        className="flex items-center gap-4 p-4 rounded-xl border border-[#d6cfc2] bg-[#f5f0e8]/40 hover:bg-white transition-all duration-200 cursor-pointer group"
      >
        <div
          className={cn(
            "w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 transition-transform duration-300 group-hover:scale-110",
            iconBg
          )}
        >
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-[#1e3a5f] leading-tight">{title}</p>
          <p className="text-xs text-slate-500 mt-0.5 truncate">{description}</p>
        </div>
        <ChevronRight className="h-4 w-4 text-[#c8a96e] flex-shrink-0 transition-transform duration-200 group-hover:translate-x-1" />
      </motion.div>
    </Link>
  );
}

// ─── Custom Tooltip ──────────────────────────────────────────────────────────────

function CustomBarTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number; color: string }>; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-[#d6cfc2] rounded-xl shadow-lg p-3 text-xs">
      <p className="font-semibold text-[#1e3a5f] mb-2">{label}</p>
      {payload.map((entry) => (
        <div key={entry.name} className="flex items-center gap-2 mb-1">
          <span
            className="w-2.5 h-2.5 rounded-full flex-shrink-0"
            style={{ background: entry.color }}
          />
          <span className="text-slate-600 capitalize">{entry.name}:</span>
          <span className="font-bold text-[#1e3a5f]">{entry.value}</span>
        </div>
      ))}
    </div>
  );
}

function CustomPieTooltip({ active, payload }: { active?: boolean; payload?: Array<{ name: string; value: number }> }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-[#d6cfc2] rounded-xl shadow-lg p-3 text-xs">
      <p className="font-semibold text-[#1e3a5f]">{payload[0].name}</p>
      <p className="text-slate-600 mt-0.5">
        <span className="font-bold text-[#1e3a5f]">{payload[0].value}</span> books
      </p>
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────────

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
  const [activities, setActivities] = useState<RecentActivity[]>([]);
  const [categoryStats, setCategoryStats] = useState<CategoryStat[]>([]);
  const [monthlyData, setMonthlyData] = useState<MonthlyIssue[]>(MONTHLY_MOCK);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayISO = today.toISOString();

      const [
        booksRes,
        usersRes,
        activeIssuesRes,
        overdueRes,
        finesRes,
        returnedTodayRes,
        issuedTodayRes,
        activitiesRes,
        categoryRes,
      ] = await Promise.all([
        supabase.from("books").select("id", { count: "exact", head: true }),
        supabase.from("users").select("id", { count: "exact", head: true }),
        supabase
          .from("book_issues")
          .select("id", { count: "exact", head: true })
          .eq("status", "issued"),
        supabase
          .from("book_issues")
          .select("id", { count: "exact", head: true })
          .eq("status", "overdue"),
        supabase
          .from("fines")
          .select("total_amount")
          .eq("status", "pending"),
        supabase
          .from("book_issues")
          .select("id", { count: "exact", head: true })
          .eq("status", "returned")
          .gte("return_date", todayISO),
        supabase
          .from("book_issues")
          .select("id", { count: "exact", head: true })
          .gte("issue_date", todayISO),
        supabase
          .from("activity_logs")
          .select("id, action_type, entity_type, description, created_at")
          .order("created_at", { ascending: false })
          .limit(8),
        supabase
          .from("books")
          .select("category"),
      ]);

      const totalFineAmount =
        finesRes.data?.reduce((sum, f) => sum + (f.total_amount ?? 0), 0) ?? 0;

      // Group categories
      const catMap: Record<string, number> = {};
      if (categoryRes.data) {
        for (const book of categoryRes.data) {
          const cat = book.category ?? "General";
          catMap[cat] = (catMap[cat] ?? 0) + 1;
        }
      }
      const catStats: CategoryStat[] = Object.entries(catMap)
        .map(([category, count]) => ({ category, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 7);

      setStats({
        totalBooks: booksRes.count ?? 0,
        totalUsers: usersRes.count ?? 0,
        activeIssues: activeIssuesRes.count ?? 0,
        overdueIssues: overdueRes.count ?? 0,
        pendingFines: finesRes.data?.length ?? 0,
        totalFineAmount,
        returnedToday: returnedTodayRes.count ?? 0,
        issuedToday: issuedTodayRes.count ?? 0,
      });

      setActivities(
        (activitiesRes.data ?? []) as RecentActivity[]
      );

      if (catStats.length > 0) setCategoryStats(catStats);
      setLastUpdated(new Date());
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load dashboard data."
      );
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const statCards = [
    {
      label: "Total Books",
      value: stats.totalBooks,
      icon: <BookOpen className="h-5 w-5 text-white" />,
      iconBg: "bg-[#1e3a5f]",
      sub: "In library catalog",
      trend: { value: "Catalog", up: true },
    },
    {
      label: "Total Members",
      value: stats.totalUsers,
      icon: <Users className="h-5 w-5 text-white" />,
      iconBg: "bg-[#c8a96e]",
      sub: "Registered users",
      trend: { value: "Active", up: true },
    },
    {
      label: "Active Issues",
      value: stats.activeIssues,
      icon: <BookMarked className="h-5 w-5 text-white" />,
      iconBg: "bg-emerald-600",
      sub: "Currently borrowed",
      trend: { value: `+${stats.issuedToday} today`, up: true },
    },
    {
      label: "Overdue Issues",
      value: stats.overdueIssues,
      icon: <AlertCircle className="h-5 w-5 text-white" />,
      iconBg: "bg-[#e74c3c]",
      sub: "Past due date",
      trend: { value: "Needs attention", up: false },
    },
    {
      label: "Pending Fines",
      value: formatCurrency(stats.totalFineAmount),
      icon: <DollarSign className="h-5 w-5 text-white" />,
      iconBg: "bg-amber-500",
      sub: `${stats.pendingFines} unpaid fine${stats.pendingFines !== 1 ? "s" : ""}`,
      trend: { value: "Uncollected", up: false },
    },
    {
      label: "Returned Today",
      value: stats.returnedToday,
      icon: <CheckCircle className="h-5 w-5 text-white" />,
      iconBg: "bg-blue-600",
      sub: "Books returned today",
      trend: { value: "Today", up: true },
    },
  ];

  const quickActions = [
    {
      href: "/admin/books",
      icon: <Plus className="h-5 w-5 text-white" />,
      iconBg: "bg-[#1e3a5f]",
      title: "Add New Book",
      description: "Add a book to the library catalog",
    },
    {
      href: "/admin/users",
      icon: <UserCheck className="h-5 w-5 text-white" />,
      iconBg: "bg-[#c8a96e]",
      title: "Manage Users",
      description: "View and manage library members",
    },
    {
      href: "/transactions/issue-return",
      icon: <BookMarked className="h-5 w-5 text-white" />,
      iconBg: "bg-emerald-600",
      title: "Issue a Book",
      description: "Record a new book issue transaction",
    },
    {
      href: "/fines",
      icon: <DollarSign className="h-5 w-5 text-white" />,
      iconBg: "bg-amber-500",
      title: "View Fines",
      description: "Manage overdue fines and payments",
    },
  ];

  return (
    <div className="min-h-screen bg-[#f5f0e8]">
      {/* ── Page Header ─────────────────────────────────────────────────────── */}
      <div
        className="relative overflow-hidden"
        style={{
          background:
            "linear-gradient(135deg, #0f1f33 0%, #1e3a5f 50%, #2a4f7c 100%)",
        }}
      >
        {/* Decorative glows */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div
            className="absolute -top-32 -right-32 w-96 h-96 rounded-full opacity-10"
            style={{
              background: "radial-gradient(circle, #c8a96e, transparent)",
            }}
          />
          <div
            className="absolute bottom-0 left-1/4 w-64 h-64 rounded-full opacity-5"
            style={{
              background: "radial-gradient(circle, #ffffff, transparent)",
            }}
          />
        </div>

        <div className="container-lms relative py-10 md:py-14">
          {/* Breadcrumb */}
          <Reveal>
            <div className="flex items-center gap-2 text-white/50 text-xs font-medium mb-4">
              <span>Admin Panel</span>
              <ChevronRight className="h-3 w-3" />
              <span className="text-[#c8a96e]">Dashboard</span>
            </div>
          </Reveal>

          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
            <Reveal>
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight">
                    Admin Dashboard
                  </h1>
                  <span
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border"
                    style={{
                      background: "rgba(200,169,110,0.15)",
                      borderColor: "rgba(200,169,110,0.4)",
                      color: "#c8a96e",
                    }}
                  >
                    <GraduationCap className="h-3 w-3" />
                    Administrator
                  </span>
                </div>
                <p className="text-white/60 text-sm">
                  Library Management System — NCBA&amp;E FYP
                </p>
              </div>
            </Reveal>

            <Reveal delay={0.1}>
              <div className="flex items-center gap-3">
                {lastUpdated && (
                  <p className="text-white/40 text-xs">
                    Updated{" "}
                    {lastUpdated.toLocaleTimeString("en-US", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                )}
                <motion.button
                  onClick={fetchDashboardData}
                  disabled={loading}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-[#1e3a5f] bg-[#c8a96e] hover:bg-[#b8944f] transition-colors duration-200 disabled:opacity-60 shadow-md"
                >
                  <RefreshCw
                    className={cn("h-4 w-4", loading && "animate-spin")}
                  />
                  Refresh
                </motion.button>
              </div>
            </Reveal>
          </div>
        </div>
      </div>

      {/* ── Main Content ─────────────────────────────────────────────────────── */}
      <div className="container-lms py-8 md:py-10 space-y-8">

        {/* Error Alert */}
        {error && (
          <Reveal>
            <div className="flex items-start gap-3 p-4 rounded-xl border border-red-200 bg-red-50 text-red-700">
              <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-sm">Failed to load dashboard data</p>
                <p className="text-xs mt-0.5 text-red-600">{error}</p>
              </div>
            </div>
          </Reveal>
        )}

        {/* ── Stats Grid ─────────────────────────────────────────────────────── */}
        <section>
          <Reveal>
            <div className="flex items-center gap-2 mb-5">
              <BarChart2 className="h-5 w-5 text-[#c8a96e]" />
              <h2 className="text-lg font-bold text-[#1e3a5f] tracking-tight">
                Library Overview
              </h2>
              <div
                className="flex-1 h-px ml-2"
                style={{
                  background:
                    "linear-gradient(90deg, #d6cfc2, transparent)",
                }}
              />
            </div>
          </Reveal>

          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          ) : (
            <motion.div
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4"
            >
              {statCards.map((card) => (
                <motion.div key={card.label} variants={fadeInUp}>
                  <StatCard
                    label={card.label}
                    value={card.value}
                    icon={card.icon}
                    iconBg={card.iconBg}
                    sub={card.sub}
                    trend={card.trend}
                  />
                </motion.div>
              ))}
            </motion.div>
          )}
        </section>

        {/* ── Charts Section ──────────────────────────────────────────────────── */}
        <section className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Bar Chart — Monthly Trends */}
          <Reveal className="lg:col-span-3">
            <div className="bg-white rounded-2xl border border-[#d6cfc2] shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_-8px_rgba(0,0,0,0.10)] p-6 h-full">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-base font-bold text-[#1e3a5f] tracking-tight">
                    Monthly Issue vs Return
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Book transaction trends over 6 months
                  </p>
                </div>
                <div className="flex items-center gap-3 text-xs">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#1e3a5f]" />
                    Issued
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#c8a96e]" />
                    Returned
                  </span>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart
                  data={monthlyData}
                  barCategoryGap="30%"
                  barGap={4}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#f0ece4"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 11, fill: "#5a6a7a" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: "#5a6a7a" }}
                    axisLine={false}
                    tickLine={false}
                    width={28}
                  />
                  <Tooltip content={<CustomBarTooltip />} />
                  <Bar
                    dataKey="issued"
                    name="issued"
                    fill="#1e3a5f"
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    dataKey="returned"
                    name="returned"
                    fill="#c8a96e"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Reveal>

          {/* Pie Chart — Book Categories */}
          <Reveal delay={0.1} className="lg:col-span-2">
            <div className="bg-white rounded-2xl border border-[#d6cfc2] shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_-8px_rgba(0,0,0,0.10)] p-6 h-full">
              <div className="mb-6">
                <h3 className="text-base font-bold text-[#1e3a5f] tracking-tight">
                  Book Categories
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Distribution by subject area
                </p>
              </div>
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
                      innerRadius={40}
                      paddingAngle={3}
                    >
                      {categoryStats.map((entry, index) => (
                        <Cell
                          key={entry.category}
                          fill={PIE_COLORS[index % PIE_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomPieTooltip />} />
                    <Legend
                      iconType="circle"
                      iconSize={8}
                      wrapperStyle={{ fontSize: "11px", color: "#5a6a7a" }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex flex-col items-center justify-center h-48 text-slate-400">
                  <Layers className="h-10 w-10 mb-2 opacity-30" />
                  <p className="text-sm">No category data yet</p>
                </div>
              )}
            </div>
          </Reveal>
        </section>

        {/* ── Bottom Section ──────────────────────────────────────────────────── */}
        <section className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Recent Activity */}
          <Reveal className="lg:col-span-3">
            <div className="bg-white rounded-2xl border border-[#d6cfc2] shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_-8px_rgba(0,0,0,0.10)] p-6 h-full">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className="text-base font-bold text-[#1e3a5f] tracking-tight">
                    Recent Activity
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Latest library events
                  </p>
                </div>
                <Link
                  href="/transactions/issue-return"
                  className="text-xs font-semibold text-[#c8a96e] hover:text-[#b8944f] flex items-center gap-1 transition-colors"
                >
                  View all
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </div>

              {loading ? (
                <div className="space-y-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-3 animate-pulse"
                    >
                      <div className="w-8 h-8 rounded-lg bg-[#f5f0e8]" />
                      <div className="flex-1 space-y-1.5">
                        <div className="h-3 w-3/4 bg-[#f5f0e8] rounded" />
                        <div className="h-2.5 w-1/3 bg-[#f5f0e8] rounded" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : activities.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                  <Activity className="h-10 w-10 mb-2 opacity-30" />
                  <p className="text-sm">No activity recorded yet</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {activities.map((act) => (
                    <div
                      key={act.id}
                      className="flex items-start gap-3 p-3 rounded-xl hover:bg-[#f5f0e8]/60 transition-colors duration-150"
                    >
                      <div
                        className={cn(
                          "w-8 h-8 rounded-lg border flex items-center justify-center flex-shrink-0",
                          actionIconBg(act.action_type)
                        )}
                      >
                        {actionIcon(act.action_type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-[#1a2a3a] leading-snug line-clamp-2">
                          {act.description ?? `${act.action_type} on ${act.entity_type}`}
                        </p>
                        <div className="flex items-center gap-2 mt-1.5">
                          <span
                            className={cn(
                              "inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border",
                              actionBadgeClass(act.action_type)
                            )}
                          >
                            {act.action_type.replace(/_/g, " ")}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {timeAgo(act.created_at)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Reveal>

          {/* Quick Actions */}
          <Reveal delay={0.1} className="lg:col-span-2">
            <div className="bg-white rounded-2xl border border-[#d6cfc2] shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_-8px_rgba(0,0,0,0.10)] p-6 h-full">
              <div className="mb-5">
                <h3 className="text-base font-bold text-[#1e3a5f] tracking-tight">
                  Quick Actions
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Common administrative tasks
                </p>
              </div>
              <div className="space-y-3">
                {quickActions.map((action) => (
                  <QuickActionCard key={action.href} {...action} />
                ))}
              </div>

              {/* Mini stats summary */}
              <div
                className="mt-5 p-4 rounded-xl border"
                style={{
                  background:
                    "linear-gradient(135deg, rgba(30,58,95,0.04) 0%, rgba(200,169,110,0.06) 100%)",
                  borderColor: "rgba(200,169,110,0.25)",
                }}
              >
                <p className="text-[11px] font-semibold text-[#1e3a5f] uppercase tracking-wider mb-3">
                  Today at a Glance
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="text-center">
                    <p className="text-xl font-bold text-[#1e3a5f]">
                      {stats.issuedToday}
                    </p>
                    <p className="text-[10px] text-slate-500 mt-0.5">Issued</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xl font-bold text-[#c8a96e]">
                      {stats.returnedToday}
                    </p>
                    <p className="text-[10px] text-slate-500 mt-0.5">Returned</p>
                  </div>
                </div>
              </div>
            </div>
          </Reveal>
        </section>

        {/* ── System Info Banner ──────────────────────────────────────────────── */}
        <Reveal>
          <div
            className="rounded-2xl overflow-hidden"
            style={{
              background:
                "linear-gradient(135deg, #0f1f33 0%, #1e3a5f 60%, #2a4f7c 100%)",
            }}
          >
            <div className="px-6 py-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{
                    background:
                      "linear-gradient(135deg, #c8a96e 0%, #b8944f 100%)",
                    boxShadow: "0 2px 12px rgba(200,169,110,0.35)",
                  }}
                >
                  <BookOpen className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-white font-bold text-sm leading-tight">
                    Library Management System
                  </p>
                  <p className="text-white/50 text-xs mt-0.5">
                    MERN Stack Final Year Project
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
                <span className="text-white/60">
                  Institution:{" "}
                  <span className="text-[#c8a96e] font-semibold">
                    NCBA&amp;E Lahore
                  </span>
                </span>
                <span className="text-white/30 hidden md:inline">|</span>
                <span className="text-white/60">
                  Supervisor:{" "}
                  <span className="text-[#c8a96e] font-semibold">Mam Hira</span>
                </span>
                <span className="text-white/30 hidden md:inline">|</span>
                <span className="text-white/60">
                  Student:{" "}
                  <span className="text-[#c8a96e] font-semibold">
                    Rao Muhammad Hamza
                  </span>
                </span>
                <span className="text-white/30 hidden md:inline">|</span>
                <span className="text-white/60">
                  Year:{" "}
                  <span className="text-[#c8a96e] font-semibold">2026</span>
                </span>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </div>
  );
}
