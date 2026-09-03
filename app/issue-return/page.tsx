"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, RotateCcw, Search, CheckCircle, Clock, AlertTriangle, User, Calendar, Hash, ChevronDown, ChevronUp, RefreshCw, X, Plus, Filter } from 'lucide-react';
import { Reveal } from "@/components/Reveal";
import { fadeInUp, staggerContainer, scaleIn } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

// ─── Local helpers (NOT imported from @/lib/data) ──────────────────────────────
const FINE_RATE_PER_DAY = 5; // PKR per overdue day
const DEFAULT_ISSUE_DAYS = 14;

function getIssueStatusLabel(status: string): string {
  switch (status) {
    case "issued": return "Issued";
    case "returned": return "Returned";
    case "overdue": return "Overdue";
    default: return status;
  }
}

function calculateOverdueDays(dueDateStr: string, returnDateStr?: string | null): number {
  const due = new Date(dueDateStr);
  const ref = returnDateStr ? new Date(returnDateStr) : new Date();
  const diffMs = ref.getTime() - due.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-PK", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

// ─── Types ─────────────────────────────────────────────────────────────────────
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
  available_copies: number;
  total_copies: number;
  shelf_location: string | null;
  category: string | null;
}

interface UserRow {
  id: string;
  full_name: string;
  email: string;
  membership_number: string | null;
  role: string;
}

interface EnrichedIssue extends BookIssueRow {
  book?: BookRow;
  member?: UserRow;
  overdue_days: number;
  estimated_fine: number;
}

type TabType = "active" | "history" | "issue";
type StatusFilter = "all" | "issued" | "overdue" | "returned";

// ─── Status badge ──────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const cfg: Record<string, { label: string; cls: string }> = {
    issued: { label: "Issued", cls: "bg-blue-100 text-blue-700 border-blue-200" },
    returned: { label: "Returned", cls: "bg-green-100 text-green-700 border-green-200" },
    overdue: { label: "Overdue", cls: "bg-red-100 text-red-700 border-red-200" },
  };
  const c = cfg[status] ?? { label: status, cls: "bg-gray-100 text-gray-600 border-gray-200" };
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium", c.cls)}>
      {status === "issued" && <Clock className="h-3 w-3" />}
      {status === "returned" && <CheckCircle className="h-3 w-3" />}
      {status === "overdue" && <AlertTriangle className="h-3 w-3" />}
      {c.label}
    </span>
  );
}

