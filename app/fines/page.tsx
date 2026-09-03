"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertCircle, CheckCircle, Clock, Search, DollarSign, TrendingUp, BookOpen, X, ChevronDown, Calendar, RefreshCw, Banknote, ShieldCheck } from 'lucide-react';
import { Reveal } from "@/components/Reveal";
import { staggerContainer, fadeInUp } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { FINE_RATE_PER_DAY } from "@/lib/data";

// ─── Types ──────────────────────────────────────────────────────────────────────

interface FineRow {
  id: string;
  issue_id: string;
  user_id: string;
  overdue_days: number;
  fine_per_day: number;
  total_amount: number;
  status: string;
  paid_at: string | null;
  waived_by: string | null;
  waive_reason: string | null;
  created_at: string;
  updated_at: string;
}

interface FineWithDetails extends FineRow {
  book_title?: string;
  book_author?: string;
  issue_date?: string;
  due_date?: string;
  return_date?: string | null;
}

type StatusFilter = "all" | "pending" | "paid" | "waived";

// ─── Helpers ────────────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatCurrency(amount: number): string {
  return `PKR ${amount.toLocaleString("en-PK")}`;
}

function isOverdue(dueDateStr?: string, returnDate?: string | null): boolean {
  if (!dueDateStr || returnDate) return false;
  return new Date(dueDateStr) < new Date();
}

function overdueDaysFromDue(dueDateStr?: string): number {
  if (!dueDateStr) return 0;
  const diff = Date.now() - new Date(dueDateStr).getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

function getFineStatusLabel(status: string): string {
  switch (status) {
    case "pending": return "Pending";
    case "paid": return "Paid";
    case "waived": return "Waived";
    default: return status;
  }
}

// ─── Stat Card ──────────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  variant = "default",
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ElementType;
  variant?: "default" | "navy" | "gold" | "danger" | "success";
}) {
  const styles = {
    default: {
      wrapper: "bg-white border-[#d6cfc2] text-[#1a2a3a]",
      iconBg: "bg-[#f5f0e8]",
      iconColor: "text-[#1e3a5f]",
      label: "text-[#5a6a7a]",
      value: "text-[#1a2a3a]",
      sub: "text-[#5a6a7a]",
    },
    navy: {
      wrapper: "bg-[#1e3a5f] border-[#1e3a5f] text-white",
      iconBg: "bg-white/15",
      iconColor: "text-[#c8a96e]",
      label: "text-white/70",
      value: "text-white",
      sub: "text-white/60",
    },
    gold: {
      wrapper: "bg-[#fdf8f0] border-[#c8a96e]/30 text-[#1a2a3a]",
      iconBg: "bg-[#c8a96e]/15",
      iconColor: "text-[#c8a96e]",
      label: "text-[#5a6a7a]",
      value: "text-[#1a2a3a]",
      sub: "text-[#5a6a7a]",
    },
    danger: {
      wrapper: "bg-red-50 border-red-200 text-[#1a2a3a]",
      iconBg: "bg-red-100",
      iconColor: "text-[#e74c3c]",
      label: "text-red-600",
      value: "text-[#e74c3c]",
      sub: "text-red-500",
    },
    success: {
      wrapper: "bg-emerald-50 border-emerald-200 text-[#1a2a3a]",
      iconBg: "bg-emerald-100",
      iconColor: "text-emerald-600",
      label: "text-emerald-700",
      value: "text-emerald-700",
      sub: "text-emerald-600",
    },
  };

  const s = styles[variant];

  return (
    <motion.div
      whileHover={{ y: -3, boxShadow: "0 12px 40px -8px rgba(30,58,95,0.18)" }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className={cn(
        "rounded-2xl border p-5 flex flex-col gap-3 transition-all duration-200",
        "shadow-[0_1px_2px_rgba(0,0,0,0.04),0_4px_16px_-4px_rgba(0,0,0,0.08)]",
        s.wrapper
      )}
    >
      <div className="flex items-center justify-between">
        <span className={cn("text-sm font-medium", s.label)}>{label}</span>
        <span className={cn("flex h-9 w-9 items-center justify-center rounded-xl", s.iconBg)}>
          <Icon className={cn("h-4 w-4", s.iconColor)} />
        </span>
      </div>
      <div>
        <div className={cn("text-2xl font-bold tracking-tight", s.value)}>{value}</div>
        {sub && <div className={cn("mt-0.5 text-xs", s.sub)}>{sub}</div>}
      </div>
    </motion.div>
  );
}

// ─── Status Badge ───────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { cls: string; icon: React.ReactNode }> = {
    pending: {
      cls: "bg-amber-50 text-amber-700 border-amber-200",
      icon: <Clock className="h-3 w-3" />,
    },
    paid: {
      cls: "bg-emerald-50 text-emerald-700 border-emerald-200",
      icon: <CheckCircle className="h-3 w-3" />,
    },
    waived: {
      cls: "bg-blue-50 text-blue-700 border-blue-200",
      icon: <ShieldCheck className="h-3 w-3" />,
    },
  };
  const config = map[status] ?? { cls: "bg-gray-50 text-gray-600 border-gray-200", icon: null };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold",
        config.cls
      )}
    >
      {config.icon}
      {getFineStatusLabel(status)}
    </span>
  );
}

