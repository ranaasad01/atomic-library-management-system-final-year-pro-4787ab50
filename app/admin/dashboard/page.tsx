"use client";

import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Users, BookOpen, AlertCircle, TrendingUp, Clock, CheckCircle, XCircle, Activity, BookMarked, DollarSign, RefreshCw, ArrowUpRight } from 'lucide-react';
import { Reveal } from "@/components/Reveal";
import { staggerContainer, fadeInUp } from "@/lib/motion";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
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

function actionIcon(actionType: string) {
  if (actionType.includes("issue")) return <BookMarked className="h-4 w-4 text-[var(--brand-primary)]" />;
  if (actionType.includes("return")) return <CheckCircle className="h-4 w-4 text-[var(--brand-success)]" />;
  if (actionType.includes("fine")) return <DollarSign className="h-4 w-4 text-[var(--brand-accent)]" />;
  if (actionType.includes("user")) return <Users className="h-4 w-4 text-[var(--brand-muted)]" />;
  return <Activity className="h-4 w-4 text-[var(--brand-muted)]" />;
}

function actionBadgeClass(actionType: string) {
  if (actionType.includes("issue")) return "bg-blue-50 text-blue-700 border-blue-200";
  if (actionType.includes("return")) return "bg-green-50 text-green-700 border-green-200";
  if (actionType.includes("fine")) return "bg-amber-50 text-amber-700 border-amber-200";
  if (actionType.includes("overdue")) return "bg-red-50 text-red-700 border-red-200";
  return "bg-gray-50 text-gray-600 border-gray-200";
}

// ─── Stat Card ──────────────────────────────────────────────────────────────────

interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  sub?: string;
  accent?: boolean;
  danger?: boolean;
  gold?: boolean;
}