// ─── Issue Form ────────────────────────────────────────────────────────────────
function IssueForm({
  books,
  members,
  currentUserId,
  onSuccess,
}: {
  books: BookRow[];
  members: UserRow[];
  currentUserId: string;
  onSuccess: () => void;
}) {
  const supabase = createClient();
  const [bookId, setBookId] = useState("");
  const [userId, setUserId] = useState("");
  const [remarks, setRemarks] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const selectedBook = books.find((b) => b.id === bookId);

  const issueDate = new Date();
  const dueDate = new Date(issueDate);
  dueDate.setDate(dueDate.getDate() + DEFAULT_ISSUE_DAYS);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!bookId || !userId) { setError("Please select both a book and a member."); return; }
    if (!selectedBook || selectedBook.available_copies < 1) { setError("Selected book has no available copies."); return; }
    setLoading(true);
    setError(null);

    const { error: insertErr } = await supabase.from("book_issues").insert({
      book_id: bookId,
      user_id: userId,
      issued_by: currentUserId,
      issue_date: issueDate.toISOString(),
      due_date: dueDate.toISOString(),
      status: "issued",
      remarks: remarks || null,
    });

    if (insertErr) {
      setError(insertErr.message);
      setLoading(false);
      return;
    }

    // Decrement available_copies
    await supabase
      .from("books")
      .update({ available_copies: selectedBook.available_copies - 1 })
      .eq("id", bookId);

    // Log activity
    await supabase.from("activity_logs").insert({
      actor_id: currentUserId,
      action_type: "book_issued",
      entity_type: "book_issues",
      description: `Book "${selectedBook.title}" issued to member.`,
    });

    setSuccess(true);
    setBookId("");
    setUserId("");
    setRemarks("");
    setLoading(false);
    setTimeout(() => { setSuccess(false); onSuccess(); }, 1500);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertTriangle className="h-4 w-4 shrink-0" /> {error}
        </div>
      )}
      {success && (
        <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          <CheckCircle className="h-4 w-4 shrink-0" /> Book issued successfully.
        </div>
      )}

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-[var(--lms-navy)]">
            Select Book <span className="text-red-500">*</span>
          </label>
          <select
            value={bookId}
            onChange={(e) => setBookId(e.target.value)}
            className="w-full rounded-lg border border-[var(--lms-border)] bg-white px-3 py-2.5 text-sm text-[var(--lms-navy)] focus:border-[var(--lms-gold)] focus:outline-none focus:ring-2 focus:ring-[var(--lms-gold)]/20"
          >
            <option value="">-- Choose a book --</option>
            {books.map((b) => (
              <option key={b.id} value={b.id} disabled={b.available_copies < 1}>
                {b.title} — {b.author} {b.available_copies < 1 ? "(Unavailable)" : `(${b.available_copies} left)`}
              </option>
            ))}
          </select>
          {selectedBook && (
            <p className="mt-1 text-xs text-gray-500">
              Shelf: {selectedBook.shelf_location ?? "N/A"} · ISBN: {selectedBook.isbn ?? "N/A"}
            </p>
          )}
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-[var(--lms-navy)]">
            Select Member <span className="text-red-500">*</span>
          </label>
          <select
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            className="w-full rounded-lg border border-[var(--lms-border)] bg-white px-3 py-2.5 text-sm text-[var(--lms-navy)] focus:border-[var(--lms-gold)] focus:outline-none focus:ring-2 focus:ring-[var(--lms-gold)]/20"
          >
            <option value="">-- Choose a member --</option>
            {members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.full_name} ({m.membership_number ?? m.email})
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-[var(--lms-navy)]">Issue Date</label>
          <div className="flex items-center gap-2 rounded-lg border border-[var(--lms-border)] bg-gray-50 px-3 py-2.5 text-sm text-gray-600">
            <Calendar className="h-4 w-4 text-[var(--lms-gold)]" />
            {issueDate.toLocaleDateString("en-PK", { year: "numeric", month: "short", day: "numeric" })}
          </div>
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-[var(--lms-navy)]">Due Date (14 days)</label>
          <div className="flex items-center gap-2 rounded-lg border border-[var(--lms-border)] bg-gray-50 px-3 py-2.5 text-sm text-gray-600">
            <Calendar className="h-4 w-4 text-[var(--lms-gold)]" />
            {dueDate.toLocaleDateString("en-PK", { year: "numeric", month: "short", day: "numeric" })}
          </div>
        </div>
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-[var(--lms-navy)]">Remarks (optional)</label>
        <textarea
          value={remarks}
          onChange={(e) => setRemarks(e.target.value)}
          rows={2}
          placeholder="Any notes about this issue..."
          className="w-full rounded-lg border border-[var(--lms-border)] bg-white px-3 py-2.5 text-sm text-[var(--lms-navy)] placeholder-gray-400 focus:border-[var(--lms-gold)] focus:outline-none focus:ring-2 focus:ring-[var(--lms-gold)]/20"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="flex items-center gap-2 rounded-lg bg-[var(--lms-navy)] px-6 py-2.5 text-sm font-semibold text-white transition-all duration-200 hover:bg-[var(--lms-navy)]/90 disabled:opacity-60"
      >
        {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
        {loading ? "Issuing..." : "Issue Book"}
      </button>
    </form>
  );
}