// ─── Fine Detail Modal ──────────────────────────────────────────────────────────

function FineDetailModal({
  fine,
  onClose,
}: {
  fine: FineWithDetails;
  onClose: () => void;
}) {
  const overdue = isOverdue(fine.due_date, fine.return_date);
  const daysOver = fine.overdue_days || overdueDaysFromDue(fine.due_date);

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <div
          className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          onClick={onClose}
        />
        <motion.div
          className="relative z-10 w-full max-w-md rounded-2xl bg-white shadow-[0_8px_40px_-8px_rgba(30,58,95,0.28)] border border-[#d6cfc2] overflow-hidden"
          initial={{ opacity: 0, scale: 0.95, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 16 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
        >
          {/* Modal header */}
          <div className="bg-[#1e3a5f] px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#c8a96e]/20 flex items-center justify-center">
                <DollarSign className="h-4 w-4 text-[#c8a96e]" />
              </div>
              <div>
                <h3 className="text-white font-semibold text-sm">Fine Details</h3>
                <p className="text-white/60 text-xs">ID: {fine.id.slice(0, 8)}...</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
            >
              <X className="h-4 w-4 text-white" />
            </button>
          </div>

          {/* Modal body */}
          <div className="p-6 space-y-4">
            {fine.book_title && (
              <div className="rounded-xl bg-[#f5f0e8] border border-[#d6cfc2] p-4">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-[#1e3a5f]/10 flex items-center justify-center flex-shrink-0">
                    <BookOpen className="h-4 w-4 text-[#1e3a5f]" />
                  </div>
                  <div>
                    <p className="font-semibold text-[#1a2a3a] text-sm">{fine.book_title}</p>
                    {fine.book_author && (
                      <p className="text-[#5a6a7a] text-xs mt-0.5">{fine.book_author}</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-[#f5f0e8] border border-[#d6cfc2] p-3">
                <p className="text-xs text-[#5a6a7a] mb-1">Issue Date</p>
                <p className="text-sm font-medium text-[#1a2a3a]">
                  {fine.issue_date ? formatDate(fine.issue_date) : "N/A"}
                </p>
              </div>
              <div className={cn(
                "rounded-xl border p-3",
                overdue ? "bg-red-50 border-red-200" : "bg-[#f5f0e8] border-[#d6cfc2]"
              )}>
                <p className={cn("text-xs mb-1", overdue ? "text-red-600" : "text-[#5a6a7a]")}>Due Date</p>
                <p className={cn("text-sm font-medium", overdue ? "text-red-700" : "text-[#1a2a3a]")}
                >
                  {fine.due_date ? formatDate(fine.due_date) : "N/A"}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-xl bg-[#f5f0e8] border border-[#d6cfc2] p-3 text-center">
                <p className="text-xs text-[#5a6a7a] mb-1">Overdue Days</p>
                <p className={cn("text-lg font-bold", daysOver > 0 ? "text-[#e74c3c]" : "text-[#1a2a3a]")}>
                  {daysOver}
                </p>
              </div>
              <div className="rounded-xl bg-[#f5f0e8] border border-[#d6cfc2] p-3 text-center">
                <p className="text-xs text-[#5a6a7a] mb-1">Rate/Day</p>
                <p className="text-lg font-bold text-[#c8a96e]">PKR {fine.fine_per_day}</p>
              </div>
              <div className="rounded-xl bg-[#1e3a5f] border border-[#1e3a5f] p-3 text-center">
                <p className="text-xs text-white/70 mb-1">Total Fine</p>
                <p className="text-lg font-bold text-[#c8a96e]">{formatCurrency(fine.total_amount)}</p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <StatusBadge status={fine.status} />
              {fine.paid_at && (
                <span className="text-xs text-[#5a6a7a]">
                  Paid on {formatDate(fine.paid_at)}
                </span>
              )}
              {fine.waive_reason && (
                <span className="text-xs text-blue-600 max-w-[180px] truncate" title={fine.waive_reason}>
                  Waived: {fine.waive_reason}
                </span>
              )}
            </div>
          </div>

          <div className="px-6 pb-5">
            <button
              onClick={onClose}
              className="w-full rounded-xl bg-[#f5f0e8] border border-[#d6cfc2] py-2.5 text-sm font-medium text-[#1a2a3a] hover:bg-[#ede8df] transition-colors"
            >
              Close
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// ─── Main Page ──────────────────────────────────────────────────────────────────

export default function FinesPage() {
  const supabase = createClient();

  const [fines, setFines] = useState<FineWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [selectedFine, setSelectedFine] = useState<FineWithDetails | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  // ─── Fetch current user ────────────────────────────────────────────────────
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUserId(data.user?.id ?? null);
    });
  }, []);

  // ─── Fetch fines ───────────────────────────────────────────────────────────
  const fetchFines = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    setError(null);
    try {
      const { data: fineRows, error: fineErr } = await supabase
        .from("fines")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (fineErr) throw fineErr;
      if (!fineRows || fineRows.length === 0) {
        setFines([]);
        return;
      }

      // Enrich with book/issue data
      const enriched: FineWithDetails[] = await Promise.all(
        fineRows.map(async (fine) => {
          const { data: issueRow } = await supabase
            .from("book_issues")
            .select("book_id, issue_date, due_date, return_date")
            .eq("id", fine.issue_id)
            .single();

          let book_title: string | undefined;
          let book_author: string | undefined;

          if (issueRow?.book_id) {
            const { data: bookRow } = await supabase
              .from("books")
              .select("title, author")
              .eq("id", issueRow.book_id)
              .single();
            book_title = bookRow?.title;
            book_author = bookRow?.author;
          }

          return {
            ...fine,
            book_title,
            book_author,
            issue_date: issueRow?.issue_date,
            due_date: issueRow?.due_date,
            return_date: issueRow?.return_date,
          };
        })
      );

      setFines(enriched);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load fines.");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchFines();
  }, [fetchFines]);

  // ─── Derived stats ─────────────────────────────────────────────────────────
  const totalPending = fines
    .filter((f) => f.status === "pending")
    .reduce((sum, f) => sum + f.total_amount, 0);
  const totalPaid = fines
    .filter((f) => f.status === "paid")
    .reduce((sum, f) => sum + f.total_amount, 0);
  const totalWaived = fines
    .filter((f) => f.status === "waived")
    .reduce((sum, f) => sum + f.total_amount, 0);
  const pendingCount = fines.filter((f) => f.status === "pending").length;

  // ─── Filtered list ─────────────────────────────────────────────────────────
  const filtered = fines.filter((f) => {
    const matchStatus = statusFilter === "all" || f.status === statusFilter;
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      f.book_title?.toLowerCase().includes(q) ||
      f.book_author?.toLowerCase().includes(q) ||
      f.status.toLowerCase().includes(q);
    return matchStatus && matchSearch;
  });

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#f5f0e8]">
      {/* ── Page Header ── */}
      <div className="bg-gradient-to-br from-[#1e3a5f] via-[#1a3356] to-[#162d4a] relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 right-0 w-96 h-96 bg-[#c8a96e]/10 rounded-full blur-3xl translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/5 rounded-full blur-2xl -translate-x-1/2 translate-y-1/2" />
          <div className="absolute inset-0" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.04) 1px, transparent 0)", backgroundSize: "32px 32px" }} />
        </div>

        <div className="container-lms relative py-10 md:py-14">
          <Reveal>
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full bg-[#c8a96e]/20 border border-[#c8a96e]/30 px-3 py-1 mb-4">
                  <DollarSign className="h-3.5 w-3.5 text-[#c8a96e]" />
                  <span className="text-[#c8a96e] text-xs font-semibold tracking-wide uppercase">Fine Records</span>
                </div>
                <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight text-balance">
                  My Fines
                </h1>
                <p className="text-white/60 mt-2 text-sm max-w-md">
                  Track your overdue fines, payment history, and waived charges in one place.
                </p>
              </div>

              {/* Pending amount summary */}
              {pendingCount > 0 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2, duration: 0.35 }}
                  className="flex-shrink-0 rounded-2xl bg-[#e74c3c]/15 border border-[#e74c3c]/30 px-6 py-4 flex items-center gap-4"
                >
                  <div className="w-10 h-10 rounded-xl bg-[#e74c3c]/20 flex items-center justify-center">
                    <AlertCircle className="h-5 w-5 text-[#e74c3c]" />
                  </div>
                  <div>
                    <p className="text-white/60 text-xs font-medium uppercase tracking-wide">Total Pending</p>
                    <p className="text-white text-2xl font-bold tracking-tight">{formatCurrency(totalPending)}</p>
                    <p className="text-[#e74c3c] text-xs mt-0.5">{pendingCount} fine{pendingCount !== 1 ? "s" : ""} outstanding</p>
                  </div>
                </motion.div>
              )}

              {pendingCount === 0 && fines.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2, duration: 0.35 }}
                  className="flex-shrink-0 rounded-2xl bg-emerald-500/15 border border-emerald-400/30 px-6 py-4 flex items-center gap-4"
                >
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                    <CheckCircle className="h-5 w-5 text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-white/60 text-xs font-medium uppercase tracking-wide">All Clear</p>
                    <p className="text-white text-xl font-bold tracking-tight">No Pending Fines</p>
                    <p className="text-emerald-400 text-xs mt-0.5">Great job staying on time!</p>
                  </div>
                </motion.div>
              )}
            </div>
          </Reveal>
        </div>
      </div>

      <div className="container-lms py-8 space-y-8">
        {/* ── Stat Cards ── */}
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-2 md:grid-cols-4 gap-4"
        >
          <motion.div variants={fadeInUp}>
            <StatCard
              label="Total Fines"
              value={fines.length}
              sub="All time"
              icon={FileTextIcon}
              variant="default"
            />
          </motion.div>
          <motion.div variants={fadeInUp}>
            <StatCard
              label="Pending Amount"
              value={formatCurrency(totalPending)}
              sub={`${pendingCount} outstanding`}
              icon={AlertCircle}
              variant={totalPending > 0 ? "danger" : "default"}
            />
          </motion.div>
          <motion.div variants={fadeInUp}>
            <StatCard
              label="Total Paid"
              value={formatCurrency(totalPaid)}
              sub="Cleared fines"
              icon={CheckCircle}
              variant="success"
            />
          </motion.div>
          <motion.div variants={fadeInUp}>
            <StatCard
              label="Waived"
              value={formatCurrency(totalWaived)}
              sub={`PKR ${FINE_RATE_PER_DAY}/day rate`}
              icon={ShieldCheck}
              variant="gold"
            />
          </motion.div>
        </motion.div>

        {/* ── Filters & Search ── */}
        <Reveal>
          <div className="rounded-2xl bg-white border border-[#d6cfc2] shadow-[0_1px_2px_rgba(0,0,0,0.04),0_4px_16px_-4px_rgba(0,0,0,0.08)] p-4">
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Search */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#5a6a7a]" />
                <input
                  type="text"
                  placeholder="Search by book title or author..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-[#d6cfc2] bg-[#f5f0e8] text-[#1a2a3a] text-sm placeholder:text-[#5a6a7a] focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/20 focus:border-[#1e3a5f] transition-colors"
                />
              </div>

              {/* Status filter */}
              <div className="flex gap-2 flex-wrap">
                {(["all", "pending", "paid", "waived"] as StatusFilter[]).map((s) => (
                  <button
                    key={s}
                    onClick={() => setStatusFilter(s)}
                    className={cn(
                      "px-4 py-2.5 rounded-xl text-sm font-medium border transition-all duration-200",
                      statusFilter === s
                        ? "bg-[#1e3a5f] text-white border-[#1e3a5f] shadow-sm"
                        : "bg-[#f5f0e8] text-[#5a6a7a] border-[#d6cfc2] hover:border-[#1e3a5f]/30 hover:text-[#1a2a3a]"
                    )}
                  >
                    {s === "all" ? "All" : getFineStatusLabel(s)}
                  </button>
                ))}
              </div>

              {/* Refresh */}
              <button
                onClick={fetchFines}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[#d6cfc2] bg-[#f5f0e8] text-[#5a6a7a] text-sm font-medium hover:bg-[#ede8df] hover:text-[#1a2a3a] transition-colors disabled:opacity-50"
              >
                <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
                Refresh
              </button>
            </div>
          </div>
        </Reveal>

        {/* ── Fines List ── */}
        <Reveal>
          <div className="rounded-2xl bg-white border border-[#d6cfc2] shadow-[0_1px_2px_rgba(0,0,0,0.04),0_4px_16px_-4px_rgba(0,0,0,0.08)] overflow-hidden">
            {/* Table header */}
            <div className="px-6 py-4 border-b border-[#d6cfc2] bg-[#f5f0e8] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-[#1e3a5f]/10 flex items-center justify-center">
                  <Banknote className="h-3.5 w-3.5 text-[#1e3a5f]" />
                </div>
                <h2 className="font-semibold text-[#1a2a3a] text-sm">
                  Fine Records
                  {filtered.length > 0 && (
                    <span className="ml-2 text-xs font-normal text-[#5a6a7a]">
                      ({filtered.length} {filtered.length === 1 ? "record" : "records"})
                    </span>
                  )}
                </h2>
              </div>
            </div>

            {/* Loading */}
            {loading && (
              <div className="flex flex-col items-center justify-center py-20 gap-3">
                <div className="w-10 h-10 rounded-full border-2 border-[#1e3a5f]/20 border-t-[#1e3a5f] animate-spin" />
                <p className="text-[#5a6a7a] text-sm">Loading your fines...</p>
              </div>
            )}

            {/* Error */}
            {!loading && error && (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <div className="w-12 h-12 rounded-2xl bg-red-50 border border-red-200 flex items-center justify-center">
                  <AlertCircle className="h-6 w-6 text-[#e74c3c]" />
                </div>
                <p className="text-[#e74c3c] font-medium text-sm">{error}</p>
                <button
                  onClick={fetchFines}
                  className="text-xs text-[#1e3a5f] underline underline-offset-2 hover:text-[#162d4a]"
                >
                  Try again
                </button>
              </div>
            )}

            {/* Empty */}
            {!loading && !error && filtered.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20 gap-3">
                <div className="w-14 h-14 rounded-2xl bg-[#f5f0e8] border border-[#d6cfc2] flex items-center justify-center">
                  <CheckCircle className="h-7 w-7 text-emerald-500" />
                </div>
                <p className="font-semibold text-[#1a2a3a] text-sm">
                  {fines.length === 0 ? "No fines on record" : "No fines match your filters"}
                </p>
                <p className="text-[#5a6a7a] text-xs text-center max-w-xs">
                  {fines.length === 0
                    ? "You have a clean record. Keep returning books on time!"
                    : "Try adjusting your search or filter criteria."}
                </p>
              </div>
            )}

            {/* Desktop table */}
            {!loading && !error && filtered.length > 0 && (
              <>
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-[#d6cfc2]">
                        {["Book", "Overdue Days", "Fine Amount", "Due Date", "Status", ""].map((h) => (
                          <th
                            key={h}
                            className="px-6 py-3 text-left text-xs font-semibold text-[#5a6a7a] uppercase tracking-wide"
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#d6cfc2]/60">
                      <AnimatePresence>
                        {filtered.map((fine) => {
                          const overdue = isOverdue(fine.due_date, fine.return_date);
                          return (
                            <motion.tr
                              key={fine.id}
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                              className="hover:bg-[#faf8f4] transition-colors group"
                            >
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-lg bg-[#1e3a5f]/8 flex items-center justify-center flex-shrink-0">
                                    <BookOpen className="h-3.5 w-3.5 text-[#1e3a5f]" />
                                  </div>
                                  <div>
                                    <p className="font-medium text-[#1a2a3a] text-sm leading-tight">
                                      {fine.book_title ?? "Unknown Book"}
                                    </p>
                                    {fine.book_author && (
                                      <p className="text-[#5a6a7a] text-xs mt-0.5">{fine.book_author}</p>
                                    )}
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <span
                                  className={cn(
                                    "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold",
                                    fine.overdue_days > 0
                                      ? "bg-red-50 text-[#e74c3c] border border-red-200"
                                      : "bg-[#f5f0e8] text-[#5a6a7a] border border-[#d6cfc2]"
                                  )}
                                >
                                  {fine.overdue_days > 0 && <AlertCircle className="h-3 w-3" />}
                                  {fine.overdue_days} day{fine.overdue_days !== 1 ? "s" : ""}
                                </span>
                              </td>
                              <td className="px-6 py-4">
                                <span className="font-bold text-[#1e3a5f] text-sm">
                                  {formatCurrency(fine.total_amount)}
                                </span>
                                <p className="text-[#5a6a7a] text-xs mt-0.5">
                                  PKR {fine.fine_per_day}/day
                                </p>
                              </td>
                              <td className="px-6 py-4">
                                {fine.due_date ? (
                                  <div>
                                    <p
                                      className={cn(
                                        "text-sm font-medium",
                                        overdue ? "text-[#e74c3c]" : "text-[#1a2a3a]"
                                      )}
                                    >
                                      {formatDate(fine.due_date)}
                                    </p>
                                    {overdue && (
                                      <p className="text-xs text-[#e74c3c] mt-0.5 flex items-center gap-1">
                                        <AlertCircle className="h-3 w-3" />
                                        {overdueDaysFromDue(fine.due_date)}d overdue
                                      </p>
                                    )}
                                  </div>
                                ) : (
                                  <span className="text-[#5a6a7a] text-sm">N/A</span>
                                )}
                              </td>
                              <td className="px-6 py-4">
                                <StatusBadge status={fine.status} />
                              </td>
                              <td className="px-6 py-4">
                                <button
                                  onClick={() => setSelectedFine(fine)}
                                  className="opacity-0 group-hover:opacity-100 transition-opacity inline-flex items-center gap-1.5 rounded-lg bg-[#1e3a5f]/8 hover:bg-[#1e3a5f]/15 px-3 py-1.5 text-xs font-medium text-[#1e3a5f] transition-colors"
                                >
                                  View
                                </button>
                              </td>
                            </motion.tr>
                          );
                        })}
                      </AnimatePresence>
                    </tbody>
                  </table>
                </div>

                {/* Mobile cards */}
                <div className="md:hidden divide-y divide-[#d6cfc2]/60">
                  {filtered.map((fine) => {
                    const overdue = isOverdue(fine.due_date, fine.return_date);
                    return (
                      <motion.div
                        key={fine.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-4 hover:bg-[#faf8f4] transition-colors"
                      >
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-[#1e3a5f]/8 flex items-center justify-center flex-shrink-0">
                              <BookOpen className="h-3.5 w-3.5 text-[#1e3a5f]" />
                            </div>
                            <div>
                              <p className="font-semibold text-[#1a2a3a] text-sm leading-tight">
                                {fine.book_title ?? "Unknown Book"}
                              </p>
                              {fine.book_author && (
                                <p className="text-[#5a6a7a] text-xs">{fine.book_author}</p>
                              )}
                            </div>
                          </div>
                          <StatusBadge status={fine.status} />
                        </div>

                        <div className="grid grid-cols-3 gap-2 mb-3">
                          <div className="rounded-lg bg-[#f5f0e8] border border-[#d6cfc2] p-2 text-center">
                            <p className="text-[10px] text-[#5a6a7a] mb-0.5">Overdue</p>
                            <p className={cn("text-sm font-bold", fine.overdue_days > 0 ? "text-[#e74c3c]" : "text-[#1a2a3a]")}>
                              {fine.overdue_days}d
                            </p>
                          </div>
                          <div className="rounded-lg bg-[#f5f0e8] border border-[#d6cfc2] p-2 text-center">
                            <p className="text-[10px] text-[#5a6a7a] mb-0.5">Rate</p>
                            <p className="text-sm font-bold text-[#c8a96e]">PKR {fine.fine_per_day}</p>
                          </div>
                          <div className="rounded-lg bg-[#1e3a5f] border border-[#1e3a5f] p-2 text-center">
                            <p className="text-[10px] text-white/60 mb-0.5">Total</p>
                            <p className="text-sm font-bold text-[#c8a96e]">{formatCurrency(fine.total_amount)}</p>
                          </div>
                        </div>

                        {fine.due_date && (
                          <div className={cn(
                            "flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs",
                            overdue ? "bg-red-50 border border-red-200 text-[#e74c3c]" : "bg-[#f5f0e8] border border-[#d6cfc2] text-[#5a6a7a]"
                          )}>
                            <Calendar className="h-3 w-3 flex-shrink-0" />
                            <span>Due: {formatDate(fine.due_date)}</span>
                            {overdue && <span className="ml-auto font-semibold">{overdueDaysFromDue(fine.due_date)}d overdue</span>}
                          </div>
                        )}

                        <button
                          onClick={() => setSelectedFine(fine)}
                          className="mt-3 w-full rounded-xl border border-[#d6cfc2] bg-[#f5f0e8] py-2 text-xs font-medium text-[#1e3a5f] hover:bg-[#ede8df] transition-colors"
                        >
                          View Details
                        </button>
                      </motion.div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </Reveal>

        {/* ── Info Banner ── */}
        <Reveal>
          <div className="rounded-2xl bg-[#1e3a5f]/5 border border-[#1e3a5f]/15 p-5 flex items-start gap-4">
            <div className="w-9 h-9 rounded-xl bg-[#c8a96e]/15 flex items-center justify-center flex-shrink-0">
              <TrendingUp className="h-4 w-4 text-[#c8a96e]" />
            </div>
            <div>
              <p className="font-semibold text-[#1a2a3a] text-sm">Fine Rate Information</p>
              <p className="text-[#5a6a7a] text-xs mt-1 leading-relaxed">
                Overdue fines are calculated at <strong className="text-[#1a2a3a]">PKR {FINE_RATE_PER_DAY} per day</strong> after the due date.
                Contact the library desk to discuss payment or waiver options. Fines must be cleared before issuing new books.
              </p>
            </div>
          </div>
        </Reveal>
      </div>

      {/* ── Fine Detail Modal ── */}
      {selectedFine && (
        <FineDetailModal
          fine={selectedFine}
          onClose={() => setSelectedFine(null)}
        />
      )}
    </div>
  );
}

// ─── Inline icon (to avoid importing an extra icon) ─────────────────────────────
function FileTextIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </svg>
  );
}
