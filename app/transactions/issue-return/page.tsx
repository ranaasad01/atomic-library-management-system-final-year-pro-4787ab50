"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, RotateCcw, Search, User, Calendar, CheckCircle, AlertCircle, Clock, ArrowRight, RefreshCw, Hash, FileText, ChevronRight, BookMarked } from 'lucide-react';
import { Reveal } from "@/components/Reveal";
import { staggerContainer, fadeInUp } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { FINE_RATE_PER_DAY, DEFAULT_ISSUE_DAYS } from "@/lib/data";

// ─── Types ──────────────────────────────────────────────────────────────────────

interface BookRow {
  id: string;
  title: string;
  author: string;
  isbn: string | null;
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
  issue_date: string;
  due_date: string;
  return_date: string | null;
  status: string;
  remarks: string | null;
  created_at: string;
  book?: BookRow;
  member?: UserRow;
}

type ActiveTab = "issue" | "return";

// ─── Helpers ────────────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function isOverdue(dueDateStr: string, status: string): boolean {
  if (status === "returned") return false;
  return new Date(dueDateStr) < new Date();
}

// ─── Status Badge ────────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const configs: Record<string, { label: string; className: string; icon: React.ReactNode }> = {
    issued: {
      label: "Issued",
      className: "bg-blue-50 text-blue-700 border border-blue-200",
      icon: <BookMarked className="h-3 w-3" />,
    },
    returned: {
      label: "Returned",
      className: "bg-emerald-50 text-emerald-700 border border-emerald-200",
      icon: <CheckCircle className="h-3 w-3" />,
    },
    overdue: {
      label: "Overdue",
      className: "bg-red-50 text-red-700 border border-red-200",
      icon: <AlertCircle className="h-3 w-3" />,
    },
  };
  const cfg = configs[status] ?? {
    label: status,
    className: "bg-gray-50 text-gray-600 border border-gray-200",
    icon: <Clock className="h-3 w-3" />,
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold",
        cfg.className
      )}
    >
      {cfg.icon}
      {cfg.label}
    </span>
  );
}

// ─── Input Field ─────────────────────────────────────────────────────────────────

