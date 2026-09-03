"use client";

import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { AlertCircle, CheckCircle, Clock, DollarSign, Search, Filter, RefreshCw, BookOpen, User, Calendar, ChevronDown, X } from 'lucide-react';
import { Reveal } from "@/components/Reveal";
import { staggerContainer, fadeInUp } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

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
}

interface UserRow {
  id: string;
  full_name: string;
  email: string;
  membership_number: string | null;
}

interface EnrichedFine extends FineRow {
  book_title?: string;
  book_author?: string;
  member_name?: string;
  member_email?: string;
  membership_number?: string | null;
  due_date?: string;
  return_date?: string | null;
}

// ─── Helpers ────────────────────────────────────────────────────────────────────

function getFineStatusLabel(status: string): string {
  switch (status) {
    case "pending": return "Pending";
    case "paid": return "Paid";
    case "waived": return "Waived";
    default: return status;
  }
}

function formatCurrency(amount: number): string {
  return `PKR ${amount.toLocaleString("en-PK", { minimumFractionDigits: 0 })}`;
}

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "N/A";
  return new Date(dateStr).toLocaleDateString("en-PK", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

const STATUS_FILTERS = ["all", "pending", "paid", "waived"] as const;
type StatusFilter = (typeof STATUS_FILTERS)[number];

// ─── Stat Card ──────────────────────────────────────────────────────────────────

interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  accent?: boolean;
  danger?: boolean;
  delay?: number;
}

function StatCard({ label, value, icon, accent, danger, delay = 0 }: StatCardProps) {
  return (
    <Reveal delay={delay}>
      <div
        className={cn(
          "rounded-2xl border p-5 flex items-center gap-4 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_-8px_rgba(0,0,0,0.10)]",
          accent
            ? "bg-[var(--brand-navy)] border-[var(--brand-navy)] text-white"
            : danger
            ? "bg-[var(--brand-red)]/5 border-[var(--brand-red)]/20 text-[hsl(var(--foreground))]"
            : "bg-[hsl(var(--card))] border-[hsl(var(--border))] text-[hsl(var(--foreground))]"
        )}
      >
        <div
          className={cn(
            "flex h-11 w-11 items-center justify-center rounded-xl shrink-0",
            accent
              ? "bg-white/15"
              : danger
              ? "bg-[var(--brand-red)]/10"
              : "bg-[var(--brand-gold)]/10"
          )}
        >
          <span
            className={cn(
              accent ? "text-white" : danger ? "text-[var(--brand-red)]" : "text-[var(--brand-gold)]"
            )}
          >
            {icon}
          </span>
        </div>
        <div>
          <p
            className={cn(
              "text-xs font-medium uppercase tracking-wide",
              accent ? "text-white/70" : "text-[hsl(var(--muted-foreground))]"
            )}
          >
            {label}
          </p>
          <p className={cn("text-2xl font-bold mt-0.5", accent ? "text-white" : "")}>
            {value}
          </p>
        </div>
      </div>
    </Reveal>
  );
}

// ─── Fine Status Badge ──────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const base = "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold";
  if (status === "paid")
    return (
      <span className={cn(base, "bg-emerald-100 text-emerald-700")}>
        <CheckCircle className="h-3 w-3" /> Paid
      </span>
    );
  if (status === "waived")
    return (
      <span className={cn(base, "bg-blue-100 text-blue-700")}>
        <X className="h-3 w-3" /> Waived
      </span>
    );
  return (
    <span className={cn(base, "bg-[var(--brand-red)]/10 text-[var(--brand-red)]")}>
      <AlertCircle className="h-3 w-3" /> Pending
    </span>
  );
}

// ─── Main Page ──────────────────────────────────────────────────────────────────

