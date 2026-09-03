"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, RotateCcw, Search, User, Calendar, CheckCircle, AlertCircle, Clock, ArrowRight, Hash, FileText, RefreshCw, BookMarked, DollarSign, ChevronRight, X } from 'lucide-react';
import { Reveal } from "@/components/Reveal";
import { staggerContainer, fadeInUp, scaleIn } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { FINE_RATE_PER_DAY, DEFAULT_ISSUE_DAYS } from "@/lib/data";

// ─── Types ──────────────────────────────────────────────────────────────────────

interface BookRow {
  id: string;
  title: string;
  author: string;
  isbn: string | null;
  category: string | null;
  available_copies: number;
  total_copies: number;
  shelf_location: string | null;
}

interface UserRow {
  id: string;
  full_name: string;
  email: string;
  membership_number: string | null;
  role: string;
  is_active: boolean;
}

interface IssueRow {
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
}

interface EnrichedIssue extends IssueRow {
  book?: BookRow;
  member?: UserRow;
}

interface ReturnLookup {
  issue: IssueRow;
  book: BookRow | null;
  member: UserRow | null;
  overdueDays: number;
  estimatedFine: number;
}

// ─── Helpers ────────────────────────────────────────────────────────────────────

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function calcOverdueDays(dueDateStr: string): number {
  const due = new Date(dueDateStr);
  const now = new Date();
  const diff = now.getTime() - due.getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

function addDays(date: Date, days: number): string {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}

// ─── Status Badge ────────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { cls: string; icon: React.ReactNode; label: string }> = {
    issued: {
      cls: "bg-blue-50 text-blue-700 border-blue-200",
      icon: <BookMarked className="h-3 w-3" />,
      label: "Issued",
    },
    returned: {
      cls: "bg-emerald-50 text-emerald-700 border-emerald-200",
      icon: <CheckCircle className="h-3 w-3" />,
      label: "Returned",
    },
    overdue: {
      cls: "bg-red-50 text-red-700 border-red-200",
      icon: <AlertCircle className="h-3 w-3" />,
      label: "Overdue",
    },
  };
  const entry = map[status] ?? {
    cls: "bg-gray-50 text-gray-600 border-gray-200",
    icon: <Clock className="h-3 w-3" />,
    label: status,
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold",
        entry.cls
      )}
    >
      {entry.icon}
      {entry.label}
    </span>
  );
}

// ─── Field wrapper ───────────────────────────────────────────────────────────────

function Field({
  label,
  icon: Icon,
  children,
  required,
}: {
  label: string;
  icon?: React.ElementType;
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="flex items-center gap-1.5 text-sm font-medium text-[var(--foreground)]">
        {Icon && <Icon className="h-3.5 w-3.5 text-[var(--accent)]" />}
        {label}
        {required && <span className="text-red-500">*</span>}
      </label>
      {children}
    </div>
  );
}

const inputCls =
  "w-full rounded-xl border border-[var(--border)] bg-white px-3.5 py-2.5 text-sm text-[var(--foreground)] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/40 focus:border-[var(--accent)] transition-all duration-200 shadow-sm";

// ─── Main Page ───────────────────────────────────────────────────────────────────

