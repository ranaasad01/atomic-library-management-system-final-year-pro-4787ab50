"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertCircle, CheckCircle, Clock, Search, DollarSign, TrendingUp, Users, X, RefreshCw, Eye, ChevronDown, BookOpen, Calendar } from 'lucide-react';
import { Reveal } from "@/components/Reveal";
import { staggerContainer, fadeInUp } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { FINE_RATE_PER_DAY } from "@/lib/data";

// ─── Types ──────────────────────────────────────────────────────────────────────

interface Fine {
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

interface FineWithDetails extends Fine {
  user_name?: string;
  user_email?: string;
  membership_number?: string;
  book_title?: string;
  book_author?: string;
  issue_date?: string;
  due_date?: string;
  return_date?: string | null;
}

type StatusFilter = "all" | "pending" | "paid" | "waived";

// ─── Helpers ────────────────────────────────────────────────────────────────────

function formatCurrency(amount: number): string {
  return `PKR ${amount.toLocaleString("en-PK")}`;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function getFineStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    pending: "Pending",
    paid: "Paid",
    waived: "Waived",
  };
  return labels[status] ?? status;
}

// ─── Stat Card ──────────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  accent,
  danger,
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ElementType;
  accent?: boolean;
  danger?: boolean;
}) {
  return (
    <motion.div
      whileHover={{ y: -4, boxShadow: "0 12px 40px -8px rgba(30,58,95,0.22)" }}
      transition={{ duration: 0.22, ease: "easeOut" }}
      className={cn(
        "rounded-2xl border p-5 flex flex-col gap-3 transition-all duration-200",
        "shadow-[0_1px_2px_rgba(0,0,0,0.04),0_4px_16px_-4px_rgba(0,0,0,0.08)]",
        accent
          ? "bg-[#1e3a5f] border-[#1e3a5f] text-white"
          : danger
          ? "bg-red-50 border-red-200 text-[#1a2a3a]"
          : "bg-white border-[var(--border)] text-[#1a2a3a]"
      )}
    >
      <div className="flex items-center justify-between">
        <span
          className={cn(
            "text-sm font-medium",
            accent ? "text-white/70" : danger ? "text-red-600" : "text-[#5a6a7a]"
          )}
        >
          {label}
        </span>
        <span
          className={cn(
            "flex h-10 w-10 items-center justify-center rounded-xl",
            accent
              ? "bg-white/15"
              : danger
              ? "bg-red-100"
              : "bg-[#c8a96e]/15"
          )}
        >
          <Icon
            className={cn(
              "h-5 w-5",
              accent
                ? "text-[#c8a96e]"
                : danger
                ? "text-red-500"
                : "text-[#1e3a5f]"
            )}
          />
        </span>
      </div>
      <div>
        <div
          className={cn(
            "text-2xl font-bold tracking-tight",
            accent ? "text-white" : danger ? "text-red-700" : "text-[#1e3a5f]"
          )}
        >
          {value}
        </div>
        {sub && (
          <div
            className={cn(
              "mt-0.5 text-xs",
              accent ? "text-white/60" : "text-[#5a6a7a]"
            )}
          >
            {sub}
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ─── Status Badge ───────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    pending: "bg-amber-50 text-amber-700 border-amber-200",
    paid: "bg-emerald-50 text-emerald-700 border-emerald-200",
    waived: "bg-blue-50 text-blue-700 border-blue-200",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold",
        map[status] ?? "bg-gray-50 text-gray-600 border-gray-200"
      )}
    >
      {status === "pending" && <Clock className="h-3 w-3" />}
      {status === "paid" && <CheckCircle className="h-3 w-3" />}
      {status === "waived" && <X className="h-3 w-3" />}
      {getFineStatusLabel(status)}
    </span>
  );
}

// ─── Fine Detail Modal ──────────────────────────────────────────────────────────