// ─── Return Modal ──────────────────────────────────────────────────────────────
function ReturnModal({
  issue,
  currentUserId,
  onClose,
  onSuccess,
}: {
  issue: EnrichedIssue;
  currentUserId: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const overdueDays = calculateOverdueDays(issue.due_date);
  const fine = overdueDays * FINE_RATE_PER_DAY;

  async function handleReturn() {
    setLoading(true);
    setError(null);
    const returnDate = new Date().toISOString();

    const { error: updateErr } = await supabase
      .from("book_issues")
      .update({ status: overdueDays > 0 ? "overdue" : "returned", return_date: returnDate })
      .eq("id", issue.id);

    if (updateErr) { setError(updateErr.message); setLoading(false); return; }

    // Restore available_copies
    if (issue.book) {
      await supabase
        .from("books")
        .update({ available_copies: issue.book.available_copies + 1 })
        .eq("id", issue.book_id);
    }

    // Create fine if overdue
    if (overdueDays > 0) {
      await supabase.from("fines").insert({
        issue_id: issue.id,
        user_id: issue.user_id,
        overdue_days: overdueDays,
        fine_per_day: FINE_RATE_PER_DAY,
        total_amount: fine,
        status: "pending",
      });
    }

    // Log activity
    await supabase.from("activity_logs").insert({
      actor_id: currentUserId,
      action_type: "book_returned",
      entity_type: "book_issues",
      entity_id: issue.id,
      description: `Book "${issue.book?.title ?? issue.book_id}" returned.${overdueDays > 0 ? ` Fine: PKR ${fine}.` : ""}`,
    });

    setLoading(false);
    onSuccess();
    onClose();
  }

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
        className="relative z-10 w-full max-w-md rounded-2xl border border-[var(--lms-border)] bg-white p-6 shadow-[0_8px_40px_-8px_rgba(0,0,0,0.18)]"
      >
        <button onClick={onClose} className="absolute right-4 top-4 rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
          <X className="h-4 w-4" />
        </button>
        <h3 className="text-lg font-bold text-[var(--lms-navy)]">Return Book</h3>
        <p className="mt-1 text-sm text-gray-500">Confirm the return of the following book.</p>

        <div className="mt-4 space-y-3 rounded-xl border border-[var(--lms-border)] bg-[var(--lms-cream)] p-4">
          <div className="flex items-start gap-3">
            <BookOpen className="mt-0.5 h-5 w-5 shrink-0 text-[var(--lms-gold)]" />
            <div>
              <p className="font-semibold text-[var(--lms-navy)]">{issue.book?.title ?? "Unknown Book"}</p>
              <p className="text-sm text-gray-500">{issue.book?.author}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <User className="h-4 w-4 shrink-0 text-[var(--lms-gold)]" />
            <p className="text-sm text-[var(--lms-navy)]">{issue.member?.full_name ?? "Unknown Member"}</p>
          </div>
          <div className="flex items-center gap-3">
            <Calendar className="h-4 w-4 shrink-0 text-[var(--lms-gold)]" />
            <p className="text-sm text-[var(--lms-navy)]">Due: {formatDate(issue.due_date)}</p>
          </div>
        </div>

        {overdueDays > 0 ? (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4">
            <div className="flex items-center gap-2 text-red-700">
              <AlertTriangle className="h-4 w-4" />
              <span className="font-semibold">Overdue by {overdueDays} day{overdueDays !== 1 ? "s" : ""}</span>
            </div>
            <p className="mt-1 text-sm text-red-600">
              A fine of <strong>PKR {fine.toLocaleString("en-PK")}</strong> will be generated at PKR {FINE_RATE_PER_DAY}/day.
            </p>
          </div>
        ) : (
          <div className="mt-4 rounded-xl border border-green-200 bg-green-50 p-4">
            <div className="flex items-center gap-2 text-green-700">
              <CheckCircle className="h-4 w-4" />
              <span className="font-semibold">Returned on time. No fine applicable.</span>
            </div>
          </div>
        )}

        {error && (
          <p className="mt-3 text-sm text-red-600">{error}</p>
        )}

        <div className="mt-5 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 rounded-lg border border-[var(--lms-border)] px-4 py-2.5 text-sm font-medium text-gray-600 transition hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleReturn}
            disabled={loading}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-[var(--lms-navy)] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[var(--lms-navy)]/90 disabled:opacity-60"
          >
            {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4" />}
            {loading ? "Processing..." : "Confirm Return"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Transaction Row ───────────────────────────────────────────────────────────
function TransactionRow({
  issue,
  onReturn,
  expanded,
  onToggle,
}: {
  issue: EnrichedIssue;
  onReturn: (issue: EnrichedIssue) => void;
  expanded: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="rounded-xl border border-[var(--lms-border)] bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)] transition-all duration-200 hover:shadow-[0_4px_16px_-4px_rgba(0,0,0,0.1)]">
      <div
        className="flex cursor-pointer items-center gap-4 p-4"
        onClick={onToggle}
      >
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--lms-navy)]/8">
          <BookOpen className="h-5 w-5 text-[var(--lms-navy)]" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold text-[var(--lms-navy)]">
            {issue.book?.title ?? "Unknown Book"}
          </p>
          <p className="truncate text-sm text-gray-500">
            {issue.book?.author} · {issue.member?.full_name ?? "Unknown Member"}
          </p>
        </div>
        <div className="hidden items-center gap-3 sm:flex">
          <StatusBadge status={issue.status} />
          {issue.overdue_days > 0 && issue.status !== "returned" && (
            <span className="rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-700">
              PKR {issue.estimated_fine.toLocaleString("en-PK")} fine
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {issue.status === "issued" || issue.status === "overdue" ? (
            <button
              onClick={(e) => { e.stopPropagation(); onReturn(issue); }}
              className="hidden rounded-lg border border-[var(--lms-gold)] px-3 py-1.5 text-xs font-semibold text-[var(--lms-gold)] transition hover:bg-[var(--lms-gold)] hover:text-white sm:block"
            >
              Return
            </button>
          ) : null}
          {expanded ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
        </div>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="overflow-hidden"
          >
            <div className="border-t border-[var(--lms-border)] bg-[var(--lms-cream)] px-4 py-4">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Issue Date</p>
                  <p className="mt-0.5 text-sm font-medium text-[var(--lms-navy)]">{formatDate(issue.issue_date)}</p>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Due Date</p>
                  <p className="mt-0.5 text-sm font-medium text-[var(--lms-navy)]">{formatDate(issue.due_date)}</p>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Return Date</p>
                  <p className="mt-0.5 text-sm font-medium text-[var(--lms-navy)]">
                    {issue.return_date ? formatDate(issue.return_date) : "Not returned"}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Membership No.</p>
                  <p className="mt-0.5 text-sm font-medium text-[var(--lms-navy)]">
                    {issue.member?.membership_number ?? "N/A"}
                  </p>
                </div>
                {issue.remarks && (
                  <div className="sm:col-span-2 lg:col-span-4">
                    <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Remarks</p>
                    <p className="mt-0.5 text-sm text-gray-600">{issue.remarks}</p>
                  </div>
                )}
              </div>
              <div className="mt-3 flex items-center gap-3 sm:hidden">
                <StatusBadge status={issue.status} />
                {(issue.status === "issued" || issue.status === "overdue") && (
                  <button
                    onClick={() => onReturn(issue)}
                    className="rounded-lg border border-[var(--lms-gold)] px-3 py-1.5 text-xs font-semibold text-[var(--lms-gold)] transition hover:bg-[var(--lms-gold)] hover:text-white"
                  >
                    Return Book
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────
export default function IssueReturnPage() {
  const supabase = createClient();

  const [activeTab, setActiveTab] = useState<TabType>("active");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [issues, setIssues] = useState<EnrichedIssue[]>([]);
  const [books, setBooks] = useState<BookRow[]>([]);
  const [members, setMembers] = useState<UserRow[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [returnTarget, setReturnTarget] = useState<EnrichedIssue | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (user) setCurrentUserId(user.id);

    const [issuesRes, booksRes, membersRes] = await Promise.all([
      supabase.from("book_issues").select("*").order("created_at", { ascending: false }),
      supabase.from("books").select("id, title, author, isbn, available_copies, total_copies, shelf_location, category"),
      supabase.from("users").select("id, full_name, email, membership_number, role"),
    ]);

    const bookMap = new Map<string, BookRow>((booksRes.data ?? []).map((b) => [b.id, b]));
    const memberMap = new Map<string, UserRow>((membersRes.data ?? []).map((m) => [m.id, m]));

    const enriched: EnrichedIssue[] = (issuesRes.data ?? []).map((issue) => {
      const overdueDays = issue.status !== "returned" ? calculateOverdueDays(issue.due_date) : 0;
      return {
        ...issue,
        book: bookMap.get(issue.book_id),
        member: memberMap.get(issue.user_id),
        overdue_days: overdueDays,
        estimated_fine: overdueDays * FINE_RATE_PER_DAY,
      };
    });

    setIssues(enriched);
    setBooks(booksRes.data ?? []);
    setMembers((membersRes.data ?? []).filter((m) => m.role === "member"));
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchData();

    const channel = supabase
      .channel("book_issues_realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "book_issues" }, () => {
        fetchData();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetchData, supabase]);

  // Derived stats
  const totalIssued = issues.filter((i) => i.status === "issued").length;
  const totalOverdue = issues.filter((i) => i.status === "overdue").length;
  const totalReturned = issues.filter((i) => i.status === "returned").length;
  const totalFinesPending = issues
    .filter((i) => i.status !== "returned" && i.overdue_days > 0)
    .reduce((sum, i) => sum + i.estimated_fine, 0);

  // Filtered list
  const filteredIssues = issues.filter((issue) => {
    const matchesTab =
      activeTab === "history"
        ? issue.status === "returned"
        : issue.status === "issued" || issue.status === "overdue";
    const matchesStatus = statusFilter === "all" || issue.status === statusFilter;
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      !q ||
      issue.book?.title.toLowerCase().includes(q) ||
      issue.book?.author.toLowerCase().includes(q) ||
      issue.member?.full_name.toLowerCase().includes(q) ||
      issue.member?.membership_number?.toLowerCase().includes(q) ||
      issue.book?.isbn?.toLowerCase().includes(q);
    return matchesTab && matchesStatus && matchesSearch;
  });

  const tabs: { id: TabType; label: string; count?: number }[] = [
    { id: "active", label: "Active Issues", count: totalIssued + totalOverdue },
    { id: "history", label: "Return History", count: totalReturned },
    { id: "issue", label: "Issue a Book" },
  ];

  return (
    <div className="min-h-screen bg-[var(--lms-cream)]">
      {/* Page Header */}
      <Reveal>
        <div className="border-b border-[var(--lms-border)] bg-white">
          <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-[var(--lms-navy)] sm:text-3xl">
                  Issue &amp; Return
                </h1>
                <p className="mt-1 text-sm text-gray-500">
                  Manage book loans, process returns, and track overdue transactions.
                </p>
              </div>
              <button
                onClick={fetchData}
                className="flex items-center gap-2 self-start rounded-lg border border-[var(--lms-border)] bg-white px-4 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-50 sm:self-auto"
              >
                <RefreshCw className="h-4 w-4" />
                Refresh
              </button>
            </div>
          </div>
        </div>
      </Reveal>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Stats Row */}
        <Reveal>
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4"
          >
            {[
              { label: "Currently Issued", value: totalIssued, icon: BookOpen, color: "text-blue-600", bg: "bg-blue-50" },
              { label: "Overdue Books", value: totalOverdue, icon: AlertTriangle, color: "text-red-600", bg: "bg-red-50" },
              { label: "Returned Today", value: totalReturned, icon: CheckCircle, color: "text-green-600", bg: "bg-green-50" },
              { label: "Pending Fines (PKR)", value: totalFinesPending.toLocaleString("en-PK"), icon: Hash, color: "text-[var(--lms-gold)]", bg: "bg-amber-50" },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                variants={fadeInUp}
                className="rounded-xl border border-[var(--lms-border)] bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)]"
              >
                <div className={cn("mb-3 flex h-10 w-10 items-center justify-center rounded-lg", stat.bg)}>
                  <stat.icon className={cn("h-5 w-5", stat.color)} />
                </div>
                <p className="text-2xl font-bold text-[var(--lms-navy)]">{loading ? "—" : stat.value}</p>
                <p className="mt-0.5 text-xs text-gray-500">{stat.label}</p>
              </motion.div>
            ))}
          </motion.div>
        </Reveal>

        {/* Tabs */}
        <Reveal>
          <div className="mb-6 flex gap-1 rounded-xl border border-[var(--lms-border)] bg-white p-1 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => { setActiveTab(tab.id); setStatusFilter("all"); setSearchQuery(""); }}
                className={cn(
                  "flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                  activeTab === tab.id
                    ? "bg-[var(--lms-navy)] text-white shadow-sm"
                    : "text-gray-500 hover:bg-gray-50 hover:text-[var(--lms-navy)]"
                )}
              >
                {tab.label}
                {tab.count !== undefined && (
                  <span className={cn(
                    "rounded-full px-2 py-0.5 text-xs font-semibold",
                    activeTab === tab.id ? "bg-white/20 text-white" : "bg-gray-100 text-gray-600"
                  )}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </Reveal>

        {/* Issue Form Tab */}
        {activeTab === "issue" && (
          <Reveal>
            <div className="rounded-2xl border border-[var(--lms-border)] bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
              <div className="mb-6 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--lms-navy)]/8">
                  <Plus className="h-5 w-5 text-[var(--lms-navy)]" />
                </div>
                <div>
                  <h2 className="font-bold text-[var(--lms-navy)]">Issue a New Book</h2>
                  <p className="text-sm text-gray-500">Assign a book to a library member for {DEFAULT_ISSUE_DAYS} days.</p>
                </div>
              </div>
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <RefreshCw className="h-6 w-6 animate-spin text-[var(--lms-gold)]" />
                </div>
              ) : (
                <IssueForm
                  books={books}
                  members={members}
                  currentUserId={currentUserId}
                  onSuccess={fetchData}
                />
              )}
            </div>
          </Reveal>
        )}

        {/* Active / History Tabs */}
        {activeTab !== "issue" && (
          <>
            {/* Filters */}
            <Reveal>
              <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by book title, author, member name, or ISBN..."
                    className="w-full rounded-lg border border-[var(--lms-border)] bg-white py-2.5 pl-9 pr-4 text-sm text-[var(--lms-navy)] placeholder-gray-400 focus:border-[var(--lms-gold)] focus:outline-none focus:ring-2 focus:ring-[var(--lms-gold)]/20"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-gray-400" />
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
                    className="rounded-lg border border-[var(--lms-border)] bg-white px-3 py-2.5 text-sm text-[var(--lms-navy)] focus:border-[var(--lms-gold)] focus:outline-none focus:ring-2 focus:ring-[var(--lms-gold)]/20"
                  >
                    <option value="all">All Statuses</option>
                    <option value="issued">Issued</option>
                    <option value="overdue">Overdue</option>
                    <option value="returned">Returned</option>
                  </select>
                </div>
              </div>
            </Reveal>

            {/* Transaction List */}
            <Reveal>
              {loading ? (
                <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-[var(--lms-border)] bg-white py-20">
                  <RefreshCw className="h-8 w-8 animate-spin text-[var(--lms-gold)]" />
                  <p className="text-sm text-gray-500">Loading transactions...</p>
                </div>
              ) : filteredIssues.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-[var(--lms-border)] bg-white py-20">
                  <BookOpen className="h-10 w-10 text-gray-300" />
                  <p className="font-medium text-gray-500">No transactions found</p>
                  <p className="text-sm text-gray-400">
                    {searchQuery ? "Try adjusting your search or filters." : activeTab === "active" ? "No active issues at the moment." : "No return history yet."}
                  </p>
                </div>
              ) : (
                <motion.div
                  variants={staggerContainer}
                  initial="hidden"
                  animate="visible"
                  className="space-y-3"
                >
                  {filteredIssues.map((issue) => (
                    <motion.div key={issue.id} variants={scaleIn}>
                      <TransactionRow
                        issue={issue}
                        onReturn={setReturnTarget}
                        expanded={expandedId === issue.id}
                        onToggle={() => setExpandedId(expandedId === issue.id ? null : issue.id)}
                      />
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </Reveal>

            {/* Summary footer */}
            {!loading && filteredIssues.length > 0 && (
              <Reveal>
                <p className="mt-4 text-center text-xs text-gray-400">
                  Showing {filteredIssues.length} of {issues.length} total transaction{issues.length !== 1 ? "s" : ""}
                </p>
              </Reveal>
            )}
          </>
        )}
      </div>

      {/* Return Modal */}
      <AnimatePresence>
        {returnTarget && (
          <ReturnModal
            issue={returnTarget}
            currentUserId={currentUserId}
            onClose={() => setReturnTarget(null)}
            onSuccess={fetchData}
          />
        )}
      </AnimatePresence>
    </div>
  );
}