export default function FinesPage() {
  const supabase = createClient();

  const [fines, setFines] = useState<EnrichedFine[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentUserRole, setCurrentUserRole] = useState<string>("member");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [waiveModal, setWaiveModal] = useState<{ open: boolean; fineId: string; reason: string }>({
    open: false,
    fineId: "",
    reason: "",
  });

  // ── Fetch current user ──────────────────────────────────────────────────────
  useEffect(() => {
    async function fetchUser() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUserId(user.id);
        const { data: profile } = await supabase
          .from("users")
          .select("role")
          .eq("id", user.id)
          .single();
        if (profile) setCurrentUserRole(profile.role);
      }
    }
    fetchUser();
  }, []);

  // ── Fetch fines with enrichment ─────────────────────────────────────────────
  const fetchFines = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: finesData, error: finesErr } = await supabase
        .from("fines")
        .select("*")
        .order("created_at", { ascending: false });

      if (finesErr) throw finesErr;
      if (!finesData || finesData.length === 0) {
        setFines([]);
        setLoading(false);
        return;
      }

      // Fetch related book_issues
      const issueIds = [...new Set(finesData.map((f) => f.issue_id))];
      const { data: issuesData } = await supabase
        .from("book_issues")
        .select("id, book_id, user_id, due_date, return_date")
        .in("id", issueIds);

      // Fetch related books
      const bookIds = [...new Set((issuesData ?? []).map((i: BookIssueRow) => i.book_id))];
      const { data: booksData } = bookIds.length
        ? await supabase.from("books").select("id, title, author").in("id", bookIds)
        : { data: [] };

      // Fetch related users
      const userIds = [...new Set(finesData.map((f) => f.user_id))];
      const { data: usersData } = userIds.length
        ? await supabase
            .from("users")
            .select("id, full_name, email, membership_number")
            .in("id", userIds)
        : { data: [] };

      const issueMap = new Map<string, BookIssueRow>(
        (issuesData ?? []).map((i: BookIssueRow) => [i.id, i])
      );
      const bookMap = new Map<string, BookRow>(
        (booksData ?? []).map((b: BookRow) => [b.id, b])
      );
      const userMap = new Map<string, UserRow>(
        (usersData ?? []).map((u: UserRow) => [u.id, u])
      );

      const enriched: EnrichedFine[] = finesData.map((fine) => {
        const issue = issueMap.get(fine.issue_id);
        const book = issue ? bookMap.get(issue.book_id) : undefined;
        const member = userMap.get(fine.user_id);
        return {
          ...fine,
          book_title: book?.title ?? "Unknown Book",
          book_author: book?.author ?? "",
          member_name: member?.full_name ?? "Unknown Member",
          member_email: member?.email ?? "",
          membership_number: member?.membership_number ?? null,
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
  }, []);

  useEffect(() => {
    fetchFines();
  }, [fetchFines]);

  // ── Mark as paid ────────────────────────────────────────────────────────────
  async function markAsPaid(fineId: string) {
    setActionLoading(fineId);
    const { error } = await supabase
      .from("fines")
      .update({ status: "paid", paid_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      .eq("id", fineId);
    if (!error) {
      setFines((prev) =>
        prev.map((f) =>
          f.id === fineId ? { ...f, status: "paid", paid_at: new Date().toISOString() } : f
        )
      );
    }
    setActionLoading(null);
  }

  // ── Waive fine ──────────────────────────────────────────────────────────────
  async function waiveFine() {
    if (!waiveModal.fineId || !currentUserId) return;
    setActionLoading(waiveModal.fineId);
    const { error } = await supabase
      .from("fines")
      .update({
        status: "waived",
        waived_by: currentUserId,
        waive_reason: waiveModal.reason || "Waived by admin",
        updated_at: new Date().toISOString(),
      })
      .eq("id", waiveModal.fineId);
    if (!error) {
      setFines((prev) =>
        prev.map((f) =>
          f.id === waiveModal.fineId
            ? { ...f, status: "waived", waived_by: currentUserId, waive_reason: waiveModal.reason }
            : f
        )
      );
    }
    setActionLoading(null);
    setWaiveModal({ open: false, fineId: "", reason: "" });
  }

  // ── Derived stats ───────────────────────────────────────────────────────────
  const totalPending = fines.filter((f) => f.status === "pending").reduce((s, f) => s + Number(f.total_amount), 0);
  const totalCollected = fines.filter((f) => f.status === "paid").reduce((s, f) => s + Number(f.total_amount), 0);
  const totalWaived = fines.filter((f) => f.status === "waived").reduce((s, f) => s + Number(f.total_amount), 0);
  const pendingCount = fines.filter((f) => f.status === "pending").length;

  // ── Filtered fines ──────────────────────────────────────────────────────────
  const filtered = fines.filter((f) => {
    const matchStatus = statusFilter === "all" || f.status === statusFilter;
    const q = searchQuery.toLowerCase();
    const matchSearch =
      !q ||
      (f.member_name ?? "").toLowerCase().includes(q) ||
      (f.member_email ?? "").toLowerCase().includes(q) ||
      (f.book_title ?? "").toLowerCase().includes(q) ||
      (f.membership_number ?? "").toLowerCase().includes(q);
    return matchStatus && matchSearch;
  });

  const isAdmin = currentUserRole === "admin";

  return (
    <main className="min-h-screen bg-[hsl(var(--background))] pb-20">
      {/* ── Page Header ─────────────────────────────────────────────────────── */}
      <Reveal>
        <div className="bg-[var(--brand-navy)] text-white px-6 py-10 md:px-10">
          <div className="mx-auto max-w-7xl">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-[var(--brand-gold)] mb-1">
                  Fine Management
                </p>
                <h1 className="text-3xl font-bold tracking-tight text-white">
                  {isAdmin ? "Library Fines" : "My Fines"}
                </h1>
                <p className="mt-1 text-sm text-white/60">
                  {isAdmin
                    ? "Track, collect, and waive overdue fines across all members."
                    : "View and manage your outstanding library fines."}
                </p>
              </div>
              <button
                onClick={fetchFines}
                className="mt-4 sm:mt-0 inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-sm font-medium text-white transition-all hover:bg-white/20"
              >
                <RefreshCw className="h-4 w-4" />
                Refresh
              </button>
            </div>
          </div>
        </div>
      </Reveal>

      <div className="mx-auto max-w-7xl px-6 md:px-10">
        {/* ── Stat Cards ──────────────────────────────────────────────────────── */}
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Pending Amount"
            value={formatCurrency(totalPending)}
            icon={<AlertCircle className="h-5 w-5" />}
            danger
            delay={0}
          />
          <StatCard
            label="Pending Fines"
            value={pendingCount}
            icon={<Clock className="h-5 w-5" />}
            delay={0.06}
          />
          <StatCard
            label="Total Collected"
            value={formatCurrency(totalCollected)}
            icon={<DollarSign className="h-5 w-5" />}
            accent
            delay={0.12}
          />
          <StatCard
            label="Total Waived"
            value={formatCurrency(totalWaived)}
            icon={<CheckCircle className="h-5 w-5" />}
            delay={0.18}
          />
        </div>

        {/* ── Filters ─────────────────────────────────────────────────────────── */}
        <Reveal className="mt-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-5 py-4 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_4px_12px_-4px_rgba(0,0,0,0.08)]">
            {/* Search */}
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[hsl(var(--muted-foreground))]" />
              <input
                type="text"
                placeholder="Search by member, book, or ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] py-2 pl-9 pr-4 text-sm text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground))] focus:outline-none focus:ring-2 focus:ring-[var(--brand-navy)]/30"
              />
            </div>
            {/* Status filter tabs */}
            <div className="flex items-center gap-1 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] p-1">
              {STATUS_FILTERS.map((s) => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={cn(
                    "rounded-lg px-3 py-1.5 text-xs font-semibold capitalize transition-all",
                    statusFilter === s
                      ? "bg-[var(--brand-navy)] text-white shadow-sm"
                      : "text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
                  )}
                >
                  {s === "all" ? "All" : getFineStatusLabel(s)}
                </button>
              ))}
            </div>
          </div>
        </Reveal>

        {/* ── Table / List ─────────────────────────────────────────────────────── */}
        <Reveal className="mt-6">
          <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_-8px_rgba(0,0,0,0.10)] overflow-hidden">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-24 gap-3 text-[hsl(var(--muted-foreground))]">
                <RefreshCw className="h-7 w-7 animate-spin text-[var(--brand-gold)]" />
                <p className="text-sm">Loading fines...</p>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center py-24 gap-3">
                <AlertCircle className="h-8 w-8 text-[var(--brand-red)]" />
                <p className="text-sm text-[hsl(var(--muted-foreground))]">{error}</p>
                <button
                  onClick={fetchFines}
                  className="mt-2 rounded-xl bg-[var(--brand-navy)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--brand-navy)]/90 transition-all"
                >
                  Retry
                </button>
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 gap-3 text-[hsl(var(--muted-foreground))]">
                <CheckCircle className="h-10 w-10 text-emerald-400" />
                <p className="text-base font-semibold text-[hsl(var(--foreground))]">
                  {statusFilter === "pending" ? "No pending fines" : "No fines found"}
                </p>
                <p className="text-sm">
                  {statusFilter === "pending"
                    ? "All members are up to date."
                    : "Try adjusting your search or filter."}
                </p>
              </div>
            ) : (
              <>
                {/* Desktop table */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-[hsl(var(--border))] bg-[hsl(var(--muted))]/40">
                        <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[hsl(var(--muted-foreground))]">
                          Member
                        </th>
                        <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[hsl(var(--muted-foreground))]">
                          Book
                        </th>
                        <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[hsl(var(--muted-foreground))]">
                          Overdue Days
                        </th>
                        <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[hsl(var(--muted-foreground))]">
                          Amount
                        </th>
                        <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[hsl(var(--muted-foreground))]">
                          Status
                        </th>
                        <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[hsl(var(--muted-foreground))]">
                          Due Date
                        </th>
                        {isAdmin && (
                          <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-[hsl(var(--muted-foreground))]">
                            Actions
                          </th>
                        )}
                      </tr>
                    </thead>
                    <motion.tbody
                      variants={staggerContainer}
                      initial="hidden"
                      animate="visible"
                    >
                      {filtered.map((fine) => (
                        <motion.tr
                          key={fine.id}
                          variants={fadeInUp}
                          className="border-b border-[hsl(var(--border))]/60 last:border-0 hover:bg-[hsl(var(--muted))]/30 transition-colors"
                        >
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--brand-navy)]/10 shrink-0">
                                <User className="h-4 w-4 text-[var(--brand-navy)]" />
                              </div>
                              <div>
                                <p className="font-medium text-[hsl(var(--foreground))]">
                                  {fine.member_name}
                                </p>
                                {fine.membership_number && (
                                  <p className="text-xs text-[hsl(var(--muted-foreground))]">
                                    #{fine.membership_number}
                                  </p>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-2">
                              <BookOpen className="h-4 w-4 text-[var(--brand-gold)] shrink-0" />
                              <div>
                                <p className="font-medium text-[hsl(var(--foreground))] line-clamp-1">
                                  {fine.book_title}
                                </p>
                                <p className="text-xs text-[hsl(var(--muted-foreground))]">
                                  {fine.book_author}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-4">
                            <span className="font-semibold text-[var(--brand-red)]">
                              {fine.overdue_days} day{fine.overdue_days !== 1 ? "s" : ""}
                            </span>
                          </td>
                          <td className="px-5 py-4">
                            <span className="font-bold text-[hsl(var(--foreground))]">
                              {formatCurrency(Number(fine.total_amount))}
                            </span>
                            <p className="text-xs text-[hsl(var(--muted-foreground))]">
                              PKR {fine.fine_per_day}/day
                            </p>
                          </td>
                          <td className="px-5 py-4">
                            <StatusBadge status={fine.status} />
                            {fine.status === "paid" && fine.paid_at && (
                              <p className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">
                                {formatDate(fine.paid_at)}
                              </p>
                            )}
                            {fine.status === "waived" && fine.waive_reason && (
                              <p className="mt-1 text-xs text-[hsl(var(--muted-foreground))] line-clamp-1">
                                {fine.waive_reason}
                              </p>
                            )}
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-1.5 text-[hsl(var(--muted-foreground))]">
                              <Calendar className="h-3.5 w-3.5" />
                              <span className="text-xs">{formatDate(fine.due_date)}</span>
                            </div>
                          </td>
                          {isAdmin && (
                            <td className="px-5 py-4 text-right">
                              {fine.status === "pending" && (
                                <div className="flex items-center justify-end gap-2">
                                  <button
                                    onClick={() => markAsPaid(fine.id)}
                                    disabled={actionLoading === fine.id}
                                    className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50 transition-all"
                                  >
                                    {actionLoading === fine.id ? "..." : "Mark Paid"}
                                  </button>
                                  <button
                                    onClick={() =>
                                      setWaiveModal({ open: true, fineId: fine.id, reason: "" })
                                    }
                                    disabled={actionLoading === fine.id}
                                    className="rounded-lg border border-[hsl(var(--border))] px-3 py-1.5 text-xs font-semibold text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))] disabled:opacity-50 transition-all"
                                  >
                                    Waive
                                  </button>
                                </div>
                              )}
                              {fine.status !== "pending" && (
                                <span className="text-xs text-[hsl(var(--muted-foreground))]">
                                  {getFineStatusLabel(fine.status)}
                                </span>
                              )}
                            </td>
                          )}
                        </motion.tr>
                      ))}
                    </motion.tbody>
                  </table>
                </div>

                {/* Mobile cards */}
                <div className="md:hidden divide-y divide-[hsl(var(--border))]">
                  {filtered.map((fine, i) => (
                    <Reveal key={fine.id} delay={i * 0.04}>
                      <div className="p-4 space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="font-semibold text-[hsl(var(--foreground))]">
                              {fine.member_name}
                            </p>
                            {fine.membership_number && (
                              <p className="text-xs text-[hsl(var(--muted-foreground))]">
                                #{fine.membership_number}
                              </p>
                            )}
                          </div>
                          <StatusBadge status={fine.status} />
                        </div>
                        <div className="flex items-center gap-2 text-sm text-[hsl(var(--muted-foreground))]">
                          <BookOpen className="h-4 w-4 text-[var(--brand-gold)]" />
                          <span className="line-clamp-1">{fine.book_title}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-[hsl(var(--muted-foreground))]">
                            {fine.overdue_days} day{fine.overdue_days !== 1 ? "s" : ""} overdue
                          </span>
                          <span className="font-bold text-[hsl(var(--foreground))]">
                            {formatCurrency(Number(fine.total_amount))}
                          </span>
                        </div>
                        {isAdmin && fine.status === "pending" && (
                          <div className="flex gap-2 pt-1">
                            <button
                              onClick={() => markAsPaid(fine.id)}
                              disabled={actionLoading === fine.id}
                              className="flex-1 rounded-xl bg-emerald-600 py-2 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50 transition-all"
                            >
                              Mark Paid
                            </button>
                            <button
                              onClick={() =>
                                setWaiveModal({ open: true, fineId: fine.id, reason: "" })
                              }
                              disabled={actionLoading === fine.id}
                              className="flex-1 rounded-xl border border-[hsl(var(--border))] py-2 text-xs font-semibold text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))] disabled:opacity-50 transition-all"
                            >
                              Waive
                            </button>
                          </div>
                        )}
                      </div>
                    </Reveal>
                  ))}
                </div>
              </>
            )}
          </div>
        </Reveal>

        {/* ── Summary footer ───────────────────────────────────────────────────── */}
        {!loading && filtered.length > 0 && (
          <Reveal className="mt-4">
            <p className="text-xs text-[hsl(var(--muted-foreground))] text-right">
              Showing {filtered.length} of {fines.length} fine{fines.length !== 1 ? "s" : ""}
            </p>
          </Reveal>
        )}
      </div>

      {/* ── Waive Modal ──────────────────────────────────────────────────────────── */}
      {waiveModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 16 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="w-full max-w-md rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6 shadow-[0_8px_40px_-8px_rgba(0,0,0,0.25)]"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-[hsl(var(--foreground))]">Waive Fine</h2>
              <button
                onClick={() => setWaiveModal({ open: false, fineId: "", reason: "" })}
                className="rounded-lg p-1.5 hover:bg-[hsl(var(--muted))] transition-colors"
              >
                <X className="h-4 w-4 text-[hsl(var(--muted-foreground))]" />
              </button>
            </div>
            <p className="text-sm text-[hsl(var(--muted-foreground))] mb-4">
              Provide a reason for waiving this fine. This action cannot be undone.
            </p>
            <textarea
              value={waiveModal.reason}
              onChange={(e) => setWaiveModal((prev) => ({ ...prev, reason: e.target.value }))}
              placeholder="e.g. Medical emergency, administrative error..."
              rows={3}
              className="w-full rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-4 py-3 text-sm text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground))] focus:outline-none focus:ring-2 focus:ring-[var(--brand-navy)]/30 resize-none"
            />
            <div className="flex gap-3 mt-5">
              <button
                onClick={() => setWaiveModal({ open: false, fineId: "", reason: "" })}
                className="flex-1 rounded-xl border border-[hsl(var(--border))] py-2.5 text-sm font-semibold text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))] transition-all"
              >
                Cancel
              </button>
              <button
                onClick={waiveFine}
                disabled={actionLoading === waiveModal.fineId}
                className="flex-1 rounded-xl bg-[var(--brand-navy)] py-2.5 text-sm font-semibold text-white hover:bg-[var(--brand-navy)]/90 disabled:opacity-50 transition-all"
              >
                {actionLoading === waiveModal.fineId ? "Waiving..." : "Confirm Waive"}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </main>
  );
}