function FineDetailModal({
  fine,
  onClose,
  onMarkPaid,
  onWaive,
  loading,
}: {
  fine: FineWithDetails;
  onClose: () => void;
  onMarkPaid: (id: string) => void;
  onWaive: (id: string, reason: string) => void;
  loading: boolean;
}) {
  const [waiveMode, setWaiveMode] = useState(false);
  const [waiveReason, setWaiveReason] = useState("");

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <div
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        />
        <motion.div
          className="relative z-10 w-full max-w-lg rounded-2xl bg-white border border-[var(--border)] shadow-[0_8px_40px_-8px_rgba(30,58,95,0.28)] overflow-hidden"
          initial={{ opacity: 0, scale: 0.95, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 16 }}
          transition={{ duration: 0.28, ease: "easeOut" }}
        >
          {/* Modal Header */}
          <div className="bg-[#1e3a5f] px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-[#c8a96e]" />
              </div>
              <div>
                <h2 className="text-white font-semibold text-base">Fine Details</h2>
                <p className="text-white/60 text-xs">ID: {fine.id.slice(0, 8)}...</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/70 hover:text-white transition-all"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="p-6 space-y-5">
            {/* Member & Book Info */}
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-xl bg-[var(--muted)] p-4">
                <p className="text-xs font-medium text-[#5a6a7a] mb-1 flex items-center gap-1">
                  <Users className="h-3 w-3" /> Member
                </p>
                <p className="font-semibold text-[#1e3a5f] text-sm">{fine.user_name ?? "Unknown"}</p>
                <p className="text-xs text-[#5a6a7a] mt-0.5">{fine.user_email ?? ""}</p>
                {fine.membership_number && (
                  <p className="text-xs text-[#c8a96e] mt-0.5 font-medium">{fine.membership_number}</p>
                )}
              </div>
              <div className="rounded-xl bg-[var(--muted)] p-4">
                <p className="text-xs font-medium text-[#5a6a7a] mb-1 flex items-center gap-1">
                  <BookOpen className="h-3 w-3" /> Book
                </p>
                <p className="font-semibold text-[#1e3a5f] text-sm line-clamp-2">{fine.book_title ?? "Unknown"}</p>
                <p className="text-xs text-[#5a6a7a] mt-0.5">{fine.book_author ?? ""}</p>
              </div>
            </div>

            {/* Fine Breakdown */}
            <div className="rounded-xl border border-[var(--border)] overflow-hidden">
              <div className="bg-[var(--muted)] px-4 py-2.5 border-b border-[var(--border)]">
                <p className="text-xs font-semibold text-[#1e3a5f] uppercase tracking-wide">Fine Breakdown</p>
              </div>
              <div className="divide-y divide-[var(--border)]">
                {[
                  { label: "Overdue Days", value: `${fine.overdue_days} days` },
                  { label: "Rate per Day", value: formatCurrency(fine.fine_per_day) },
                  { label: "Total Amount", value: formatCurrency(fine.total_amount), bold: true },
                  { label: "Status", value: <StatusBadge status={fine.status} /> },
                  ...(fine.issue_date ? [{ label: "Issue Date", value: formatDate(fine.issue_date) }] : []),
                  ...(fine.due_date ? [{ label: "Due Date", value: formatDate(fine.due_date) }] : []),
                  ...(fine.return_date ? [{ label: "Return Date", value: formatDate(fine.return_date) }] : []),
                  ...(fine.paid_at ? [{ label: "Paid At", value: formatDate(fine.paid_at) }] : []),
                  ...(fine.waive_reason ? [{ label: "Waive Reason", value: fine.waive_reason }] : []),
                ].map((row, i) => (
                  <div key={i} className="flex items-center justify-between px-4 py-2.5">
                    <span className="text-xs text-[#5a6a7a]">{row.label}</span>
                    <span className={cn("text-xs text-[#1a2a3a]", (row as { bold?: boolean }).bold ? "font-bold text-[#1e3a5f]" : "")}>
                      {row.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            {fine.status === "pending" && (
              <div className="space-y-3">
                {!waiveMode ? (
                  <div className="flex gap-3">
                    <button
                      onClick={() => onMarkPaid(fine.id)}
                      disabled={loading}
                      className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold py-2.5 transition-all duration-200 disabled:opacity-60"
                    >
                      <CheckCircle className="h-4 w-4" />
                      Mark as Paid
                    </button>
                    <button
                      onClick={() => setWaiveMode(true)}
                      disabled={loading}
                      className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold py-2.5 transition-all duration-200 disabled:opacity-60"
                    >
                      <X className="h-4 w-4" />
                      Waive Fine
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <textarea
                      value={waiveReason}
                      onChange={(e) => setWaiveReason(e.target.value)}
                      placeholder="Enter reason for waiving this fine..."
                      rows={3}
                      className="w-full rounded-xl border border-[var(--border)] bg-[var(--muted)] px-4 py-3 text-sm text-[#1a2a3a] placeholder:text-[#5a6a7a] focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/30 resize-none"
                    />
                    <div className="flex gap-3">
                      <button
                        onClick={() => {
                          if (waiveReason.trim()) onWaive(fine.id, waiveReason);
                        }}
                        disabled={loading || !waiveReason.trim()}
                        className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold py-2.5 transition-all duration-200 disabled:opacity-60"
                      >
                        <CheckCircle className="h-4 w-4" />
                        Confirm Waive
                      </button>
                      <button
                        onClick={() => { setWaiveMode(false); setWaiveReason(""); }}
                        className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-[var(--border)] bg-white hover:bg-[var(--muted)] text-[#1a2a3a] text-sm font-semibold py-2.5 transition-all duration-200"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// ─── Main Page ──────────────────────────────────────────────────────────────────

export default function FineManagementPage() {
  const supabase = createClient();

  const [fines, setFines] = useState<FineWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFine, setSelectedFine] = useState<FineWithDetails | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // ─── Fetch Fines ─────────────────────────────────────────────────────────────

  const fetchFines = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: fineRows, error: fineErr } = await supabase
        .from("fines")
        .select("*")
        .order("created_at", { ascending: false });

      if (fineErr) throw fineErr;
      if (!fineRows || fineRows.length === 0) {
        setFines([]);
        return;
      }

      // Enrich with user and book info
      const enriched: FineWithDetails[] = await Promise.all(
        fineRows.map(async (fine) => {
          const result: FineWithDetails = { ...fine };

          // Fetch user info
          const { data: userRow } = await supabase
            .from("users")
            .select("full_name, email, membership_number")
            .eq("id", fine.user_id)
            .single();
          if (userRow) {
            result.user_name = userRow.full_name;
            result.user_email = userRow.email;
            result.membership_number = userRow.membership_number ?? undefined;
          }

          // Fetch issue info
          const { data: issueRow } = await supabase
            .from("book_issues")
            .select("book_id, issue_date, due_date, return_date")
            .eq("id", fine.issue_id)
            .single();
          if (issueRow) {
            result.issue_date = issueRow.issue_date;
            result.due_date = issueRow.due_date;
            result.return_date = issueRow.return_date;

            // Fetch book info
            const { data: bookRow } = await supabase
              .from("books")
              .select("title, author")
              .eq("id", issueRow.book_id)
              .single();
            if (bookRow) {
              result.book_title = bookRow.title;
              result.book_author = bookRow.author;
            }
          }

          return result;
        })
      );

      setFines(enriched);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load fines.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFines();
  }, [fetchFines]);

  // ─── Actions ──────────────────────────────────────────────────────────────────

  const handleMarkPaid = async (id: string) => {
    setActionLoading(true);
    try {
      const { error: updateErr } = await supabase
        .from("fines")
        .update({ status: "paid", paid_at: new Date().toISOString() })
        .eq("id", id);
      if (updateErr) throw updateErr;
      setSuccessMsg("Fine marked as paid.");
      setSelectedFine(null);
      await fetchFines();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update fine.");
    } finally {
      setActionLoading(false);
      setTimeout(() => setSuccessMsg(null), 3000);
    }
  };

  const handleWaive = async (id: string, reason: string) => {
    setActionLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { error: updateErr } = await supabase
        .from("fines")
        .update({
          status: "waived",
          waived_by: user?.id ?? null,
          waive_reason: reason,
        })
        .eq("id", id);
      if (updateErr) throw updateErr;
      setSuccessMsg("Fine waived successfully.");
      setSelectedFine(null);
      await fetchFines();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to waive fine.");
    } finally {
      setActionLoading(false);
      setTimeout(() => setSuccessMsg(null), 3000);
    }
  };

  // ─── Derived Stats ────────────────────────────────────────────────────────────

  const totalFines = fines.length;
  const pendingFines = fines.filter((f) => f.status === "pending");
  const paidFines = fines.filter((f) => f.status === "paid");
  const waivedFines = fines.filter((f) => f.status === "waived");
  const totalPendingAmount = pendingFines.reduce((s, f) => s + f.total_amount, 0);
  const totalCollected = paidFines.reduce((s, f) => s + f.total_amount, 0);

  // ─── Filtered Fines ───────────────────────────────────────────────────────────

  const filteredFines = fines.filter((f) => {
    const matchesStatus = statusFilter === "all" || f.status === statusFilter;
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      !q ||
      (f.user_name ?? "").toLowerCase().includes(q) ||
      (f.user_email ?? "").toLowerCase().includes(q) ||
      (f.book_title ?? "").toLowerCase().includes(q) ||
      (f.membership_number ?? "").toLowerCase().includes(q);
    return matchesStatus && matchesSearch;
  });

  // ─── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* ── Page Header ─────────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden bg-[#1e3a5f]">
        {/* Decorative background elements */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-[#c8a96e] blur-3xl translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 left-0 w-64 h-64 rounded-full bg-white blur-3xl -translate-x-1/2 translate-y-1/2" />
        </div>
        <div className="relative container-lms py-10 md:py-14">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: "easeOut" }}
          >
            <div className="flex items-center gap-2 mb-3">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#c8a96e]/20 border border-[#c8a96e]/30 px-3 py-1 text-xs font-semibold text-[#c8a96e] uppercase tracking-wide">
                <DollarSign className="h-3 w-3" />
                Fine Management
              </span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight text-balance">
              Fine Management
            </h1>
            <p className="mt-2 text-white/65 text-base max-w-xl leading-relaxed">
              Track, collect, and manage overdue fines across all library members. Mark fines as paid or waive them with a reason.
            </p>

            {/* Header summary stats */}
            <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "Total Fines", value: totalFines, icon: FileText },
                { label: "Pending", value: pendingFines.length, icon: Clock },
                { label: "Collected", value: formatCurrency(totalCollected), icon: TrendingUp },
                { label: "Outstanding", value: formatCurrency(totalPendingAmount), icon: AlertCircle },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-xl bg-white/10 border border-white/15 px-4 py-3 flex items-center gap-3"
                >
                  <div className="w-8 h-8 rounded-lg bg-[#c8a96e]/20 flex items-center justify-center flex-shrink-0">
                    <stat.icon className="h-4 w-4 text-[#c8a96e]" />
                  </div>
                  <div>
                    <p className="text-white font-bold text-lg leading-none">{stat.value}</p>
                    <p className="text-white/55 text-xs mt-0.5">{stat.label}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      {/* ── Main Content ────────────────────────────────────────────────────── */}
      <div className="container-lms py-8 space-y-6">

        {/* Success / Error banners */}
        <AnimatePresence>
          {successMsg && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="flex items-center gap-3 rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-emerald-700 text-sm font-medium"
            >
              <CheckCircle className="h-4 w-4 flex-shrink-0" />
              {successMsg}
            </motion.div>
          )}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="flex items-center gap-3 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-red-700 text-sm font-medium"
            >
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              {error}
              <button onClick={() => setError(null)} className="ml-auto">
                <X className="h-4 w-4" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Stat Cards ──────────────────────────────────────────────────── */}
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
        >
          <motion.div variants={fadeInUp}>
            <StatCard
              label="Total Fines"
              value={totalFines}
              sub="All time records"
              icon={DollarSign}
              accent
            />
          </motion.div>
          <motion.div variants={fadeInUp}>
            <StatCard
              label="Pending Fines"
              value={pendingFines.length}
              sub={formatCurrency(totalPendingAmount) + " outstanding"}
              icon={Clock}
              danger
            />
          </motion.div>
          <motion.div variants={fadeInUp}>
            <StatCard
              label="Paid Fines"
              value={paidFines.length}
              sub={formatCurrency(totalCollected) + " collected"}
              icon={CheckCircle}
            />
          </motion.div>
          <motion.div variants={fadeInUp}>
            <StatCard
              label="Waived Fines"
              value={waivedFines.length}
              sub={`Rate: PKR ${FINE_RATE_PER_DAY}/day`}
              icon={Users}
            />
          </motion.div>
        </motion.div>

        {/* ── Filter Bar ──────────────────────────────────────────────────── */}
        <Reveal>
          <div className="rounded-2xl bg-white border border-[var(--border)] shadow-[0_1px_2px_rgba(0,0,0,0.04),0_4px_16px_-4px_rgba(0,0,0,0.08)] p-4">
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
              {/* Search */}
              <div className="relative flex-1 min-w-0">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#5a6a7a]" />
                <input
                  type="text"
                  placeholder="Search by member, email, book, or membership no..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-xl border border-[var(--border)] bg-[var(--muted)] pl-10 pr-4 py-2.5 text-sm text-[#1a2a3a] placeholder:text-[#5a6a7a] focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/25 focus:border-[#1e3a5f]/40 transition-all"
                />
              </div>

              {/* Status filter pills */}
              <div className="flex items-center gap-2 flex-wrap">
                {(["all", "pending", "paid", "waived"] as StatusFilter[]).map((s) => (
                  <button
                    key={s}
                    onClick={() => setStatusFilter(s)}
                    className={cn(
                      "rounded-full px-4 py-1.5 text-xs font-semibold border transition-all duration-200",
                      statusFilter === s
                        ? s === "pending"
                          ? "bg-amber-500 border-amber-500 text-white shadow-sm"
                          : s === "paid"
                          ? "bg-emerald-600 border-emerald-600 text-white shadow-sm"
                          : s === "waived"
                          ? "bg-blue-600 border-blue-600 text-white shadow-sm"
                          : "bg-[#1e3a5f] border-[#1e3a5f] text-white shadow-sm"
                        : "bg-white border-[var(--border)] text-[#5a6a7a] hover:border-[#1e3a5f]/30 hover:text-[#1e3a5f]"
                    )}
                  >
                    {s === "all" ? "All" : getFineStatusLabel(s)}
                    {s !== "all" && (
                      <span className="ml-1.5 opacity-70">
                        ({s === "pending" ? pendingFines.length : s === "paid" ? paidFines.length : waivedFines.length})
                      </span>
                    )}
                  </button>
                ))}
              </div>

              {/* Refresh */}
              <button
                onClick={fetchFines}
                disabled={loading}
                className="flex items-center gap-2 rounded-xl border border-[var(--border)] bg-white hover:bg-[var(--muted)] px-3.5 py-2.5 text-sm font-medium text-[#1a2a3a] transition-all duration-200 disabled:opacity-50 flex-shrink-0"
              >
                <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
                Refresh
              </button>
            </div>
          </div>
        </Reveal>

        {/* ── Fines Table ─────────────────────────────────────────────────── */}
        <Reveal>
          <div className="rounded-2xl bg-white border border-[var(--border)] shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_-8px_rgba(0,0,0,0.10)] overflow-hidden">
            {/* Table header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)] bg-[var(--muted)]/50">
              <div>
                <h2 className="font-semibold text-[#1e3a5f] text-base">Fine Records</h2>
                <p className="text-xs text-[#5a6a7a] mt-0.5">
                  {filteredFines.length} record{filteredFines.length !== 1 ? "s" : ""} found
                </p>
              </div>
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3">
                <div className="w-10 h-10 rounded-full border-2 border-[#1e3a5f]/20 border-t-[#1e3a5f] animate-spin" />
                <p className="text-sm text-[#5a6a7a]">Loading fine records...</p>
              </div>
            ) : filteredFines.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3">
                <div className="w-14 h-14 rounded-2xl bg-[var(--muted)] flex items-center justify-center">
                  <DollarSign className="h-7 w-7 text-[#5a6a7a]" />
                </div>
                <p className="font-semibold text-[#1e3a5f]">No fines found</p>
                <p className="text-sm text-[#5a6a7a]">
                  {statusFilter !== "all" || searchQuery
                    ? "Try adjusting your filters."
                    : "No fine records exist yet."}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[var(--border)] bg-[var(--muted)]/30">
                      {["Member", "Book", "Overdue Days", "Amount", "Status", "Created", "Actions"].map((h) => (
                        <th
                          key={h}
                          className="px-5 py-3.5 text-left text-xs font-semibold text-[#5a6a7a] uppercase tracking-wide whitespace-nowrap"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border)]">
                    {filteredFines.map((fine) => (
                      <motion.tr
                        key={fine.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="group hover:bg-[var(--muted)]/40 transition-colors duration-150"
                      >
                        {/* Member */}
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-[#1e3a5f]/10 flex items-center justify-center flex-shrink-0">
                              <span className="text-xs font-bold text-[#1e3a5f]">
                                {(fine.user_name ?? "?").charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div className="min-w-0">
                              <p className="font-semibold text-[#1a2a3a] truncate max-w-[140px]">
                                {fine.user_name ?? "Unknown"}
                              </p>
                              {fine.membership_number && (
                                <p className="text-xs text-[#c8a96e] font-medium">{fine.membership_number}</p>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Book */}
                        <td className="px-5 py-4">
                          <p className="font-medium text-[#1a2a3a] truncate max-w-[160px]">
                            {fine.book_title ?? "Unknown"}
                          </p>
                          {fine.book_author && (
                            <p className="text-xs text-[#5a6a7a] truncate max-w-[160px]">{fine.book_author}</p>
                          )}
                        </td>

                        {/* Overdue Days */}
                        <td className="px-5 py-4">
                          <span className="inline-flex items-center gap-1 rounded-lg bg-red-50 border border-red-200 px-2.5 py-1 text-xs font-semibold text-red-700">
                            <Clock className="h-3 w-3" />
                            {fine.overdue_days}d
                          </span>
                        </td>

                        {/* Amount */}
                        <td className="px-5 py-4">
                          <span className="font-bold text-[#1e3a5f]">
                            {formatCurrency(fine.total_amount)}
                          </span>
                        </td>

                        {/* Status */}
                        <td className="px-5 py-4">
                          <StatusBadge status={fine.status} />
                        </td>

                        {/* Created */}
                        <td className="px-5 py-4">
                          <span className="text-xs text-[#5a6a7a] whitespace-nowrap">
                            {formatDate(fine.created_at)}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setSelectedFine(fine)}
                              className="flex items-center gap-1.5 rounded-lg border border-[var(--border)] bg-white hover:bg-[var(--muted)] px-3 py-1.5 text-xs font-medium text-[#1a2a3a] transition-all duration-200 shadow-sm"
                            >
                              <Eye className="h-3.5 w-3.5" />
                              View
                            </button>
                            {fine.status === "pending" && (
                              <>
                                <button
                                  onClick={() => handleMarkPaid(fine.id)}
                                  disabled={actionLoading}
                                  className="flex items-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 px-3 py-1.5 text-xs font-semibold text-white transition-all duration-200 shadow-sm disabled:opacity-60"
                                >
                                  <CheckCircle className="h-3.5 w-3.5" />
                                  Pay
                                </button>
                                <button
                                  onClick={() => setSelectedFine(fine)}
                                  disabled={actionLoading}
                                  className="flex items-center gap-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 px-3 py-1.5 text-xs font-semibold text-white transition-all duration-200 shadow-sm disabled:opacity-60"
                                >
                                  <X className="h-3.5 w-3.5" />
                                  Waive
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </Reveal>
      </div>

      {/* ── Fine Detail Modal ────────────────────────────────────────────── */}
      {selectedFine && (
        <FineDetailModal
          fine={selectedFine}
          onClose={() => setSelectedFine(null)}
          onMarkPaid={handleMarkPaid}
          onWaive={handleWaive}
          loading={actionLoading}
        />
      )}
    </div>
  );
}

// Needed for the header stats icon
function FileText({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
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