function StatCard({ label, value, icon, sub, accent, danger, gold }: StatCardProps) {
  return (
    <motion.div
      whileHover={{ y: -3, boxShadow: "0 8px 32px -8px rgba(30,58,95,0.18)" }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className={cn(
        "relative overflow-hidden rounded-2xl border p-5 flex flex-col gap-3",
        "shadow-[0_1px_2px_rgba(0,0,0,0.04),0_4px_16px_-4px_rgba(0,0,0,0.08)]",
        accent
          ? "bg-[var(--brand-primary)] border-[var(--brand-primary)] text-white"
          : danger
          ? "bg-red-50 border-red-200"
          : gold
          ? "bg-[var(--brand-cream)] border-[var(--brand-accent)]/30"
          : "bg-white border-[var(--brand-border)]"
      )}
    >
      <div className="flex items-start justify-between">
        <div
          className={cn(
            "flex h-10 w-10 items-center justify-center rounded-xl",
            accent
              ? "bg-white/15"
              : danger
              ? "bg-red-100"
              : gold
              ? "bg-[var(--brand-accent)]/15"
              : "bg-[var(--brand-primary)]/8"
          )}
        >
          {icon}
        </div>
        <ArrowUpRight
          className={cn(
            "h-4 w-4 opacity-40",
            accent ? "text-white" : "text-[var(--brand-primary)]"
          )}
        />
      </div>
      <div>
        <div
          className={cn(
            "text-2xl font-bold tracking-tight",
            accent ? "text-white" : danger ? "text-red-700" : gold ? "text-[var(--brand-primary)]" : "text-[var(--brand-primary)]"
          )}
        >
          {value}
        </div>
        <div
          className={cn(
            "mt-0.5 text-sm font-medium",
            accent ? "text-white/80" : danger ? "text-red-600" : "text-[var(--brand-muted)]"
          )}
        >
          {label}
        </div>
        {sub && (
          <div
            className={cn(
              "mt-1 text-xs",
              accent ? "text-white/60" : "text-[var(--brand-muted)]/70"
            )}
          >
            {sub}
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ─── Page ───────────────────────────────────────────────────────────────────────

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
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    try {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const todayISO = todayStart.toISOString();

      const [
        booksRes,
        usersRes,
        issuesRes,
        finesRes,
        activityRes,
        categoryRes,
      ] = await Promise.all([
        supabase.from("books").select("id, category, available_copies, total_copies"),
        supabase.from("users").select("id, is_active"),
        supabase.from("book_issues").select("id, status, issue_date, return_date, due_date"),
        supabase.from("fines").select("id, status, total_amount"),
        supabase
          .from("activity_logs")
          .select("id, action_type, entity_type, description, created_at")
          .order("created_at", { ascending: false })
          .limit(12),
        supabase.from("books").select("category"),
      ]);

      const books = booksRes.data ?? [];
      const users = usersRes.data ?? [];
      const issues = issuesRes.data ?? [];
      const fines = finesRes.data ?? [];
      const activity = activityRes.data ?? [];
      const catBooks = categoryRes.data ?? [];

      const activeIssues = issues.filter((i) => i.status === "issued").length;
      const overdueIssues = issues.filter((i) => i.status === "overdue").length;
      const pendingFines = fines.filter((f) => f.status === "pending").length;
      const totalFineAmount = fines
        .filter((f) => f.status === "pending")
        .reduce((sum, f) => sum + Number(f.total_amount), 0);

      const issuedToday = issues.filter(
        (i) => i.issue_date && i.issue_date >= todayISO
      ).length;
      const returnedToday = issues.filter(
        (i) => i.return_date && i.return_date >= todayISO
      ).length;

      // Category breakdown
      const catMap: Record<string, number> = {};
      for (const b of catBooks) {
        const cat = b.category ?? "Uncategorized";
        catMap[cat] = (catMap[cat] ?? 0) + 1;
      }
      const catArr: CategoryStat[] = Object.entries(catMap)
        .map(([category, count]) => ({ category, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 6);

      setStats({
        totalBooks: books.length,
        totalUsers: users.filter((u) => u.is_active).length,
        activeIssues,
        overdueIssues,
        pendingFines,
        totalFineAmount,
        issuedToday,
        returnedToday,
      });
      setRecentActivity(activity);
      setCategoryStats(catArr);
      setLastRefreshed(new Date());
    } catch (err) {
      console.error("Dashboard fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchDashboardData();

    // Realtime subscriptions
    const issueChannel = supabase
      .channel("admin-dash-issues")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "book_issues" },
        () => fetchDashboardData()
      )
      .subscribe();

    const logChannel = supabase
      .channel("admin-dash-logs")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "activity_logs" },
        () => fetchDashboardData()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(issueChannel);
      supabase.removeChannel(logChannel);
    };
  }, [fetchDashboardData, supabase]);

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <main className="min-h-screen bg-[var(--brand-cream)] px-4 py-10 md:px-8 lg:px-12">
      {/* ── Header ── */}
      <Reveal>
        <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-[var(--brand-primary)]">
              Admin Dashboard
            </h1>
            <p className="mt-1 text-sm text-[var(--brand-muted)]">
              NCBA&amp;E Library — real-time overview of library operations
            </p>
          </div>
          <div className="flex items-center gap-3">
            {mounted && lastRefreshed && (
              <span className="text-xs text-[var(--brand-muted)]">
                Updated {timeAgo(lastRefreshed.toISOString())}
              </span>
            )}
            <button
              onClick={fetchDashboardData}
              disabled={loading}
              className={cn(
                "flex items-center gap-2 rounded-xl border border-[var(--brand-border)] bg-white px-4 py-2 text-sm font-medium text-[var(--brand-primary)]",
                "hover:bg-[var(--brand-primary)] hover:text-white transition-all duration-200",
                loading && "opacity-60 cursor-not-allowed"
              )}
            >
              <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
              Refresh
            </button>
          </div>
        </div>
      </Reveal>

      {/* ── Stat Cards ── */}
      <Reveal>
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-2 gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8"
        >
          {[
            {
              label: "Total Books",
              value: loading ? "—" : stats.totalBooks.toLocaleString(),
              icon: <BookOpen className="h-5 w-5 text-white" />,
              sub: "In catalog",
              accent: true,
            },
            {
              label: "Active Members",
              value: loading ? "—" : stats.totalUsers.toLocaleString(),
              icon: <Users className="h-5 w-5 text-[var(--brand-primary)]" />,
              sub: "Registered & active",
            },
            {
              label: "Books Issued",
              value: loading ? "—" : stats.activeIssues.toLocaleString(),
              icon: <BookMarked className="h-5 w-5 text-[var(--brand-primary)]" />,
              sub: "Currently on loan",
            },
            {
              label: "Overdue",
              value: loading ? "—" : stats.overdueIssues.toLocaleString(),
              icon: <AlertCircle className="h-5 w-5 text-red-600" />,
              sub: "Past due date",
              danger: true,
            },
          ].map((card) => (
            <motion.div key={card.label} variants={fadeInUp}>
              <StatCard {...card} />
            </motion.div>
          ))}
        </motion.div>
      </Reveal>

      {/* ── Secondary Stats ── */}
      <Reveal>
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-2 gap-4 sm:grid-cols-4 mb-10"
        >
          {[
            {
              label: "Pending Fines",
              value: loading ? "—" : stats.pendingFines.toString(),
              icon: <XCircle className="h-5 w-5 text-amber-600" />,
              sub: `${formatCurrency(stats.totalFineAmount)} outstanding`,
              gold: true,
            },
            {
              label: "Fine Rate",
              value: `PKR ${FINE_RATE_PER_DAY}/day`,
              icon: <DollarSign className="h-5 w-5 text-[var(--brand-primary)]" />,
              sub: "Per overdue day",
            },
            {
              label: "Issued Today",
              value: loading ? "—" : stats.issuedToday.toString(),
              icon: <TrendingUp className="h-5 w-5 text-[var(--brand-primary)]" />,
              sub: "New issues today",
            },
            {
              label: "Returned Today",
              value: loading ? "—" : stats.returnedToday.toString(),
              icon: <CheckCircle className="h-5 w-5 text-green-600" />,
              sub: "Returns today",
            },
          ].map((card) => (
            <motion.div key={card.label} variants={fadeInUp}>
              <StatCard {...card} />
            </motion.div>
          ))}
        </motion.div>
      </Reveal>

      {/* ── Charts Row ── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5 mb-8">
        {/* Monthly Issue/Return Bar Chart */}
        <Reveal className="lg:col-span-3">
          <div className="rounded-2xl border border-[var(--brand-border)] bg-white p-6 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_4px_16px_-4px_rgba(0,0,0,0.08)]">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold text-[var(--brand-primary)]">
                  Monthly Issue &amp; Return Trend
                </h2>
                <p className="text-xs text-[var(--brand-muted)] mt-0.5">
                  Last 6 months activity
                </p>
              </div>
              <Activity className="h-5 w-5 text-[var(--brand-muted)]" />
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={MONTHLY_MOCK} barCategoryGap="30%">
                <CartesianGrid strokeDasharray="3 3" stroke="#f0ece4" />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 12, fill: "#8a8070" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: "#8a8070" }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: "12px",
                    border: "1px solid #e8e0d4",
                    fontSize: "13px",
                    boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
                  }}
                />
                <Bar dataKey="issued" name="Issued" fill="#1e3a5f" radius={[4, 4, 0, 0]} />
                <Bar dataKey="returned" name="Returned" fill="#c8a96e" radius={[4, 4, 0, 0]} />
                <Legend
                  wrapperStyle={{ fontSize: "12px", paddingTop: "12px" }}
                  iconType="circle"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Reveal>

        {/* Category Pie Chart */}
        <Reveal className="lg:col-span-2">
          <div className="rounded-2xl border border-[var(--brand-border)] bg-white p-6 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_4px_16px_-4px_rgba(0,0,0,0.08)] h-full">
            <div className="mb-4">
              <h2 className="text-base font-semibold text-[var(--brand-primary)]">
                Books by Category
              </h2>
              <p className="text-xs text-[var(--brand-muted)] mt-0.5">
                Catalog distribution
              </p>
            </div>
            {loading ? (
              <div className="flex h-48 items-center justify-center text-sm text-[var(--brand-muted)]">
                Loading...
              </div>
            ) : categoryStats.length === 0 ? (
              <div className="flex h-48 items-center justify-center text-sm text-[var(--brand-muted)]">
                No data yet
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={categoryStats}
                    dataKey="count"
                    nameKey="category"
                    cx="50%"
                    cy="50%"
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
                  <Tooltip
                    contentStyle={{
                      borderRadius: "12px",
                      border: "1px solid #e8e0d4",
                      fontSize: "13px",
                    }}
                  />
                  <Legend
                    wrapperStyle={{ fontSize: "11px" }}
                    iconType="circle"
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </Reveal>
      </div>

      {/* ── Recent Activity ── */}
      <Reveal>
        <div className="rounded-2xl border border-[var(--brand-border)] bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04),0_4px_16px_-4px_rgba(0,0,0,0.08)]">
          <div className="flex items-center justify-between border-b border-[var(--brand-border)] px-6 py-4">
            <div>
              <h2 className="text-base font-semibold text-[var(--brand-primary)]">
                Recent Activity
              </h2>
              <p className="text-xs text-[var(--brand-muted)] mt-0.5">
                Latest library events — live updates enabled
              </p>
            </div>
            <span className="flex items-center gap-1.5 rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-700 border border-green-200">
              <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
              Live
            </span>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16 text-sm text-[var(--brand-muted)]">
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              Loading activity...
            </div>
          ) : recentActivity.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-[var(--brand-muted)]">
              <Activity className="h-10 w-10 mb-3 opacity-30" />
              <p className="text-sm">No activity recorded yet.</p>
            </div>
          ) : (
            <ul className="divide-y divide-[var(--brand-border)]">
              {recentActivity.map((log, i) => (
                <motion.li
                  key={log.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04, duration: 0.3, ease: "easeOut" }}
                  className="flex items-start gap-4 px-6 py-4 hover:bg-[var(--brand-cream)]/60 transition-colors duration-150"
                >
                  <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[var(--brand-cream)] border border-[var(--brand-border)]">
                    {actionIcon(log.action_type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={cn(
                          "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium capitalize",
                          actionBadgeClass(log.action_type)
                        )}
                      >
                        {log.action_type.replace(/_/g, " ")}
                      </span>
                      <span className="text-xs text-[var(--brand-muted)] capitalize">
                        {log.entity_type}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-[var(--brand-primary)] truncate">
                      {log.description ?? "No description provided."}
                    </p>
                  </div>
                  <div className="shrink-0 flex items-center gap-1 text-xs text-[var(--brand-muted)]">
                    <Clock className="h-3 w-3" />
                    {mounted ? timeAgo(log.created_at) : "—"}
                  </div>
                </motion.li>
              ))}
            </ul>
          )}
        </div>
      </Reveal>

      {/* ── Quick Actions ── */}
      <Reveal>
        <div className="mt-8 rounded-2xl border border-[var(--brand-border)] bg-[var(--brand-primary)] p-6 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_32px_-8px_rgba(30,58,95,0.25)]">
          <h2 className="text-base font-semibold text-white mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: "Add Book", href: "/admin/books", icon: <BookOpen className="h-5 w-5" /> },
              { label: "Add Member", href: "/admin/users", icon: <Users className="h-5 w-5" /> },
              { label: "Issue Book", href: "/transactions/issue-return", icon: <BookMarked className="h-5 w-5" /> },
              { label: "Manage Fines", href: "/fines", icon: <DollarSign className="h-5 w-5" /> },
            ].map((action) => (
              <motion.a
                key={action.label}
                href={action.href}
                whileHover={{ scale: 1.03, backgroundColor: "rgba(255,255,255,0.18)" }}
                whileTap={{ scale: 0.97 }}
                transition={{ duration: 0.18, ease: "easeOut" }}
                className="flex items-center gap-3 rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm font-medium text-white backdrop-blur-sm transition-colors duration-200"
              >
                {action.icon}
                {action.label}
              </motion.a>
            ))}
          </div>
        </div>
      </Reveal>
    </main>
  );
}