function InputField({
  label,
  icon: Icon,
  value,
  onChange,
  placeholder,
  type = "text",
  readOnly = false,
  required = false,
}: {
  label: string;
  icon: React.ElementType;
  value: string;
  onChange?: (v: string) => void;
  placeholder?: string;
  type?: string;
  readOnly?: boolean;
  required?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold text-[#1e3a5f] uppercase tracking-wide">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <div className="relative">
        <Icon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#c8a96e]" />
        <input
          type={type}
          value={value}
          onChange={onChange ? (e) => onChange(e.target.value) : undefined}
          placeholder={placeholder}
          readOnly={readOnly}
          required={required}
          className={cn(
            "w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm transition-all duration-200",
            "bg-white border-[#d6cfc2] text-[#1a2a3a] placeholder:text-slate-400",
            "focus:outline-none focus:ring-2 focus:ring-[#c8a96e]/40 focus:border-[#c8a96e]",
            readOnly && "bg-[#f5f0e8] cursor-not-allowed text-slate-500"
          )}
        />
      </div>
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────────

export default function IssueReturnPage() {
  const supabase = createClient();

  const [activeTab, setActiveTab] = useState<ActiveTab>("issue");
  const [transactions, setTransactions] = useState<IssueRow[]>([]);
  const [loadingTx, setLoadingTx] = useState(true);
  const [txError, setTxError] = useState<string | null>(null);

  // Issue form state
  const [issueBookSearch, setIssueBookSearch] = useState("");
  const [issueBookResults, setIssueBookResults] = useState<BookRow[]>([]);
  const [selectedBook, setSelectedBook] = useState<BookRow | null>(null);
  const [issueMemberSearch, setIssueMemberSearch] = useState("");
  const [issueMemberResults, setIssueMemberResults] = useState<UserRow[]>([]);
  const [selectedMember, setSelectedMember] = useState<UserRow | null>(null);
  const [issueRemarks, setIssueRemarks] = useState("");
  const [issueLoading, setIssueLoading] = useState(false);
  const [issueSuccess, setIssueSuccess] = useState<string | null>(null);
  const [issueError, setIssueError] = useState<string | null>(null);

  // Return form state
  const [returnSearch, setReturnSearch] = useState("");
  const [returnResults, setReturnResults] = useState<IssueRow[]>([]);
  const [selectedIssue, setSelectedIssue] = useState<IssueRow | null>(null);
  const [returnRemarks, setReturnRemarks] = useState("");
  const [returnLoading, setReturnLoading] = useState(false);
  const [returnSuccess, setReturnSuccess] = useState<string | null>(null);
  const [returnError, setReturnError] = useState<string | null>(null);

  // ─── Fetch transactions ──────────────────────────────────────────────────────

  const fetchTransactions = useCallback(async () => {
    setLoadingTx(true);
    setTxError(null);
    try {
      const { data, error } = await supabase
        .from("book_issues")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;

      const rows: IssueRow[] = data ?? [];

      // Enrich with book and member data
      const bookIds = [...new Set(rows.map((r) => r.book_id))];
      const userIds = [...new Set(rows.map((r) => r.user_id))];

      const [{ data: books }, { data: members }] = await Promise.all([
        supabase.from("books").select("id,title,author,isbn,available_copies,total_copies,shelf_location").in("id", bookIds),
        supabase.from("users").select("id,full_name,email,membership_number,role,is_active").in("id", userIds),
      ]);

      const bookMap = new Map((books ?? []).map((b) => [b.id, b]));
      const memberMap = new Map((members ?? []).map((u) => [u.id, u]));

      const enriched = rows.map((r) => ({
        ...r,
        book: bookMap.get(r.book_id),
        member: memberMap.get(r.user_id),
      }));

      setTransactions(enriched);
    } catch (err) {
      setTxError(err instanceof Error ? err.message : "Failed to load transactions.");
    } finally {
      setLoadingTx(false);
    }
  }, []);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  // ─── Book search for issue ───────────────────────────────────────────────────

  useEffect(() => {
    if (!issueBookSearch.trim() || selectedBook) {
      setIssueBookResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      const { data } = await supabase
        .from("books")
        .select("id,title,author,isbn,available_copies,total_copies,shelf_location")
        .or(`title.ilike.%${issueBookSearch}%,author.ilike.%${issueBookSearch}%,isbn.ilike.%${issueBookSearch}%`)
        .limit(6);
      setIssueBookResults(data ?? []);
    }, 300);
    return () => clearTimeout(timer);
  }, [issueBookSearch, selectedBook]);

  // ─── Member search for issue ─────────────────────────────────────────────────

  useEffect(() => {
    if (!issueMemberSearch.trim() || selectedMember) {
      setIssueMemberResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      const { data } = await supabase
        .from("users")
        .select("id,full_name,email,membership_number,role,is_active")
        .or(`full_name.ilike.%${issueMemberSearch}%,email.ilike.%${issueMemberSearch}%,membership_number.ilike.%${issueMemberSearch}%`)
        .eq("is_active", true)
        .limit(6);
      setIssueMemberResults(data ?? []);
    }, 300);
    return () => clearTimeout(timer);
  }, [issueMemberSearch, selectedMember]);

  // ─── Return search ───────────────────────────────────────────────────────────

  useEffect(() => {
    if (!returnSearch.trim() || selectedIssue) {
      setReturnResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      const { data: issues } = await supabase
        .from("book_issues")
        .select("*")
        .in("status", ["issued", "overdue"])
        .order("created_at", { ascending: false })
        .limit(20);

      if (!issues || issues.length === 0) {
        setReturnResults([]);
        return;
      }

      const bookIds = [...new Set(issues.map((i) => i.book_id))];
      const userIds = [...new Set(issues.map((i) => i.user_id))];

      const [{ data: books }, { data: members }] = await Promise.all([
        supabase.from("books").select("id,title,author,isbn,available_copies,total_copies,shelf_location").in("id", bookIds),
        supabase.from("users").select("id,full_name,email,membership_number,role,is_active").in("id", userIds),
      ]);

      const bookMap = new Map((books ?? []).map((b) => [b.id, b]));
      const memberMap = new Map((members ?? []).map((u) => [u.id, u]));

      const enriched: IssueRow[] = issues.map((i) => ({
        ...i,
        book: bookMap.get(i.book_id),
        member: memberMap.get(i.user_id),
      }));

      const q = returnSearch.toLowerCase();
      const filtered = enriched.filter(
        (i) =>
          i.book?.title?.toLowerCase().includes(q) ||
          i.book?.isbn?.toLowerCase().includes(q) ||
          i.member?.full_name?.toLowerCase().includes(q) ||
          i.member?.membership_number?.toLowerCase().includes(q)
      );

      setReturnResults(filtered);
    }, 300);
    return () => clearTimeout(timer);
  }, [returnSearch, selectedIssue]);

  // ─── Issue book ──────────────────────────────────────────────────────────────

  async function handleIssueBook(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedBook || !selectedMember) {
      setIssueError("Please select both a book and a member.");
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
      const { data: { session } } = await supabase.auth.getSession();
      const issuedBy = session?.user?.id ?? "";

      const issueDate = new Date();
      const dueDate = addDays(issueDate, DEFAULT_ISSUE_DAYS);

      const { error: insertError } = await supabase.from("book_issues").insert({
        book_id: selectedBook.id,
        user_id: selectedMember.id,
        issued_by: issuedBy,
        issue_date: issueDate.toISOString(),
        due_date: dueDate.toISOString(),
        status: "issued",
        remarks: issueRemarks.trim() || null,
      });

      if (insertError) throw insertError;

      // Decrement available copies
      await supabase
        .from("books")
        .update({ available_copies: selectedBook.available_copies - 1 })
        .eq("id", selectedBook.id);

      setIssueSuccess(
        `"${selectedBook.title}" issued to ${selectedMember.full_name}. Due: ${formatDate(dueDate.toISOString())}`
      );
      setSelectedBook(null);
      setSelectedMember(null);
      setIssueBookSearch("");
      setIssueMemberSearch("");
      setIssueRemarks("");
      fetchTransactions();
    } catch (err) {
      setIssueError(err instanceof Error ? err.message : "Failed to issue book.");
    } finally {
      setIssueLoading(false);
    }
  }

  // ─── Return book ─────────────────────────────────────────────────────────────

  async function handleReturnBook(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedIssue) {
      setReturnError("Please select a transaction to return.");
      return;
    }

    setReturnLoading(true);
    setReturnError(null);
    setReturnSuccess(null);

    try {
      const returnDate = new Date();
      const overdueDays = Math.max(
        0,
        Math.ceil((returnDate.getTime() - new Date(selectedIssue.due_date).getTime()) / (1000 * 60 * 60 * 24))
      );

      const { error: updateError } = await supabase
        .from("book_issues")
        .update({
          status: "returned",
          return_date: returnDate.toISOString(),
          remarks: returnRemarks.trim() || selectedIssue.remarks,
        })
        .eq("id", selectedIssue.id);

      if (updateError) throw updateError;

      // Increment available copies
      if (selectedIssue.book) {
        await supabase
          .from("books")
          .update({ available_copies: selectedIssue.book.available_copies + 1 })
          .eq("id", selectedIssue.book_id);
      }

      // Create fine if overdue
      if (overdueDays > 0) {
        const totalAmount = overdueDays * FINE_RATE_PER_DAY;
        await supabase.from("fines").insert({
          issue_id: selectedIssue.id,
          user_id: selectedIssue.user_id,
          overdue_days: overdueDays,
          fine_per_day: FINE_RATE_PER_DAY,
          total_amount: totalAmount,
          status: "pending",
        });
        setReturnSuccess(
          `Book returned. Fine of PKR ${totalAmount} created for ${overdueDays} overdue day(s).`
        );
      } else {
        setReturnSuccess(`"${selectedIssue.book?.title ?? "Book"}" returned successfully. No fine applicable.`);
      }

      setSelectedIssue(null);
      setReturnSearch("");
      setReturnRemarks("");
      fetchTransactions();
    } catch (err) {
      setReturnError(err instanceof Error ? err.message : "Failed to process return.");
    } finally {
      setReturnLoading(false);
    }
  }

  // ─── Derived stats ───────────────────────────────────────────────────────────

  const totalIssued = transactions.filter((t) => t.status === "issued" || t.status === "overdue").length;
  const totalOverdue = transactions.filter((t) => t.status === "overdue" || isOverdue(t.due_date, t.status)).length;
  const totalReturned = transactions.filter((t) => t.status === "returned").length;

  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[#f5f0e8]">
      {/* ── Page Header ── */}
      <div
        className="relative overflow-hidden"
        style={{
          background: "linear-gradient(135deg, #1e3a5f 0%, #162d4a 60%, #0f1f33 100%)",
        }}
      >
        {/* Decorative circles */}
        <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-white/5 pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-48 h-48 rounded-full bg-[#c8a96e]/10 pointer-events-none" />

        <div className="container-lms py-12 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          >
            <div className="flex items-center gap-2 mb-3">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#c8a96e]/20 border border-[#c8a96e]/30 px-3 py-1 text-xs font-semibold text-[#c8a96e] uppercase tracking-wider">
                <BookOpen className="h-3 w-3" />
                Transactions
              </span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight text-balance">
              Issue &amp; Return Transactions
            </h1>
            <p className="mt-2 text-white/60 text-sm max-w-xl">
              Manage book lending and returns. Issue books to members, process returns, and track overdue items — all in one place.
            </p>

            {/* Quick stats */}
            <div className="mt-6 flex flex-wrap gap-4">
              {[
                { label: "Active Issues", value: totalIssued, color: "text-blue-300" },
                { label: "Overdue", value: totalOverdue, color: "text-red-300" },
                { label: "Returned", value: totalReturned, color: "text-emerald-300" },
              ].map((s) => (
                <div key={s.label} className="flex items-center gap-2">
                  <span className={`text-2xl font-bold ${s.color}`}>{s.value}</span>
                  <span className="text-white/50 text-sm">{s.label}</span>
                  <span className="text-white/20 text-sm last:hidden">·</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      {/* ── Main Content ── */}
      <div className="container-lms py-8">
        <div className="grid grid-cols-1 xl:grid-cols-5 gap-8">
          {/* Left: Tab forms */}
          <div className="xl:col-span-2 flex flex-col gap-6">
            {/* Tab Switcher */}
            <div className="bg-white rounded-2xl border border-[#d6cfc2] p-1.5 shadow-[0_1px_3px_rgba(30,58,95,0.08),0_4px_12px_rgba(30,58,95,0.06)] flex gap-1">
              {(["issue", "return"] as ActiveTab[]).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-semibold transition-all duration-200",
                    activeTab === tab
                      ? "bg-[#1e3a5f] text-white shadow-[0_2px_8px_rgba(30,58,95,0.25)]"
                      : "text-[#5a6a7a] hover:text-[#1e3a5f] hover:bg-[#f5f0e8]"
                  )}
                >
                  {tab === "issue" ? (
                    <BookOpen className="h-4 w-4" />
                  ) : (
                    <RotateCcw className="h-4 w-4" />
                  )}
                  {tab === "issue" ? "Issue Book" : "Return Book"}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <AnimatePresence mode="wait">
              {activeTab === "issue" ? (
                <motion.div
                  key="issue"
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 16 }}
                  transition={{ duration: 0.25, ease: "easeOut" }}
                >
                  <form
                    onSubmit={handleIssueBook}
                    className="bg-white rounded-2xl border border-[#d6cfc2] shadow-[0_1px_3px_rgba(30,58,95,0.08),0_8px_24px_rgba(30,58,95,0.06)] overflow-hidden"
                  >
                    {/* Card header */}
                    <div className="px-6 py-4 border-b border-[#ede8df] bg-gradient-to-r from-[#f5f0e8] to-white">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-[#1e3a5f] flex items-center justify-center">
                          <BookOpen className="h-4 w-4 text-white" />
                        </div>
                        <div>
                          <h2 className="text-base font-bold text-[#1e3a5f]">Issue a Book</h2>
                          <p className="text-xs text-[#5a6a7a]">Lend a book to a library member</p>
                        </div>
                      </div>
                    </div>

                    <div className="p-6 flex flex-col gap-5">
                      {/* Book search */}
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-semibold text-[#1e3a5f] uppercase tracking-wide">
                          Book <span className="text-red-500">*</span>
                        </label>
                        {selectedBook ? (
                          <div className="flex items-start gap-3 rounded-xl border border-[#c8a96e]/40 bg-[#c8a96e]/5 p-3">
                            <BookOpen className="h-4 w-4 text-[#c8a96e] mt-0.5 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-[#1e3a5f] truncate">{selectedBook.title}</p>
                              <p className="text-xs text-[#5a6a7a]">{selectedBook.author}</p>
                              <p className="text-xs text-emerald-600 mt-0.5">{selectedBook.available_copies} cop{selectedBook.available_copies === 1 ? "y" : "ies"} available</p>
                            </div>
                            <button
                              type="button"
                              onClick={() => { setSelectedBook(null); setIssueBookSearch(""); }}
                              className="text-[#5a6a7a] hover:text-red-500 transition-colors text-xs font-medium"
                            >
                              Change
                            </button>
                          </div>
                        ) : (
                          <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#c8a96e]" />
                            <input
                              type="text"
                              value={issueBookSearch}
                              onChange={(e) => setIssueBookSearch(e.target.value)}
                              placeholder="Search by title, author, or ISBN..."
                              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#d6cfc2] text-sm bg-white text-[#1a2a3a] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#c8a96e]/40 focus:border-[#c8a96e] transition-all"
                            />
                            {issueBookResults.length > 0 && (
                              <div className="absolute top-full left-0 right-0 z-20 mt-1 bg-white border border-[#d6cfc2] rounded-xl shadow-[0_8px_24px_rgba(30,58,95,0.12)] overflow-hidden">
                                {issueBookResults.map((book) => (
                                  <button
                                    key={book.id}
                                    type="button"
                                    onClick={() => { setSelectedBook(book); setIssueBookSearch(book.title); setIssueBookResults([]); }}
                                    className="w-full flex items-start gap-3 px-4 py-3 hover:bg-[#f5f0e8] transition-colors text-left border-b border-[#ede8df] last:border-0"
                                  >
                                    <BookOpen className="h-4 w-4 text-[#c8a96e] mt-0.5 flex-shrink-0" />
                                    <div className="min-w-0">
                                      <p className="text-sm font-medium text-[#1e3a5f] truncate">{book.title}</p>
                                      <p className="text-xs text-[#5a6a7a]">{book.author}</p>
                                      <p className={cn("text-xs mt-0.5", book.available_copies > 0 ? "text-emerald-600" : "text-red-500")}>
                                        {book.available_copies > 0 ? `${book.available_copies} available` : "Not available"}
                                      </p>
                                    </div>
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Member search */}
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-semibold text-[#1e3a5f] uppercase tracking-wide">
                          Member <span className="text-red-500">*</span>
                        </label>
                        {selectedMember ? (
                          <div className="flex items-start gap-3 rounded-xl border border-[#1e3a5f]/20 bg-[#1e3a5f]/5 p-3">
                            <User className="h-4 w-4 text-[#1e3a5f] mt-0.5 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-[#1e3a5f] truncate">{selectedMember.full_name}</p>
                              <p className="text-xs text-[#5a6a7a]">{selectedMember.email}</p>
                              {selectedMember.membership_number && (
                                <p className="text-xs text-[#5a6a7a] mt-0.5">#{selectedMember.membership_number}</p>
                              )}
                            </div>
                            <button
                              type="button"
                              onClick={() => { setSelectedMember(null); setIssueMemberSearch(""); }}
                              className="text-[#5a6a7a] hover:text-red-500 transition-colors text-xs font-medium"
                            >
                              Change
                            </button>
                          </div>
                        ) : (
                          <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#c8a96e]" />
                            <input
                              type="text"
                              value={issueMemberSearch}
                              onChange={(e) => setIssueMemberSearch(e.target.value)}
                              placeholder="Search by name, email, or membership no..."
                              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#d6cfc2] text-sm bg-white text-[#1a2a3a] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#c8a96e]/40 focus:border-[#c8a96e] transition-all"
                            />
                            {issueMemberResults.length > 0 && (
                              <div className="absolute top-full left-0 right-0 z-20 mt-1 bg-white border border-[#d6cfc2] rounded-xl shadow-[0_8px_24px_rgba(30,58,95,0.12)] overflow-hidden">
                                {issueMemberResults.map((member) => (
                                  <button
                                    key={member.id}
                                    type="button"
                                    onClick={() => { setSelectedMember(member); setIssueMemberSearch(member.full_name); setIssueMemberResults([]); }}
                                    className="w-full flex items-start gap-3 px-4 py-3 hover:bg-[#f5f0e8] transition-colors text-left border-b border-[#ede8df] last:border-0"
                                  >
                                    <User className="h-4 w-4 text-[#1e3a5f] mt-0.5 flex-shrink-0" />
                                    <div className="min-w-0">
                                      <p className="text-sm font-medium text-[#1e3a5f] truncate">{member.full_name}</p>
                                      <p className="text-xs text-[#5a6a7a]">{member.email}</p>
                                      {member.membership_number && (
                                        <p className="text-xs text-[#5a6a7a] mt-0.5">#{member.membership_number}</p>
                                      )}
                                    </div>
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Due date preview */}
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-semibold text-[#1e3a5f] uppercase tracking-wide">Due Date (Auto)</label>
                        <div className="relative">
                          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#c8a96e]" />
                          <input
                            type="text"
                            readOnly
                            value={formatDate(addDays(new Date(), DEFAULT_ISSUE_DAYS).toISOString())}
                            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#d6cfc2] text-sm bg-[#f5f0e8] text-slate-500 cursor-not-allowed"
                          />
                        </div>
                        <p className="text-xs text-[#5a6a7a]">Default loan period: {DEFAULT_ISSUE_DAYS} days. Fine: PKR {FINE_RATE_PER_DAY}/day overdue.</p>
                      </div>

                      {/* Remarks */}
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-semibold text-[#1e3a5f] uppercase tracking-wide">Remarks (Optional)</label>
                        <div className="relative">
                          <FileText className="absolute left-3 top-3 h-4 w-4 text-[#c8a96e]" />
                          <textarea
                            value={issueRemarks}
                            onChange={(e) => setIssueRemarks(e.target.value)}
                            placeholder="Any notes about this transaction..."
                            rows={2}
                            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#d6cfc2] text-sm bg-white text-[#1a2a3a] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#c8a96e]/40 focus:border-[#c8a96e] transition-all resize-none"
                          />
                        </div>
                      </div>

                      {/* Feedback */}
                      <AnimatePresence>
                        {issueError && (
                          <motion.div
                            initial={{ opacity: 0, y: -8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="flex items-start gap-2 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700"
                          >
                            <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                            {issueError}
                          </motion.div>
                        )}
                        {issueSuccess && (
                          <motion.div
                            initial={{ opacity: 0, y: -8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="flex items-start gap-2 rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm text-emerald-700"
                          >
                            <CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                            {issueSuccess}
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {/* Submit */}
                      <button
                        type="submit"
                        disabled={issueLoading || !selectedBook || !selectedMember}
                        className={cn(
                          "w-full flex items-center justify-center gap-2 py-3 px-6 rounded-xl font-semibold text-sm transition-all duration-200",
                          "bg-gradient-to-r from-[#c8a96e] to-[#b8944f] text-white",
                          "shadow-[0_2px_8px_rgba(200,169,110,0.35)] hover:shadow-[0_4px_16px_rgba(200,169,110,0.45)]",
                          "hover:from-[#b8944f] hover:to-[#a07d3a]",
                          "disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
                        )}
                      >
                        {issueLoading ? (
                          <RefreshCw className="h-4 w-4 animate-spin" />
                        ) : (
                          <BookOpen className="h-4 w-4" />
                        )}
                        {issueLoading ? "Issuing..." : "Issue Book"}
                      </button>
                    </div>
                  </form>
                </motion.div>
              ) : (
                <motion.div
                  key="return"
                  initial={{ opacity: 0, x: 16 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -16 }}
                  transition={{ duration: 0.25, ease: "easeOut" }}
                >
                  <form
                    onSubmit={handleReturnBook}
                    className="bg-white rounded-2xl border border-[#d6cfc2] shadow-[0_1px_3px_rgba(30,58,95,0.08),0_8px_24px_rgba(30,58,95,0.06)] overflow-hidden"
                  >
                    {/* Card header */}
                    <div className="px-6 py-4 border-b border-[#ede8df] bg-gradient-to-r from-[#f5f0e8] to-white">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center">
                          <RotateCcw className="h-4 w-4 text-white" />
                        </div>
                        <div>
                          <h2 className="text-base font-bold text-[#1e3a5f]">Return a Book</h2>
                          <p className="text-xs text-[#5a6a7a]">Process a book return and calculate any fines</p>
                        </div>
                      </div>
                    </div>

                    <div className="p-6 flex flex-col gap-5">
                      {/* Transaction search */}
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-semibold text-[#1e3a5f] uppercase tracking-wide">
                          Find Transaction <span className="text-red-500">*</span>
                        </label>
                        {selectedIssue ? (
                          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 flex flex-col gap-2">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold text-[#1e3a5f] truncate">{selectedIssue.book?.title ?? "Unknown Book"}</p>
                                <p className="text-xs text-[#5a6a7a]">{selectedIssue.book?.author}</p>
                              </div>
                              <button
                                type="button"
                                onClick={() => { setSelectedIssue(null); setReturnSearch(""); }}
                                className="text-[#5a6a7a] hover:text-red-500 transition-colors text-xs font-medium flex-shrink-0"
                              >
                                Change
                              </button>
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              <div>
                                <span className="text-[#5a6a7a]">Member:</span>{" "}
                                <span className="font-medium text-[#1e3a5f]">{selectedIssue.member?.full_name ?? "—"}</span>
                              </div>
                              <div>
                                <span className="text-[#5a6a7a]">Due:</span>{" "}
                                <span className={cn("font-medium", isOverdue(selectedIssue.due_date, selectedIssue.status) ? "text-red-600" : "text-emerald-600")}>
                                  {formatDate(selectedIssue.due_date)}
                                </span>
                              </div>
                              <div>
                                <span className="text-[#5a6a7a]">Issued:</span>{" "}
                                <span className="font-medium text-[#1e3a5f]">{formatDate(selectedIssue.issue_date)}</span>
                              </div>
                              <div>
                                <StatusBadge status={isOverdue(selectedIssue.due_date, selectedIssue.status) ? "overdue" : selectedIssue.status} />
                              </div>
                            </div>
                            {isOverdue(selectedIssue.due_date, selectedIssue.status) && (
                              <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-700 flex items-center gap-1.5">
                                <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
                                Fine will be calculated: PKR {Math.max(0, Math.ceil((new Date().getTime() - new Date(selectedIssue.due_date).getTime()) / (1000 * 60 * 60 * 24))) * FINE_RATE_PER_DAY} ({Math.max(0, Math.ceil((new Date().getTime() - new Date(selectedIssue.due_date).getTime()) / (1000 * 60 * 60 * 24)))} days × PKR {FINE_RATE_PER_DAY})
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#c8a96e]" />
                            <input
                              type="text"
                              value={returnSearch}
                              onChange={(e) => setReturnSearch(e.target.value)}
                              placeholder="Search by book title, ISBN, or member name..."
                              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#d6cfc2] text-sm bg-white text-[#1a2a3a] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#c8a96e]/40 focus:border-[#c8a96e] transition-all"
                            />
                            {returnResults.length > 0 && (
                              <div className="absolute top-full left-0 right-0 z-20 mt-1 bg-white border border-[#d6cfc2] rounded-xl shadow-[0_8px_24px_rgba(30,58,95,0.12)] overflow-hidden">
                                {returnResults.map((issue) => (
                                  <button
                                    key={issue.id}
                                    type="button"
                                    onClick={() => { setSelectedIssue(issue); setReturnSearch(issue.book?.title ?? ""); setReturnResults([]); }}
                                    className="w-full flex items-start gap-3 px-4 py-3 hover:bg-[#f5f0e8] transition-colors text-left border-b border-[#ede8df] last:border-0"
                                  >
                                    <BookOpen className="h-4 w-4 text-[#c8a96e] mt-0.5 flex-shrink-0" />
                                    <div className="min-w-0 flex-1">
                                      <p className="text-sm font-medium text-[#1e3a5f] truncate">{issue.book?.title ?? "Unknown"}</p>
                                      <p className="text-xs text-[#5a6a7a]">{issue.member?.full_name} · Due: {formatDate(issue.due_date)}</p>
                                    </div>
                                    <StatusBadge status={isOverdue(issue.due_date, issue.status) ? "overdue" : issue.status} />
                                  </button>
                                ))}
                              </div>
                            )}
                            {returnSearch.trim() && returnResults.length === 0 && (
                              <p className="mt-2 text-xs text-[#5a6a7a]">No active issues found matching your search.</p>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Return remarks */}
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-semibold text-[#1e3a5f] uppercase tracking-wide">Return Remarks (Optional)</label>
                        <div className="relative">
                          <FileText className="absolute left-3 top-3 h-4 w-4 text-[#c8a96e]" />
                          <textarea
                            value={returnRemarks}
                            onChange={(e) => setReturnRemarks(e.target.value)}
                            placeholder="Condition of book, notes..."
                            rows={2}
                            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#d6cfc2] text-sm bg-white text-[#1a2a3a] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#c8a96e]/40 focus:border-[#c8a96e] transition-all resize-none"
                          />
                        </div>
                      </div>

                      {/* Feedback */}
                      <AnimatePresence>
                        {returnError && (
                          <motion.div
                            initial={{ opacity: 0, y: -8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="flex items-start gap-2 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700"
                          >
                            <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                            {returnError}
                          </motion.div>
                        )}
                        {returnSuccess && (
                          <motion.div
                            initial={{ opacity: 0, y: -8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="flex items-start gap-2 rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm text-emerald-700"
                          >
                            <CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                            {returnSuccess}
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {/* Submit */}
                      <button
                        type="submit"
                        disabled={returnLoading || !selectedIssue}
                        className={cn(
                          "w-full flex items-center justify-center gap-2 py-3 px-6 rounded-xl font-semibold text-sm transition-all duration-200",
                          "bg-gradient-to-r from-emerald-600 to-emerald-500 text-white",
                          "shadow-[0_2px_8px_rgba(39,174,96,0.30)] hover:shadow-[0_4px_16px_rgba(39,174,96,0.40)]",
                          "hover:from-emerald-700 hover:to-emerald-600",
                          "disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
                        )}
                      >
                        {returnLoading ? (
                          <RefreshCw className="h-4 w-4 animate-spin" />
                        ) : (
                          <RotateCcw className="h-4 w-4" />
                        )}
                        {returnLoading ? "Processing..." : "Process Return"}
                      </button>
                    </div>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Right: Transactions list */}
          <div className="xl:col-span-3">
            <Reveal>
              <div className="bg-white rounded-2xl border border-[#d6cfc2] shadow-[0_1px_3px_rgba(30,58,95,0.08),0_8px_24px_rgba(30,58,95,0.06)] overflow-hidden">
                {/* List header */}
                <div className="px-6 py-4 border-b border-[#ede8df] bg-gradient-to-r from-[#f5f0e8] to-white flex items-center justify-between">
                  <div>
                    <h2 className="text-base font-bold text-[#1e3a5f]">Recent Transactions</h2>
                    <p className="text-xs text-[#5a6a7a] mt-0.5">Latest 50 issue and return records</p>
                  </div>
                  <button
                    onClick={fetchTransactions}
                    disabled={loadingTx}
                    className="flex items-center gap-1.5 text-xs font-medium text-[#1e3a5f] hover:text-[#c8a96e] transition-colors disabled:opacity-50"
                  >
                    <RefreshCw className={cn("h-3.5 w-3.5", loadingTx && "animate-spin")} />
                    Refresh
                  </button>
                </div>

                {/* Error */}
                {txError && (
                  <div className="mx-6 mt-4 flex items-center gap-2 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                    <AlertCircle className="h-4 w-4 flex-shrink-0" />
                    {txError}
                  </div>
                )}

                {/* Loading */}
                {loadingTx && (
                  <div className="flex items-center justify-center py-16">
                    <RefreshCw className="h-6 w-6 animate-spin text-[#c8a96e]" />
                  </div>
                )}

                {/* Empty */}
                {!loadingTx && !txError && transactions.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="w-14 h-14 rounded-2xl bg-[#f5f0e8] flex items-center justify-center mb-4">
                      <BookOpen className="h-7 w-7 text-[#c8a96e]" />
                    </div>
                    <p className="text-sm font-semibold text-[#1e3a5f]">No transactions yet</p>
                    <p className="text-xs text-[#5a6a7a] mt-1">Issue a book to get started.</p>
                  </div>
                )}

                {/* Table */}
                {!loadingTx && transactions.length > 0 && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-[#ede8df] bg-[#faf8f4]">
                          <th className="px-4 py-3 text-left text-xs font-semibold text-[#5a6a7a] uppercase tracking-wide">Book</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-[#5a6a7a] uppercase tracking-wide">Member</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-[#5a6a7a] uppercase tracking-wide">Issued</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-[#5a6a7a] uppercase tracking-wide">Due</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-[#5a6a7a] uppercase tracking-wide">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {transactions.map((tx, idx) => {
                          const effectiveStatus =
                            tx.status !== "returned" && isOverdue(tx.due_date, tx.status)
                              ? "overdue"
                              : tx.status;
                          return (
                            <motion.tr
                              key={tx.id}
                              initial={{ opacity: 0, y: 8 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: idx * 0.03, duration: 0.25 }}
                              className="border-b border-[#ede8df] last:border-0 hover:bg-[#faf8f4] transition-colors duration-150 group"
                            >
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-2.5">
                                  <div className="w-8 h-8 rounded-lg bg-[#1e3a5f]/8 flex items-center justify-center flex-shrink-0">
                                    <BookOpen className="h-3.5 w-3.5 text-[#1e3a5f]" />
                                  </div>
                                  <div className="min-w-0">
                                    <p className="font-semibold text-[#1e3a5f] truncate max-w-[140px] text-xs">
                                      {tx.book?.title ?? "Unknown Book"}
                                    </p>
                                    <p className="text-[10px] text-[#5a6a7a] truncate max-w-[140px]">
                                      {tx.book?.author ?? ""}
                                    </p>
                                  </div>
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-2">
                                  <div className="w-6 h-6 rounded-full bg-[#c8a96e]/15 flex items-center justify-center flex-shrink-0">
                                    <User className="h-3 w-3 text-[#c8a96e]" />
                                  </div>
                                  <div className="min-w-0">
                                    <p className="text-xs font-medium text-[#1e3a5f] truncate max-w-[100px]">
                                      {tx.member?.full_name ?? "—"}
                                    </p>
                                    {tx.member?.membership_number && (
                                      <p className="text-[10px] text-[#5a6a7a]">#{tx.member.membership_number}</p>
                                    )}
                                  </div>
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                <span className="text-xs text-[#5a6a7a]">{formatDate(tx.issue_date)}</span>
                              </td>
                              <td className="px-4 py-3">
                                <span
                                  className={cn(
                                    "text-xs font-medium",
                                    effectiveStatus === "overdue" ? "text-red-600" : "text-[#1e3a5f]"
                                  )}
                                >
                                  {formatDate(tx.due_date)}
                                </span>
                              </td>
                              <td className="px-4 py-3">
                                <StatusBadge status={effectiveStatus} />
                              </td>
                            </motion.tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </Reveal>
          </div>
        </div>
      </div>
    </div>
  );
}
