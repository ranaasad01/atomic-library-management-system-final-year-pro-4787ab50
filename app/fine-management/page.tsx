"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { AlertCircle, CheckCircle, Clock, Search, Filter, DollarSign, TrendingUp, Users, FileText, X, Check, Eye, ChevronDown } from 'lucide-react';
import { Reveal } from "@/components/Reveal";
import { staggerContainer, fadeInUp } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { FINE_RATE_PER_DAY } from "@/lib/data";
type getFineStatusLabel = any;
const getFineStatusLabel: any = [];
type calculateOverdueDays = any;
const calculateOverdueDays: any = [];
import type from "@/lib/data";
type Fine = any;
const Fine: any = [];

// ─── Types ──────────────────────────────────────────────────────────────────────

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

// ─── Stat Card ──────────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  accent,
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ElementType;
  accent?: boolean;
}) {
  return (
    <motion.div
      whileHover={{ y: -2, boxShadow: "0 8px 32px -8px rgba(30,58,95,0.18)" }}
      transition={{ duration: 0.2 }}
      className={cn(
        "rounded-2xl border p-5 flex flex-col gap-3",
        accent
          ? "bg-[var(--brand-navy)] border-[var(--brand-navy)] text-white"
          : "bg-white border-[var(--brand-border)] text-[var(--brand-navy)]"
      )}
    >
      <div className="flex items-center justify-between">
        <span className={cn("text-sm font-medium", accent ? "text-white/70" : "text-[var(--brand-muted)]")}>
          {label}
        </span>
        <span
          className={cn(
            "flex h-9 w-9 items-center justify-center rounded-xl",
            accent ? "bg-white/10" : "bg-[var(--brand-cream)]"
          )}
        >
          <Icon className={cn("h-4 w-4", accent ? "text-[var(--brand-gold)]" : "text-[var(--brand-navy)]")} />
        </span>
      </div>
      <div>
        <div className={cn("text-2xl font-bold tracking-tight", accent ? "text-white" : "text-[var(--brand-navy)]")}>
          {value}
        </div>
        {sub && (
          <div className={cn("mt-0.5 text-xs", accent ? "text-white/60" : "text-[var(--brand-muted)]")}>
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
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium",
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 16 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        className="relative z-10 w-full max-w-lg rounded-2xl border border-[var(--brand-border)] bg-white shadow-[0_8px_48px_-8px_rgba(30,58,95,0.22)] overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--brand-border)] bg-[var(--brand-cream)] px-6 py-4">
          <div>
            <h2 className="text-base font-semibold text-[var(--brand-navy)]">Fine Details</h2>
            <p className="text-xs text-[var(--brand-muted)] mt-0.5">Fine ID: {fine.id.slice(0, 8).toUpperCase()}</p>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--brand-muted)] hover:bg-white hover:text-[var(--brand-navy)] transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          {/* Member */}
          <div className="rounded-xl border border-[var(--brand-border)] bg-[var(--brand-cream)] p-4">
            <p className="text-xs font-medium text-[var(--brand-muted)] uppercase tracking-wide mb-2">Member</p>
            <p className="font-semibold text-[var(--brand-navy)]">{fine.user_name ?? "Unknown"}</p>
            <p className="text-sm text-[var(--brand-muted)]">{fine.user_email ?? ""}</p>
            {fine.membership_number && (
              <p className="text-xs text-[var(--brand-muted)] mt-1">Membership: {fine.membership_number}</p>
            )}
          </div>

          {/* Book */}
          <div className="rounded-xl border border-[var(--brand-border)] bg-[var(--brand-cream)] p-4">
            <p className="text-xs font-medium text-[var(--brand-muted)] uppercase tracking-wide mb-2">Book</p>
            <p className="font-semibold text-[var(--brand-navy)]">{fine.book_title ?? "Unknown Book"}</p>
            <p className="text-sm text-[var(--brand-muted)]">{fine.book_author ?? ""}</p>
          </div>

          {/* Fine breakdown */}
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-xl border border-[var(--brand-border)] p-3 text-center">
              <p className="text-xs text-[var(--brand-muted)]">Overdue Days</p>
              <p className="text-xl font-bold text-[var(--brand-red)] mt-1">{fine.overdue_days}</p>
            </div>
            <div className="rounded-xl border border-[var(--brand-border)] p-3 text-center">
              <p className="text-xs text-[var(--brand-muted)]">Rate / Day</p>
              <p className="text-xl font-bold text-[var(--brand-navy)] mt-1">PKR {fine.fine_per_day}</p>
            </div>
            <div className="rounded-xl border border-[var(--brand-border)] bg-[var(--brand-navy)] p-3 text-center">
              <p className="text-xs text-white/70">Total Fine</p>
              <p className="text-xl font-bold text-[var(--brand-gold)] mt-1">PKR {fine.total_amount}</p>
            </div>
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="text-[var(--brand-muted)]">Status</span>
            <StatusBadge status={fine.status} />
          </div>

          {fine.status === "waived" && fine.waive_reason && (
            <div className="rounded-xl border border-blue-200 bg-blue-50 p-3 text-sm text-blue-700">
              <span className="font-medium">Waive reason:</span> {fine.waive_reason}
            </div>
          )}

          {/* Waive form */}
          {waiveMode && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-[var(--brand-navy)]">Reason for waiving</label>
              <textarea
                value={waiveReason}
                onChange={(e) => setWaiveReason(e.target.value)}
                rows={2}
                placeholder="Enter reason..."
                className="w-full rounded-xl border border-[var(--brand-border)] bg-[var(--brand-cream)] px-3 py-2 text-sm text-[var(--brand-navy)] placeholder:text-[var(--brand-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-navy)]/20 resize-none"
              />
            </div>
          )}
        </div>

        {/* Footer actions */}
        {fine.status === "pending" && (
          <div className="flex gap-3 border-t border-[var(--brand-border)] px-6 py-4">
            {!waiveMode ? (
              <>
                <button
                  onClick={() => onMarkPaid(fine.id)}
                  disabled={loading}
                  className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-[var(--brand-navy)] px-4 py-2.5 text-sm font-medium text-white hover:bg-[var(--brand-navy)]/90 disabled:opacity-60 transition-colors"
                >
                  <Check className="h-4 w-4" />
                  Mark as Paid
                </button>
                <button
                  onClick={() => setWaiveMode(true)}
                  disabled={loading}
                  className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-[var(--brand-border)] px-4 py-2.5 text-sm font-medium text-[var(--brand-navy)] hover:bg-[var(--brand-cream)] disabled:opacity-60 transition-colors"
                >
                  <X className="h-4 w-4" />
                  Waive Fine
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => {
                    if (waiveReason.trim()) onWaive(fine.id, waiveReason);
                  }}
                  disabled={loading || !waiveReason.trim()}
                  className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60 transition-colors"
                >
                  Confirm Waive
                </button>
                <button
                  onClick={() => { setWaiveMode(false); setWaiveReason(""); }}
                  className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-[var(--brand-border)] px-4 py-2.5 text-sm font-medium text-[var(--brand-navy)] hover:bg-[var(--brand-cream)] transition-colors"
                >
                  Cancel
                </button>
              </>
            )}
          </div>
        )}
      </motion.div>
    </div>
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
  const [search, setSearch] = useState("");
  const [selectedFine, setSelectedFine] = useState<FineWithDetails | null>(null);

  // ─── Fetch fines with joined data ──────────────────────────────────────────

  const fetchFines = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: finesData, error: finesError } = await supabase
        .from("fines")
        .select("*")
        .order("created_at", { ascending: false });

      if (finesError) throw finesError;
      if (!finesData) { setFines([]); return; }

      // Fetch related book_issues
      const issueIds = [...new Set(finesData.map((f) => f.issue_id))];
      const { data: issuesData } = await supabase
        .from("book_issues")
        .select("id, book_id, user_id, issue_date, due_date, return_date")
        .in("id", issueIds.length > 0 ? issueIds : ["00000000-0000-0000-0000-000000000000"]);

      // Fetch related books
      const bookIds = [...new Set((issuesData ?? []).map((i) => i.book_id))];
      const { data: booksData } = await supabase
        .from("books")
        .select("id, title, author")
        .in("id", bookIds.length > 0 ? bookIds : ["00000000-0000-0000-0000-000000000000"]);

      // Fetch related users
      const userIds = [...new Set(finesData.map((f) => f.user_id))];
      const { data: usersData } = await supabase
        .from("users")
        .select("id, full_name, email, membership_number")
        .in("id", userIds.length > 0 ? userIds : ["00000000-0000-0000-0000-000000000000"]);

      const issueMap = new Map((issuesData ?? []).map((i) => [i.id, i]));
      const bookMap = new Map((booksData ?? []).map((b) => [b.id, b]));
      const userMap = new Map((usersData ?? []).map((u) => [u.id, u]));

      const enriched: FineWithDetails[] = finesData.map((f) => {
        const issue = issueMap.get(f.issue_id);
        const book = issue ? bookMap.get(issue.book_id) : undefined;
        const user = userMap.get(f.user_id);
        return {
          ...f,
          user_name: user?.full_name,
          user_email: user?.email,
          membership_number: user?.membership_number ?? undefined,
          book_title: book?.title,
          book_author: book?.author,
          issue_date: issue?.issue_date,
          due_date: issue?.due_date,
          return_date: issue?.return_date,
        };
      });

      setFines(enriched);
    } catch (err) {
      setError("Failed to load fines. Please try again.");
      console.error("Fines fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchFines();
  }, [fetchFines]);

  // ─── Actions ────────────────────────────────────────────────────────────────

  const handleMarkPaid = async (fineId: string) => {
    setActionLoading(true);
    try {
      const { error } = await supabase
        .from("fines")
        .update({ status: "paid", paid_at: new Date().toISOString(), updated_at: new Date().toISOString() })
        .eq("id", fineId);
      if (error) throw error;
      setSelectedFine(null);
      await fetchFines();
    } catch (err) {
      console.error("Mark paid error:", err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleWaive = async (fineId: string, reason: string) => {
    setActionLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase
        .from("fines")
        .update({
          status: "waived",
          waive_reason: reason,
          waived_by: user?.id ?? null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", fineId);
      if (error) throw error;
      setSelectedFine(null);
      await fetchFines();
    } catch (err) {
      console.error("Waive error:", err);
    } finally {
      setActionLoading(false);
    }
  };

  // ─── Derived stats ──────────────────────────────────────────────────────────

  const totalPending = fines.filter((f) => f.status === "pending").reduce((s, f) => s + Number(f.total_amount), 0);
  const totalCollected = fines.filter((f) => f.status === "paid").reduce((s, f) => s + Number(f.total_amount), 0);
  const pendingCount = fines.filter((f) => f.status === "pending").length;
  const paidCount = fines.filter((f) => f.status === "paid").length;

  // ─── Filtered list ──────────────────────────────────────────────────────────

  const filtered = fines.filter((f) => {
    const matchStatus = statusFilter === "all" || f.status === statusFilter;
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      (f.user_name ?? "").toLowerCase().includes(q) ||
      (f.user_email ?? "").toLowerCase().includes(q) ||
      (f.book_title ?? "").toLowerCase().includes(q) ||
      (f.membership_number ?? "").toLowerCase().includes(q);
    return matchStatus && matchSearch;
  });

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[var(--brand-cream)]">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">

        {/* Page Header */}
        <Reveal>
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--brand-navy)]">
                <DollarSign className="h-5 w-5 text-[var(--brand-gold)]" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-[var(--brand-navy)]">
                  Fine Management
                </h1>
                <p className="text-sm text-[var(--brand-muted)]">
                  Track, collect, and waive overdue fines for library members
                </p>
              </div>
            </div>
          </div>
        </Reveal>

        {/* Stat Cards */}
        <Reveal>
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-2 gap-4 sm:grid-cols-4 mb-8"
          >
            <motion.div variants={fadeInUp}>
              <StatCard
                label="Pending Amount"
                value={`PKR ${totalPending.toLocaleString("en-PK")}`}
                sub={`${pendingCount} fine${pendingCount !== 1 ? "s" : ""} outstanding`}
                icon={AlertCircle}
                accent
              />
            </motion.div>
            <motion.div variants={fadeInUp}>
              <StatCard
                label="Total Collected"
                value={`PKR ${totalCollected.toLocaleString("en-PK")}`}
                sub={`${paidCount} fine${paidCount !== 1 ? "s" : ""} paid`}
                icon={TrendingUp}
              />
            </motion.div>
            <motion.div variants={fadeInUp}>
              <StatCard
                label="Total Fines"
                value={fines.length}
                sub="All time records"
                icon={FileText}
              />
            </motion.div>
            <motion.div variants={fadeInUp}>
              <StatCard
                label="Fine Rate"
                value={`PKR ${FINE_RATE_PER_DAY}/day`}
                sub="Current overdue rate"
                icon={Users}
              />
            </motion.div>
          </motion.div>
        </Reveal>

        {/* Filters & Search */}
        <Reveal>
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            {/* Search */}
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--brand-muted)]" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by member, book, or ID..."
                className="w-full rounded-xl border border-[var(--brand-border)] bg-white pl-9 pr-4 py-2.5 text-sm text-[var(--brand-navy)] placeholder:text-[var(--brand-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-navy)]/20"
              />
            </div>

            {/* Status filter tabs */}
            <div className="flex items-center gap-1 rounded-xl border border-[var(--brand-border)] bg-white p-1">
              {(["all", "pending", "paid", "waived"] as StatusFilter[]).map((s) => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={cn(
                    "rounded-lg px-3 py-1.5 text-xs font-medium capitalize transition-colors",
                    statusFilter === s
                      ? "bg-[var(--brand-navy)] text-white"
                      : "text-[var(--brand-muted)] hover:text-[var(--brand-navy)]"
                  )}
                >
                  {s === "all" ? "All" : getFineStatusLabel(s)}
                </button>
              ))}
            </div>
          </div>
        </Reveal>

        {/* Table */}
        <Reveal>
          <div className="rounded-2xl border border-[var(--brand-border)] bg-white overflow-hidden shadow-[0_1px_4px_rgba(30,58,95,0.06)]">
            {/* Table header */}
            <div className="border-b border-[var(--brand-border)] bg-[var(--brand-cream)] px-6 py-3 flex items-center justify-between">
              <span className="text-sm font-medium text-[var(--brand-navy)]">
                {filtered.length} fine{filtered.length !== 1 ? "s" : ""} found
              </span>
              <Filter className="h-4 w-4 text-[var(--brand-muted)]" />
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                  className="h-8 w-8 rounded-full border-2 border-[var(--brand-navy)] border-t-transparent"
                />
                <p className="text-sm text-[var(--brand-muted)]">Loading fines...</p>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3">
                <AlertCircle className="h-10 w-10 text-[var(--brand-red)]" />
                <p className="text-sm text-[var(--brand-red)]">{error}</p>
                <button
                  onClick={fetchFines}
                  className="rounded-xl bg-[var(--brand-navy)] px-4 py-2 text-sm text-white hover:bg-[var(--brand-navy)]/90 transition-colors"
                >
                  Retry
                </button>
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3">
                <CheckCircle className="h-10 w-10 text-emerald-400" />
                <p className="text-sm text-[var(--brand-muted)]">
                  {search || statusFilter !== "all"
                    ? "No fines match your filters."
                    : "No fines recorded yet."}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[var(--brand-border)]">
                      {["Member", "Book", "Overdue Days", "Fine Amount", "Status", "Date", "Action"].map((h) => (
                        <th
                          key={h}
                          className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[var(--brand-muted)]"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--brand-border)]">
                    {filtered.map((fine, i) => (
                      <motion.tr
                        key={fine.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.03, duration: 0.25 }}
                        className="hover:bg-[var(--brand-cream)] transition-colors"
                      >
                        <td className="px-5 py-3.5">
                          <div className="font-medium text-[var(--brand-navy)]">
                            {fine.user_name ?? "Unknown"}
                          </div>
                          {fine.membership_number && (
                            <div className="text-xs text-[var(--brand-muted)]">
                              {fine.membership_number}
                            </div>
                          )}
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="font-medium text-[var(--brand-navy)] max-w-[180px] truncate">
                            {fine.book_title ?? "Unknown Book"}
                          </div>
                          <div className="text-xs text-[var(--brand-muted)] truncate max-w-[180px]">
                            {fine.book_author ?? ""}
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="font-semibold text-[var(--brand-red)]">
                            {fine.overdue_days} day{fine.overdue_days !== 1 ? "s" : ""}
                          </span>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="font-bold text-[var(--brand-navy)]">
                            PKR {Number(fine.total_amount).toLocaleString("en-PK")}
                          </span>
                        </td>
                        <td className="px-5 py-3.5">
                          <StatusBadge status={fine.status} />
                        </td>
                        <td className="px-5 py-3.5 text-xs text-[var(--brand-muted)] whitespace-nowrap">
                          {new Date(fine.created_at).toLocaleDateString("en-PK", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}
                        </td>
                        <td className="px-5 py-3.5">
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.97 }}
                            onClick={() => setSelectedFine(fine)}
                            className="flex items-center gap-1.5 rounded-lg border border-[var(--brand-border)] bg-white px-3 py-1.5 text-xs font-medium text-[var(--brand-navy)] hover:bg-[var(--brand-cream)] transition-colors"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            View
                          </motion.button>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </Reveal>

        {/* Summary bar */}
        {!loading && fines.length > 0 && (
          <Reveal>
            <div className="mt-6 rounded-2xl border border-[var(--brand-border)] bg-white px-6 py-4 flex flex-wrap gap-6 items-center justify-between">
              <div className="flex gap-6">
                <div>
                  <p className="text-xs text-[var(--brand-muted)]">Pending</p>
                  <p className="text-base font-bold text-amber-600">
                    PKR {totalPending.toLocaleString("en-PK")}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-[var(--brand-muted)]">Collected</p>
                  <p className="text-base font-bold text-emerald-600">
                    PKR {totalCollected.toLocaleString("en-PK")}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-[var(--brand-muted)]">Waived</p>
                  <p className="text-base font-bold text-blue-600">
                    PKR {fines
                      .filter((f) => f.status === "waived")
                      .reduce((s, f) => s + Number(f.total_amount), 0)
                      .toLocaleString("en-PK")}
                  </p>
                </div>
              </div>
              <div className="text-xs text-[var(--brand-muted)]">
                Fine rate: PKR {FINE_RATE_PER_DAY} per overdue day
              </div>
            </div>
          </Reveal>
        )}
      </div>

      {/* Detail Modal */}
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