export default function IssueReturnPage() {
  const supabase = createClient();

  // ── Issue form state ──
  const [issueBookId, setIssueBookId] = useState("");
  const [issueMemberId, setIssueMemberId] = useState("");
  const [issueRemarks, setIssueRemarks] = useState("");
  const [issueLoading, setIssueLoading] = useState(false);
  const [issueError, setIssueError] = useState<string | null>(null);
  const [issueSuccess, setIssueSuccess] = useState<string | null>(null);

  // Book/member search for issue
  const [bookSearch, setBookSearch] = useState("");
  const [bookResults, setBookResults] = useState<BookRow[]>([]);
  const [selectedBook, setSelectedBook] = useState<BookRow | null>(null);
  const [memberSearch, setMemberSearch] = useState("");
  const [memberResults, setMemberResults] = useState<UserRow[]>([]);
  const [selectedMember, setSelectedMember] = useState<UserRow | null>(null);

  // ── Return form state ──
  const [returnIssueId, setReturnIssueId] = useState("");
  const [returnLookup, setReturnLookup] = useState<ReturnLookup | null>(null);
  const [returnLoading, setReturnLoading] = useState(false);
  const [returnError, setReturnError] = useState<string | null>(null);
  const [returnSuccess, setReturnSuccess] = useState<string | null>(null);
  const [confirmReturn, setConfirmReturn] = useState(false);

  // ── Transactions table ──
  const [transactions, setTransactions] = useState<EnrichedIssue[]>([]);
  const [txLoading, setTxLoading] = useState(true);
  const [txFilter, setTxFilter] = useState<"all" | "issued" | "returned" | "overdue">("all");

  // ── Current user ──
  const [currentUser, setCurrentUser] = useState<{ id: string; role: string } | null>(null);

  // ─── Load current user ───────────────────────────────────────────────────────

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session?.user) return;
      const { data: profile } = await supabase
        .from("users")
        .select("id, role")
        .eq("id", session.user.id)
        .single();
      if (profile) setCurrentUser({ id: profile.id, role: profile.role });
    });
  }, []);

  // ─── Load transactions ───────────────────────────────────────────────────────

  const loadTransactions = useCallback(async () => {
    setTxLoading(true);
    try {
      const { data: issues } = await supabase
        .from("book_issues")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);

      if (!issues) { setTransactions([]); return; }

      const bookIds = [...new Set(issues.map((i) => i.book_id))];
      const userIds = [...new Set(issues.map((i) => i.user_id))];

      const [{ data: books }, { data: members }] = await Promise.all([
        supabase.from("books").select("id,title,author,isbn,category,shelf_location,available_copies,total_copies").in("id", bookIds),
        supabase.from("users").select("id,full_name,email,membership_number,role,is_active").in("id", userIds),
      ]);

      const bookMap = Object.fromEntries((books ?? []).map((b) => [b.id, b]));
      const memberMap = Object.fromEntries((members ?? []).map((m) => [m.id, m]));

      const enriched: EnrichedIssue[] = issues.map((issue) => ({
        ...issue,
        book: bookMap[issue.book_id],
        member: memberMap[issue.user_id],
      }));

      setTransactions(enriched);
    } catch (err) {
      console.error("Failed to load transactions:", err);
    } finally {
      setTxLoading(false);
    }
  }, []);

  useEffect(() => { loadTransactions(); }, [loadTransactions]);

  // ─── Book search ─────────────────────────────────────────────────────────────

  useEffect(() => {
    if (bookSearch.trim().length < 2) { setBookResults([]); return; }
    const timer = setTimeout(async () => {
      const { data } = await supabase
        .from("books")
        .select("id,title,author,isbn,category,available_copies,total_copies,shelf_location")
        .or(`title.ilike.%${bookSearch}%,author.ilike.%${bookSearch}%,isbn.ilike.%${bookSearch}%`)
        .limit(6);
      setBookResults(data ?? []);
    }, 300);
    return () => clearTimeout(timer);
  }, [bookSearch]);

  // ─── Member search ───────────────────────────────────────────────────────────

  useEffect(() => {
    if (memberSearch.trim().length < 2) { setMemberResults([]); return; }
    const timer = setTimeout(async () => {
      const { data } = await supabase
        .from("users")
        .select("id,full_name,email,membership_number,role,is_active")
        .or(`full_name.ilike.%${memberSearch}%,email.ilike.%${memberSearch}%,membership_number.ilike.%${memberSearch}%`)
        .eq("is_active", true)
        .limit(6);
      setMemberResults(data ?? []);
    }, 300);
    return () => clearTimeout(timer);
  }, [memberSearch]);

  // ─── Issue book ──────────────────────────────────────────────────────────────

  async function handleIssue(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedBook || !selectedMember || !currentUser) {
      setIssueError("Please select a book and a member.");
      return;
    }
    if (selectedBook.available_copies < 1) {
      setIssueError("No copies available for this book.");
      return;
    }
    setIssueLoading(true);
    setIssueError(null);
    setIssueSuccess(null);
    try {
      const today = new Date();
      const dueDate = addDays(today, DEFAULT_ISSUE_DAYS);

      const { error: issueErr } = await supabase.from("book_issues").insert({
        book_id: selectedBook.id,
        user_id: selectedMember.id,
        issued_by: currentUser.id,
        issue_date: today.toISOString().split("T")[0],
        due_date: dueDate,
        status: "issued",
        remarks: issueRemarks || null,
      });

      if (issueErr) throw new Error(issueErr.message);

      await supabase
        .from("books")
        .update({ available_copies: selectedBook.available_copies - 1 })
        .eq("id", selectedBook.id);

      setIssueSuccess(
        `"${selectedBook.title}" issued to ${selectedMember.full_name}. Due: ${formatDate(dueDate)}`
      );
      setSelectedBook(null);
      setSelectedMember(null);
      setBookSearch("");
      setMemberSearch("");
      setIssueRemarks("");
      loadTransactions();
    } catch (err) {
      setIssueError(err instanceof Error ? err.message : "Failed to issue book.");
    } finally {
      setIssueLoading(false);
    }
  }

  // ─── Return lookup ───────────────────────────────────────────────────────────

  async function handleReturnLookup(e: React.FormEvent) {
    e.preventDefault();
    if (!returnIssueId.trim()) { setReturnError("Enter a transaction ID."); return; }
    setReturnLoading(true);
    setReturnError(null);
    setReturnLookup(null);
    setConfirmReturn(false);
    try {
      const { data: issue, error: issueErr } = await supabase
        .from("book_issues")
        .select("*")
        .eq("id", returnIssueId.trim())
        .single();

      if (issueErr || !issue) throw new Error("Transaction not found.");
      if (issue.status === "returned") throw new Error("This book has already been returned.");

      const [{ data: book }, { data: member }] = await Promise.all([
        supabase.from("books").select("id,title,author,isbn,category,available_copies,total_copies,shelf_location").eq("id", issue.book_id).single(),
        supabase.from("users").select("id,full_name,email,membership_number,role,is_active").eq("id", issue.user_id).single(),
      ]);

      const overdueDays = calcOverdueDays(issue.due_date);
      const estimatedFine = overdueDays * FINE_RATE_PER_DAY;

      setReturnLookup({ issue, book: book ?? null, member: member ?? null, overdueDays, estimatedFine });
    } catch (err) {
      setReturnError(err instanceof Error ? err.message : "Lookup failed.");
    } finally {
      setReturnLoading(false);
    }
  }

  // ─── Confirm return ──────────────────────────────────────────────────────────

  async function handleConfirmReturn() {
    if (!returnLookup || !currentUser) return;
    setReturnLoading(true);
    setReturnError(null);
    try {
      const today = new Date().toISOString().split("T")[0];

      const { error: updateErr } = await supabase
        .from("book_issues")
        .update({ status: "returned", return_date: today })
        .eq("id", returnLookup.issue.id);

      if (updateErr) throw new Error(updateErr.message);

      if (returnLookup.book) {
        await supabase
          .from("books")
          .update({ available_copies: returnLookup.book.available_copies + 1 })
          .eq("id", returnLookup.book.id);
      }

      if (returnLookup.overdueDays > 0) {
        await supabase.from("fines").insert({
          issue_id: returnLookup.issue.id,
          user_id: returnLookup.issue.user_id,
          overdue_days: returnLookup.overdueDays,
          fine_per_day: FINE_RATE_PER_DAY,
          total_amount: returnLookup.estimatedFine,
          status: "pending",
        });
      }

      setReturnSuccess(
        `"${returnLookup.book?.title ?? "Book"}" returned successfully.${
          returnLookup.overdueDays > 0
            ? ` Fine of PKR ${returnLookup.estimatedFine} has been recorded.`
            : ""
        }`
      );
      setReturnIssueId("");
      setReturnLookup(null);
      setConfirmReturn(false);
      loadTransactions();
    } catch (err) {
      setReturnError(err instanceof Error ? err.message : "Return failed.");
    } finally {
      setReturnLoading(false);
    }
  }

  // ─── Filtered transactions ───────────────────────────────────────────────────

  const filteredTx = transactions.filter((t) =>
    txFilter === "all" ? true : t.status === txFilter
  );

  const txCounts = {
    all: transactions.length,
    issued: transactions.filter((t) => t.status === "issued").length,
    returned: transactions.filter((t) => t.status === "returned").length,
    overdue: transactions.filter((t) => t.status === "overdue").length,
  };

  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* ── Page Header ── */}
      <div className="relative overflow-hidden bg-[var(--primary)]">
        {/* Decorative background elements */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-[var(--accent)] blur-3xl" />
          <div className="absolute -bottom-16 -left-16 w-64 h-64 rounded-full bg-white blur-3xl" />
        </div>
        <div className="absolute inset-0" style={{ backgroundImage: "radial-gradient(circle at 70% 50%, rgba(200,169,110,0.15) 0%, transparent 60%)" }} />

        <div className="relative container-lms py-12 md:py-16">
          <motion.div
            variants={fadeInUp}
            initial="hidden"
            animate="visible"
            className="max-w-2xl"
          >
            <div className="flex items-center gap-2 mb-4">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--accent)]/20 border border-[var(--accent)]/30 px-3 py-1 text-xs font-semibold text-[var(--accent)] uppercase tracking-wide">
                <BookMarked className="h-3 w-3" />
                Transactions
              </span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight text-balance">
              Issue &amp; Return
            </h1>
            <p className="mt-3 text-white/70 text-base leading-relaxed max-w-lg">
              Issue books to library members and process returns. Overdue fines are calculated automatically at PKR {FINE_RATE_PER_DAY}/day.
            </p>

            {/* Quick stats */}
            <div className="mt-6 flex flex-wrap gap-4">
              {[
                { label: "Active Issues", value: txCounts.issued, icon: BookOpen },
                { label: "Overdue", value: txCounts.overdue, icon: AlertCircle },
                { label: "Returned", value: txCounts.returned, icon: CheckCircle },
              ].map(({ label, value, icon: Icon }) => (
                <div key={label} className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-xl px-4 py-2.5 border border-white/15">
                  <Icon className="h-4 w-4 text-[var(--accent)]" />
                  <span className="text-white font-bold text-lg leading-none">{value}</span>
                  <span className="text-white/60 text-xs">{label}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      {/* ── Main Content ── */}
      <div className="container-lms py-10">
        {/* ── Issue & Return Forms ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">

          {/* ── Issue Form ── */}
          <Reveal>
            <div className="bg-white rounded-2xl border border-[var(--border)] shadow-[0_2px_8px_rgba(30,58,95,0.08),0_8px_24px_rgba(30,58,95,0.06)] overflow-hidden">
              {/* Card header */}
              <div className="px-6 py-4 border-b border-[var(--border)] bg-gradient-to-r from-[var(--primary)]/5 to-transparent flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[var(--primary)] flex items-center justify-center flex-shrink-0">
                  <BookOpen className="h-4.5 w-4.5 text-white" style={{ width: 18, height: 18 }} />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-[var(--foreground)]">Issue a Book</h2>
                  <p className="text-xs text-slate-500">{DEFAULT_ISSUE_DAYS}-day loan period from today</p>
                </div>
              </div>

              <form onSubmit={handleIssue} className="p-6 flex flex-col gap-5">
                {/* Book search */}
                <Field label="Book" icon={BookOpen} required>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                    <input
                      type="text"
                      placeholder="Search by title, author, or ISBN..."
                      value={selectedBook ? selectedBook.title : bookSearch}
                      onChange={(e) => {
                        setSelectedBook(null);
                        setBookSearch(e.target.value);
                      }}
                      className={cn(inputCls, "pl-9")}
                    />
                    {selectedBook && (
                      <button
                        type="button"
                        onClick={() => { setSelectedBook(null); setBookSearch(""); }}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  {/* Book dropdown */}
                  <AnimatePresence>
                    {bookResults.length > 0 && !selectedBook && (
                      <motion.div
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        className="mt-1 rounded-xl border border-[var(--border)] bg-white shadow-lg overflow-hidden z-10 relative"
                      >
                        {bookResults.map((book) => (
                          <button
                            key={book.id}
                            type="button"
                            onClick={() => { setSelectedBook(book); setBookSearch(""); setBookResults([]); }}
                            className="w-full text-left px-4 py-3 hover:bg-[var(--muted)] transition-colors border-b border-[var(--border)] last:border-0 flex items-center justify-between gap-3"
                          >
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-[var(--foreground)] truncate">{book.title}</p>
                              <p className="text-xs text-slate-500 truncate">{book.author}</p>
                            </div>
                            <span className={cn(
                              "flex-shrink-0 text-xs font-semibold rounded-full px-2 py-0.5",
                              book.available_copies > 0
                                ? "bg-emerald-50 text-emerald-700"
                                : "bg-red-50 text-red-600"
                            )}>
                              {book.available_copies > 0 ? `${book.available_copies} avail.` : "None"}
                            </span>
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Selected book preview */}
                  <AnimatePresence>
                    {selectedBook && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.98 }}
                        className="mt-2 rounded-xl border border-[var(--accent)]/30 bg-[var(--accent)]/5 p-3 flex items-start gap-3"
                      >
                        <div className="w-8 h-8 rounded-lg bg-[var(--accent)]/20 flex items-center justify-center flex-shrink-0">
                          <BookOpen className="h-4 w-4 text-[var(--accent)]" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-[var(--foreground)] truncate">{selectedBook.title}</p>
                          <p className="text-xs text-slate-500">{selectedBook.author}</p>
                          <div className="flex items-center gap-2 mt-1">
                            {selectedBook.isbn && <span className="text-xs text-slate-400">ISBN: {selectedBook.isbn}</span>}
                            <span className={cn(
                              "text-xs font-medium rounded-full px-2 py-0.5",
                              selectedBook.available_copies > 0 ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"
                            )}>
                              {selectedBook.available_copies} / {selectedBook.total_copies} available
                            </span>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Field>

                {/* Member search */}
                <Field label="Member" icon={User} required>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                    <input
                      type="text"
                      placeholder="Search by name, email, or membership no..."
                      value={selectedMember ? selectedMember.full_name : memberSearch}
                      onChange={(e) => {
                        setSelectedMember(null);
                        setMemberSearch(e.target.value);
                      }}
                      className={cn(inputCls, "pl-9")}
                    />
                    {selectedMember && (
                      <button
                        type="button"
                        onClick={() => { setSelectedMember(null); setMemberSearch(""); }}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  {/* Member dropdown */}
                  <AnimatePresence>
                    {memberResults.length > 0 && !selectedMember && (
                      <motion.div
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        className="mt-1 rounded-xl border border-[var(--border)] bg-white shadow-lg overflow-hidden z-10 relative"
                      >
                        {memberResults.map((member) => (
                          <button
                            key={member.id}
                            type="button"
                            onClick={() => { setSelectedMember(member); setMemberSearch(""); setMemberResults([]); }}
                            className="w-full text-left px-4 py-3 hover:bg-[var(--muted)] transition-colors border-b border-[var(--border)] last:border-0 flex items-center gap-3"
                          >
                            <div className="w-7 h-7 rounded-full bg-[var(--primary)]/10 flex items-center justify-center flex-shrink-0">
                              <User className="h-3.5 w-3.5 text-[var(--primary)]" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-[var(--foreground)] truncate">{member.full_name}</p>
                              <p className="text-xs text-slate-500 truncate">{member.email}</p>
                            </div>
                            {member.membership_number && (
                              <span className="ml-auto flex-shrink-0 text-xs text-slate-400 font-mono">{member.membership_number}</span>
                            )}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Selected member preview */}
                  <AnimatePresence>
                    {selectedMember && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.98 }}
                        className="mt-2 rounded-xl border border-[var(--primary)]/20 bg-[var(--primary)]/5 p-3 flex items-center gap-3"
                      >
                        <div className="w-8 h-8 rounded-full bg-[var(--primary)]/15 flex items-center justify-center flex-shrink-0">
                          <User className="h-4 w-4 text-[var(--primary)]" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-[var(--foreground)]">{selectedMember.full_name}</p>
                          <p className="text-xs text-slate-500">{selectedMember.email}</p>
                        </div>
                        {selectedMember.membership_number && (
                          <span className="text-xs font-mono text-slate-400 bg-white rounded-lg px-2 py-1 border border-[var(--border)]">
                            {selectedMember.membership_number}
                          </span>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Field>

                {/* Remarks */}
                <Field label="Remarks" icon={FileText}>
                  <textarea
                    rows={2}
                    placeholder="Optional notes about this transaction..."
                    value={issueRemarks}
                    onChange={(e) => setIssueRemarks(e.target.value)}
                    className={cn(inputCls, "resize-none")}
                  />
                </Field>

                {/* Due date preview */}
                <div className="flex items-center gap-2 rounded-xl bg-[var(--muted)] px-4 py-3 border border-[var(--border)]">
                  <Calendar className="h-4 w-4 text-[var(--accent)] flex-shrink-0" />
                  <span className="text-sm text-slate-600">
                    Due date: <span className="font-semibold text-[var(--foreground)]">{formatDate(addDays(new Date(), DEFAULT_ISSUE_DAYS))}</span>
                    <span className="text-slate-400 ml-1">({DEFAULT_ISSUE_DAYS} days from today)</span>
                  </span>
                </div>

                {/* Feedback */}
                <AnimatePresence>
                  {issueError && (
                    <motion.div
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      className="flex items-start gap-2 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700"
                    >
                      <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                      {issueError}
                    </motion.div>
                  )}
                  {issueSuccess && (
                    <motion.div
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      className="flex items-start gap-2 rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm text-emerald-700"
                    >
                      <CheckCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                      {issueSuccess}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={issueLoading || !selectedBook || !selectedMember}
                  className="w-full flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold text-white transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    background: "linear-gradient(135deg, var(--accent) 0%, var(--accent-hover) 100%)",
                    boxShadow: "0 2px 8px rgba(200,169,110,0.35)",
                  }}
                >
                  {issueLoading ? (
                    <><RefreshCw className="h-4 w-4 animate-spin" /> Processing...</>
                  ) : (
                    <><BookOpen className="h-4 w-4" /> Issue Book<ArrowRight className="h-4 w-4" /></>
                  )}
                </button>
              </form>
            </div>
          </Reveal>

          {/* ── Return Form ── */}
          <Reveal delay={0.08}>
            <div className="bg-white rounded-2xl border border-[var(--border)] shadow-[0_2px_8px_rgba(30,58,95,0.08),0_8px_24px_rgba(30,58,95,0.06)] overflow-hidden">
              {/* Card header */}
              <div className="px-6 py-4 border-b border-[var(--border)] bg-gradient-to-r from-emerald-50 to-transparent flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center flex-shrink-0">
                  <RotateCcw className="h-4 w-4 text-white" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-[var(--foreground)]">Return a Book</h2>
                  <p className="text-xs text-slate-500">Look up by transaction ID to process return</p>
                </div>
              </div>

              <div className="p-6 flex flex-col gap-5">
                {/* Lookup form */}
                <form onSubmit={handleReturnLookup} className="flex flex-col gap-4">
                  <Field label="Transaction ID" icon={Hash} required>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Paste the issue transaction ID..."
                        value={returnIssueId}
                        onChange={(e) => setReturnIssueId(e.target.value)}
                        className={cn(inputCls, "flex-1 font-mono text-xs")}
                      />
                      <button
                        type="submit"
                        disabled={returnLoading || !returnIssueId.trim()}
                        className="flex-shrink-0 flex items-center gap-1.5 rounded-xl bg-[var(--primary)] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[var(--primary-hover)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {returnLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                        Look up
                      </button>
                    </div>
                  </Field>
                </form>

                {/* Return error */}
                <AnimatePresence>
                  {returnError && (
                    <motion.div
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      className="flex items-start gap-2 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700"
                    >
                      <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                      {returnError}
                    </motion.div>
                  )}
                  {returnSuccess && (
                    <motion.div
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      className="flex items-start gap-2 rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm text-emerald-700"
                    >
                      <CheckCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                      {returnSuccess}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Lookup result */}
                <AnimatePresence>
                  {returnLookup && (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 8 }}
                      className="flex flex-col gap-4"
                    >
                      {/* Book info card */}
                      <div className="rounded-xl border border-[var(--border)] bg-[var(--muted)] p-4">
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Transaction Details</p>
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-xl bg-[var(--primary)]/10 flex items-center justify-center flex-shrink-0">
                            <BookOpen className="h-5 w-5 text-[var(--primary)]" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-[var(--foreground)] truncate">
                              {returnLookup.book?.title ?? "Unknown Book"}
                            </p>
                            <p className="text-sm text-slate-500">{returnLookup.book?.author}</p>
                            <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1">
                              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                                <User className="h-3 w-3" />
                                {returnLookup.member?.full_name ?? "Unknown"}
                              </div>
                              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                                <Calendar className="h-3 w-3" />
                                Issued: {formatDate(returnLookup.issue.issue_date)}
                              </div>
                              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                                <Clock className="h-3 w-3" />
                                Due: {formatDate(returnLookup.issue.due_date)}
                              </div>
                              <div>
                                <StatusBadge status={returnLookup.issue.status} />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Fine preview */}
                      {returnLookup.overdueDays > 0 ? (
                        <div className="rounded-xl border border-red-200 bg-red-50 p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <AlertCircle className="h-4 w-4 text-red-600" />
                            <p className="text-sm font-semibold text-red-700">Overdue Fine</p>
                          </div>
                          <div className="grid grid-cols-3 gap-3 text-center">
                            <div className="bg-white rounded-lg p-2 border border-red-100">
                              <p className="text-lg font-bold text-red-700">{returnLookup.overdueDays}</p>
                              <p className="text-xs text-red-500">Days overdue</p>
                            </div>
                            <div className="bg-white rounded-lg p-2 border border-red-100">
                              <p className="text-lg font-bold text-red-700">PKR {FINE_RATE_PER_DAY}</p>
                              <p className="text-xs text-red-500">Per day</p>
                            </div>
                            <div className="bg-white rounded-lg p-2 border border-red-100">
                              <p className="text-lg font-bold text-red-700">PKR {returnLookup.estimatedFine}</p>
                              <p className="text-xs text-red-500">Total fine</p>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-emerald-600" />
                          <p className="text-sm text-emerald-700 font-medium">No overdue fine. Returned on time.</p>
                        </div>
                      )}

                      {/* Confirm button */}
                      <button
                        onClick={handleConfirmReturn}
                        disabled={returnLoading}
                        className="w-full flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_2px_8px_rgba(39,174,96,0.3)]"
                      >
                        {returnLoading ? (
                          <><RefreshCw className="h-4 w-4 animate-spin" /> Processing...</>
                        ) : (
                          <><CheckCircle className="h-4 w-4" /> Confirm Return</>
                        )}
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Empty state */}
                {!returnLookup && !returnError && !returnSuccess && (
                  <div className="flex flex-col items-center justify-center py-10 text-center">
                    <div className="w-14 h-14 rounded-2xl bg-[var(--muted)] flex items-center justify-center mb-3">
                      <RotateCcw className="h-6 w-6 text-slate-400" />
                    </div>
                    <p className="text-sm font-medium text-slate-500">Enter a transaction ID above</p>
                    <p className="text-xs text-slate-400 mt-1">You can find the ID in the transactions table below</p>
                  </div>
                )}
              </div>
            </div>
          </Reveal>
        </div>

        {/* ── Transactions Table ── */}
        <Reveal delay={0.12}>
          <div className="bg-white rounded-2xl border border-[var(--border)] shadow-[0_2px_8px_rgba(30,58,95,0.08),0_8px_24px_rgba(30,58,95,0.06)] overflow-hidden">
            {/* Table header */}
            <div className="px-6 py-4 border-b border-[var(--border)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[var(--primary)]/10 flex items-center justify-center">
                  <FileText className="h-4 w-4 text-[var(--primary)]" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-[var(--foreground)]">Transaction History</h2>
                  <p className="text-xs text-slate-500">{transactions.length} total records</p>
                </div>
              </div>

              {/* Filter tabs */}
              <div className="flex items-center gap-1 bg-[var(--muted)] rounded-xl p-1">
                {(["all", "issued", "returned", "overdue"] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setTxFilter(f)}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all duration-200",
                      txFilter === f
                        ? "bg-white text-[var(--primary)] shadow-sm border border-[var(--border)]"
                        : "text-slate-500 hover:text-[var(--foreground)]"
                    )}
                  >
                    {f} {f !== "all" && <span className="ml-1 opacity-60">({txCounts[f]})</span>}
                  </button>
                ))}
              </div>

              <button
                onClick={loadTransactions}
                className="flex items-center gap-1.5 rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-xs font-medium text-slate-600 hover:bg-[var(--muted)] transition-colors"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Refresh
              </button>
            </div>

            {/* Table */}
            {txLoading ? (
              <div className="flex items-center justify-center py-16">
                <RefreshCw className="h-6 w-6 animate-spin text-[var(--accent)]" />
                <span className="ml-2 text-sm text-slate-500">Loading transactions...</span>
              </div>
            ) : filteredTx.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-14 h-14 rounded-2xl bg-[var(--muted)] flex items-center justify-center mb-3">
                  <BookOpen className="h-6 w-6 text-slate-400" />
                </div>
                <p className="text-sm font-medium text-slate-500">No transactions found</p>
                <p className="text-xs text-slate-400 mt-1">Issue a book to see it here</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[var(--border)] bg-[var(--muted)]/60">
                      {["Book", "Member", "Issue Date", "Due Date", "Return Date", "Status", "ID"].map((h) => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border)]">
                    {filteredTx.map((tx) => (
                      <motion.tr
                        key={tx.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="hover:bg-[var(--card-hover)] transition-colors duration-150 group"
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-lg bg-[var(--primary)]/8 flex items-center justify-center flex-shrink-0">
                              <BookOpen className="h-3.5 w-3.5 text-[var(--primary)]" />
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium text-[var(--foreground)] truncate max-w-[160px]">
                                {tx.book?.title ?? "Unknown"}
                              </p>
                              <p className="text-xs text-slate-400 truncate max-w-[160px]">
                                {tx.book?.author}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="min-w-0">
                            <p className="font-medium text-[var(--foreground)] truncate max-w-[140px]">
                              {tx.member?.full_name ?? "Unknown"}
                            </p>
                            {tx.member?.membership_number && (
                              <p className="text-xs text-slate-400 font-mono">{tx.member.membership_number}</p>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-slate-600">
                          {formatDate(tx.issue_date)}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className={cn(
                            "text-sm",
                            calcOverdueDays(tx.due_date) > 0 && tx.status !== "returned"
                              ? "text-red-600 font-semibold"
                              : "text-slate-600"
                          )}>
                            {formatDate(tx.due_date)}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-slate-500">
                          {tx.return_date ? formatDate(tx.return_date) : <span className="text-slate-300">—</span>}
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge status={tx.status} />
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => { setReturnIssueId(tx.id); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                            className="font-mono text-xs text-slate-400 hover:text-[var(--primary)] transition-colors group-hover:underline truncate max-w-[80px] block"
                            title={tx.id}
                          >
                            {tx.id.slice(0, 8)}...
                          </button>
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
    </div>
  );
}
