"use client";

import { useState, useEffect, useMemo, useCallback, Fragment } from "react";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import { Search, BookOpen, ArrowLeft, ArrowRight, Check, X, AlertCircle, Clock, User, Calendar, ChevronDown, AlertTriangle, CheckCircle, Filter } from 'lucide-react';
import { Reveal } from "@/components/Reveal";
import { createClient } from "@/lib/supabase/client";
import { FINE_RATE_PER_DAY, DEFAULT_ISSUE_DAYS } from "@/lib/data";

// ─── Types ────────────────────────────────────────────────────────────────────

interface MemberRow {
  id: string;
  full_name: string;
  email: string;
  membership_number: string | null;
  is_active: boolean;
  role: string;
}

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

interface FineRow {
  id: string;
  issue_id: string;
  user_id: string;
  overdue_days: number;
  fine_per_day: number;
  total_amount: number;
  status: string;
}

interface EnrichedIssue extends BookIssueRow {
  book_title?: string;
  book_author?: string;
  member_name?: string;
  member_email?: string;
  fine?: FineRow | null;
}

// ─── Motion variants ──────────────────────────────────────────────────────────

const modalOverlay: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.2 } },
};

const modalContent: Variants = {
  hidden: { opacity: 0, scale: 0.95, y: 16 },
  visible: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.25, ease: "easeOut" } },
};

const tabUnderline: Variants = {
  hidden: { scaleX: 0 },
  visible: { scaleX: 1, transition: { duration: 0.3, ease: "easeOut" } },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-PK", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function calcOverdueDays(dueDateStr: string, returnDateStr?: string | null): number {
  const due = new Date(dueDateStr);
  const ret = returnDateStr ? new Date(returnDateStr) : new Date();
  const diff = Math.floor((ret.getTime() - due.getTime()) / (1000 * 60 * 60 * 24));
  return Math.max(0, diff);
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    issued: { label: "Issued", cls: "bg-blue-100 text-blue-700 border-blue-200" },
    returned: { label: "Returned", cls: "bg-green-100 text-green-700 border-green-200" },
    overdue: { label: "Overdue", cls: "bg-red-100 text-red-700 border-red-200" },
  };
  const s = map[status] ?? { label: status, cls: "bg-gray-100 text-gray-600 border-gray-200" };
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${s.cls}`}>
      {s.label}
    </span>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function IssueReturnPage() {
  const supabase = createClient();

  // ── Data state ──
  const [members, setMembers] = useState<MemberRow[]>([]);
  const [books, setBooks] = useState<BookRow[]>([]);
  const [issues, setIssues] = useState<EnrichedIssue[]>([]);
  const [fines, setFines] = useState<FineRow[]>([]);
  const [loading, setLoading] = useState(true);

  // ── Tab ──
  const [activeTab, setActiveTab] = useState<"issue" | "return">("issue");

  // ── Issue tab state ──
  const [memberQuery, setMemberQuery] = useState("");
  const [selectedMember, setSelectedMember] = useState<MemberRow | null>(null);
  const [bookQuery, setBookQuery] = useState("");
  const [selectedBook, setSelectedBook] = useState<BookRow | null>(null);
  const [issueRemarks, setIssueRemarks] = useState("");
  const [showMemberDropdown, setShowMemberDropdown] = useState(false);
  const [showBookDropdown, setShowBookDropdown] = useState(false);
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [issueSubmitting, setIssueSubmitting] = useState(false);
  const [issueSuccess, setIssueSuccess] = useState(false);

  // ── Return tab state ──
  const [returnMemberQuery, setReturnMemberQuery] = useState("");
  const [returnSelectedMember, setReturnSelectedMember] = useState<MemberRow | null>(null);
  const [showReturnMemberDropdown, setShowReturnMemberDropdown] = useState(false);
  const [selectedIssueForReturn, setSelectedIssueForReturn] = useState<EnrichedIssue | null>(null);
  const [returnCondition, setReturnCondition] = useState("good");
  const [returnRemarks, setReturnRemarks] = useState("");
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [returnSubmitting, setReturnSubmitting] = useState(false);
  const [returnSuccess, setReturnSuccess] = useState(false);

  // ── Transaction log state ──
  const [logSearch, setLogSearch] = useState("");
  const [logStatusFilter, setLogStatusFilter] = useState("all");

  // ── Auth user ──
  const [authUserId, setAuthUserId] = useState<string | null>(null);

  // ─── Load auth user ───────────────────────────────────────────────────────
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setAuthUserId(data.user?.id ?? null);
    });
  }, []);

  // ─── Fetch all data ───────────────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [
        { data: membersData },
        { data: booksData },
        { data: issuesData },
        { data: finesData },
      ] = await Promise.all([
        supabase.from("users").select("id, full_name, email, membership_number, is_active, role").order("full_name"),
        supabase.from("books").select("id, title, author, isbn, category, available_copies, total_copies, shelf_location").order("title"),
        supabase.from("book_issues").select("*").order("created_at", { ascending: false }),
        supabase.from("fines").select("*"),
      ]);

      setMembers((membersData as MemberRow[]) ?? []);
      setBooks((booksData as BookRow[]) ?? []);
      setFines((finesData as FineRow[]) ?? []);

      // Enrich issues
      const rawIssues = (issuesData as BookIssueRow[]) ?? [];
      const enriched: EnrichedIssue[] = rawIssues.map((issue) => {
        const book = (booksData as BookRow[])?.find((b) => b.id === issue.book_id);
        const member = (membersData as MemberRow[])?.find((m) => m.id === issue.user_id);
        const fine = (finesData as FineRow[])?.find((f) => f.issue_id === issue.id) ?? null;
        return {
          ...issue,
          book_title: book?.title,
          book_author: book?.author,
          member_name: member?.full_name,
          member_email: member?.email,
          fine,
        };
      });
      setIssues(enriched);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ─── Realtime subscription ────────────────────────────────────────────────
  useEffect(() => {
    const channel = supabase
      .channel("issue-return-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "book_issues" }, () => {
        fetchData();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchData]);

  // ─── Derived: due date ────────────────────────────────────────────────────
  const dueDate = useMemo(() => addDays(new Date(), DEFAULT_ISSUE_DAYS), []);

  // ─── Member autocomplete (issue tab) ─────────────────────────────────────
  const filteredMembers = useMemo(() => {
    if (!memberQuery.trim()) return [];
    const q = memberQuery.toLowerCase();
    return members.filter(
      (m) =>
        m.is_active &&
        (m.full_name.toLowerCase().includes(q) ||
          m.email.toLowerCase().includes(q) ||
          (m.membership_number ?? "").toLowerCase().includes(q))
    ).slice(0, 6);
  }, [members, memberQuery]);

  // ─── Book autocomplete (issue tab) ───────────────────────────────────────
  const filteredBooks = useMemo(() => {
    if (!bookQuery.trim()) return [];
    const q = bookQuery.toLowerCase();
    return books.filter(
      (b) =>
        b.available_copies > 0 &&
        (b.title.toLowerCase().includes(q) ||
          b.author.toLowerCase().includes(q) ||
          (b.isbn ?? "").toLowerCase().includes(q))
    ).slice(0, 6);
  }, [books, bookQuery]);

  // ─── Member autocomplete (return tab) ────────────────────────────────────
  const filteredReturnMembers = useMemo(() => {
    if (!returnMemberQuery.trim()) return [];
    const q = returnMemberQuery.toLowerCase();
    return members.filter(
      (m) =>
        m.full_name.toLowerCase().includes(q) ||
        m.email.toLowerCase().includes(q) ||
        (m.membership_number ?? "").toLowerCase().includes(q)
    ).slice(0, 6);
  }, [members, returnMemberQuery]);

  // ─── Active issues for selected return member ─────────────────────────────
  const memberActiveIssues = useMemo(() => {
    if (!returnSelectedMember) return [];
    return issues.filter(
      (i) => i.user_id === returnSelectedMember.id && (i.status === "issued" || i.status === "overdue")
    );
  }, [issues, returnSelectedMember]);

  // ─── Fine preview for selected return issue ───────────────────────────────
  const finePreview = useMemo(() => {
    if (!selectedIssueForReturn) return null;
    const overdue = calcOverdueDays(selectedIssueForReturn.due_date);
    if (overdue <= 0) return null;
    return { overdueDays: overdue, amount: overdue * FINE_RATE_PER_DAY };
  }, [selectedIssueForReturn]);

  // ─── Transaction log filtered ─────────────────────────────────────────────
  const filteredLog = useMemo(() => {
    let list = issues;
    if (logStatusFilter !== "all") list = list.filter((i) => i.status === logStatusFilter);
    if (logSearch.trim()) {
      const q = logSearch.toLowerCase();
      list = list.filter(
        (i) =>
          (i.member_name ?? "").toLowerCase().includes(q) ||
          (i.book_title ?? "").toLowerCase().includes(q) ||
          (i.member_email ?? "").toLowerCase().includes(q)
      );
    }
    return list;
  }, [issues, logSearch, logStatusFilter]);

  // ─── Issue submission ─────────────────────────────────────────────────────
  async function handleIssueSubmit() {
    if (!selectedMember || !selectedBook || !authUserId) return;
    setIssueSubmitting(true);
    try {
      const now = new Date().toISOString();
      const due = dueDate.toISOString();

      const { data: issueData, error: issueError } = await supabase
        .from("book_issues")
        .insert({
          book_id: selectedBook.id,
          user_id: selectedMember.id,
          issued_by: authUserId,
          issue_date: now,
          due_date: due,
          status: "issued",
          remarks: issueRemarks || null,
        })
        .select()
        .single();

      if (issueError) throw issueError;

      // Decrement available_copies
      await supabase
        .from("books")
        .update({ available_copies: selectedBook.available_copies - 1, updated_at: now })
        .eq("id", selectedBook.id);

      // Log activity
      await supabase.from("activity_logs").insert({
        actor_id: authUserId,
        action_type: "book_issued",
        entity_type: "book_issues",
        entity_id: issueData?.id ?? null,
        description: `Issued "${selectedBook.title}" to ${selectedMember.full_name}`,
        metadata: { book_id: selectedBook.id, user_id: selectedMember.id },
      });

      setIssueSuccess(true);
      await fetchData();
      setTimeout(() => {
        setShowIssueModal(false);
        setIssueSuccess(false);
        setSelectedMember(null);
        setSelectedBook(null);
        setMemberQuery("");
        setBookQuery("");
        setIssueRemarks("");
      }, 1500);
    } catch (err) {
      console.error("Issue error:", err);
    } finally {
      setIssueSubmitting(false);
    }
  }

  // ─── Return submission ────────────────────────────────────────────────────
  async function handleReturnSubmit() {
    if (!selectedIssueForReturn || !authUserId) return;
    setReturnSubmitting(true);
    try {
      const now = new Date().toISOString();
      const overdue = calcOverdueDays(selectedIssueForReturn.due_date);
      const newStatus = overdue > 0 ? "overdue" : "returned";

      await supabase
        .from("book_issues")
        .update({
          return_date: now,
          status: newStatus,
          remarks: returnRemarks || null,
          updated_at: now,
        })
        .eq("id", selectedIssueForReturn.id);

      // Increment available_copies
      const book = books.find((b) => b.id === selectedIssueForReturn.book_id);
      if (book) {
        await supabase
          .from("books")
          .update({ available_copies: book.available_copies + 1, updated_at: now })
          .eq("id", book.id);
      }

      // Create fine if overdue
      if (overdue > 0) {
        const totalFine = overdue * FINE_RATE_PER_DAY;
        await supabase.from("fines").insert({
          issue_id: selectedIssueForReturn.id,
          user_id: selectedIssueForReturn.user_id,
          overdue_days: overdue,
          fine_per_day: FINE_RATE_PER_DAY,
          total_amount: totalFine,
          status: "pending",
        });
      }

      // Log activity
      await supabase.from("activity_logs").insert({
        actor_id: authUserId,
        action_type: "book_returned",
        entity_type: "book_issues",
        entity_id: selectedIssueForReturn.id,
        description: `Returned "${selectedIssueForReturn.book_title}" from ${selectedIssueForReturn.member_name}`,
        metadata: { overdue_days: overdue, fine_amount: overdue * FINE_RATE_PER_DAY },
      });

      setReturnSuccess(true);
      await fetchData();
      setTimeout(() => {
        setShowReturnModal(false);
        setReturnSuccess(false);
        setSelectedIssueForReturn(null);
        setReturnSelectedMember(null);
        setReturnMemberQuery("");
        setReturnCondition("good");
        setReturnRemarks("");
      }, 1500);
    } catch (err) {
      console.error("Return error:", err);
    } finally {
      setReturnSubmitting(false);
    }
  }

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <main className="min-h-screen bg-[var(--bg-cream)] pb-16">
      {/* ── Page Header ── */}
      <Reveal>
        <div className="bg-[var(--brand-navy)] px-6 py-10 md:px-12">
          <div className="mx-auto max-w-6xl">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--brand-gold)]/20">
                <BookOpen className="h-5 w-5 text-[var(--brand-gold)]" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-white">Issue &amp; Return</h1>
                <p className="text-sm text-white/60">Manage book issue and return transactions</p>
              </div>
            </div>
          </div>
        </div>
      </Reveal>

      <div className="mx-auto max-w-6xl px-4 md:px-8">
        {/* ── Tabs ── */}
        <Reveal>
          <div className="mt-8 flex gap-1 rounded-xl border border-[var(--border-light)] bg-white p-1 shadow-sm">
            {(["issue", "return"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`relative flex flex-1 items-center justify-center gap-2 rounded-lg px-6 py-3 text-sm font-semibold transition-all duration-200 ${
                  activeTab === tab
                    ? "bg-[var(--brand-navy)] text-white shadow"
                    : "text-[var(--text-muted)] hover:bg-[var(--bg-cream)] hover:text-[var(--brand-navy)]"
                }`}
              >
                {tab === "issue" ? <ArrowRight className="h-4 w-4" /> : <ArrowLeft className="h-4 w-4" />}
                {tab === "issue" ? "Issue Book" : "Return Book"}
              </button>
            ))}
          </div>
        </Reveal>

        {/* ── Tab Content ── */}
        <AnimatePresence mode="wait">
          {activeTab === "issue" ? (
            <motion.div
              key="issue"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.25 }}
              className="mt-6"
            >
              <IssueTab
                members={filteredMembers}
                books={filteredBooks}
                memberQuery={memberQuery}
                setMemberQuery={setMemberQuery}
                selectedMember={selectedMember}
                setSelectedMember={setSelectedMember}
                showMemberDropdown={showMemberDropdown}
                setShowMemberDropdown={setShowMemberDropdown}
                bookQuery={bookQuery}
                setBookQuery={setBookQuery}
                selectedBook={selectedBook}
                setSelectedBook={setSelectedBook}
                showBookDropdown={showBookDropdown}
                setShowBookDropdown={setShowBookDropdown}
                issueRemarks={issueRemarks}
                setIssueRemarks={setIssueRemarks}
                dueDate={dueDate}
                onConfirm={() => setShowIssueModal(true)}
              />
            </motion.div>
          ) : (
            <motion.div
              key="return"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.25 }}
              className="mt-6"
            >
              <ReturnTab
                members={filteredReturnMembers}
                memberQuery={returnMemberQuery}
                setMemberQuery={setReturnMemberQuery}
                selectedMember={returnSelectedMember}
                setSelectedMember={setReturnSelectedMember}
                showMemberDropdown={showReturnMemberDropdown}
                setShowMemberDropdown={setShowReturnMemberDropdown}
                activeIssues={memberActiveIssues}
                selectedIssue={selectedIssueForReturn}
                setSelectedIssue={setSelectedIssueForReturn}
                returnCondition={returnCondition}
                setReturnCondition={setReturnCondition}
                returnRemarks={returnRemarks}
                setReturnRemarks={setReturnRemarks}
                finePreview={finePreview}
                onConfirm={() => setShowReturnModal(true)}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Transaction Log ── */}
        <Reveal className="mt-12">
          <div className="rounded-2xl border border-[var(--border-light)] bg-white shadow-sm">
            <div className="border-b border-[var(--border-light)] px-6 py-5">
              <h2 className="text-lg font-bold text-[var(--brand-navy)]">Transaction Log</h2>
              <p className="mt-0.5 text-sm text-[var(--text-muted)]">All book issue and return records</p>
            </div>

            {/* Filters */}
            <div className="flex flex-col gap-3 border-b border-[var(--border-light)] px-6 py-4 sm:flex-row sm:items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" />
                <input
                  value={logSearch}
                  onChange={(e) => setLogSearch(e.target.value)}
                  placeholder="Search by member or book..."
                  className="w-full rounded-lg border border-[var(--border-light)] bg-[var(--bg-cream)] py-2 pl-9 pr-4 text-sm text-[var(--brand-navy)] placeholder:text-[var(--text-muted)] focus:border-[var(--brand-navy)] focus:outline-none"
                />
              </div>
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" />
                <select
                  value={logStatusFilter}
                  onChange={(e) => setLogStatusFilter(e.target.value)}
                  className="appearance-none rounded-lg border border-[var(--border-light)] bg-[var(--bg-cream)] py-2 pl-9 pr-8 text-sm text-[var(--brand-navy)] focus:border-[var(--brand-navy)] focus:outline-none"
                >
                  <option value="all">All Statuses</option>
                  <option value="issued">Issued</option>
                  <option value="returned">Returned</option>
                  <option value="overdue">Overdue</option>
                </select>
                <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" />
              </div>
            </div>

            {/* Table */}
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--brand-gold)] border-t-transparent" />
              </div>
            ) : filteredLog.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <BookOpen className="mb-3 h-10 w-10 text-[var(--text-muted)]" />
                <p className="text-sm font-medium text-[var(--brand-navy)]">No transactions found</p>
                <p className="mt-1 text-xs text-[var(--text-muted)]">Try adjusting your search or filter</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[var(--border-light)] bg-[var(--bg-cream)]">
                      {["Member", "Book", "Issue Date", "Due Date", "Return Date", "Status", "Fine"].map((h) => (
                        <th key={h} className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border-light)]">
                    {filteredLog.map((issue) => (
                      <tr key={issue.id} className="hover:bg-[var(--bg-cream)]/60 transition-colors">
                        <td className="px-5 py-3.5">
                          <div className="font-medium text-[var(--brand-navy)]">{issue.member_name ?? "—"}</div>
                          <div className="text-xs text-[var(--text-muted)]">{issue.member_email ?? ""}</div>
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="font-medium text-[var(--brand-navy)]">{issue.book_title ?? "—"}</div>
                          <div className="text-xs text-[var(--text-muted)]">{issue.book_author ?? ""}</div>
                        </td>
                        <td className="px-5 py-3.5 text-[var(--brand-navy)]">{formatDate(issue.issue_date)}</td>
                        <td className="px-5 py-3.5 text-[var(--brand-navy)]">{formatDate(issue.due_date)}</td>
                        <td className="px-5 py-3.5 text-[var(--brand-navy)]">{formatDate(issue.return_date)}</td>
                        <td className="px-5 py-3.5">
                          <StatusBadge status={issue.status} />
                        </td>
                        <td className="px-5 py-3.5">
                          {issue.fine ? (
                            <span className={`text-xs font-semibold ${issue.fine.status === "paid" ? "text-green-600" : issue.fine.status === "waived" ? "text-gray-500" : "text-red-600"}`}>
                              PKR {issue.fine.total_amount}
                              <span className="ml-1 font-normal text-[var(--text-muted)]">({issue.fine.status})</span>
                            </span>
                          ) : (
                            <span className="text-[var(--text-muted)]">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {filteredLog.length > 0 && (
              <div className="border-t border-[var(--border-light)] px-6 py-3 text-xs text-[var(--text-muted)]">
                Showing {filteredLog.length} record{filteredLog.length !== 1 ? "s" : ""}
              </div>
            )}
          </div>
        </Reveal>
      </div>

      {/* ── Issue Confirmation Modal ── */}
      <AnimatePresence>
        {showIssueModal && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            variants={modalOverlay}
            initial="hidden"
            animate="visible"
            exit="hidden"
          >
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => !issueSubmitting && setShowIssueModal(false)} />
            <motion.div
              className="relative z-10 w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
              variants={modalContent}
              initial="hidden"
              animate="visible"
              exit="hidden"
            >
              {issueSuccess ? (
                <div className="flex flex-col items-center py-6 text-center">
                  <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                    <CheckCircle className="h-8 w-8 text-green-600" />
                  </div>
                  <h3 className="text-lg font-bold text-[var(--brand-navy)]">Book Issued Successfully</h3>
                  <p className="mt-1 text-sm text-[var(--text-muted)]">Transaction recorded in the system.</p>
                </div>
              ) : (
                <>
                  <div className="mb-5 flex items-center justify-between">
                    <h3 className="text-lg font-bold text-[var(--brand-navy)]">Confirm Issue</h3>
                    <button onClick={() => setShowIssueModal(false)} className="rounded-lg p-1.5 hover:bg-[var(--bg-cream)] transition-colors">
                      <X className="h-5 w-5 text-[var(--text-muted)]" />
                    </button>
                  </div>
                  <div className="space-y-3 rounded-xl bg-[var(--bg-cream)] p-4">
                    <SummaryRow icon={<User className="h-4 w-4" />} label="Member" value={selectedMember?.full_name ?? ""} sub={selectedMember?.membership_number ?? selectedMember?.email ?? ""} />
                    <SummaryRow icon={<BookOpen className="h-4 w-4" />} label="Book" value={selectedBook?.title ?? ""} sub={selectedBook?.author ?? ""} />
                    <SummaryRow icon={<Calendar className="h-4 w-4" />} label="Issue Date" value={new Date().toLocaleDateString("en-PK", { day: "2-digit", month: "short", year: "numeric" })} />
                    <SummaryRow icon={<Clock className="h-4 w-4" />} label="Due Date" value={dueDate.toLocaleDateString("en-PK", { day: "2-digit", month: "short", year: "numeric" })} sub={`${DEFAULT_ISSUE_DAYS}-day loan period`} />
                    {issueRemarks && <SummaryRow icon={<AlertCircle className="h-4 w-4" />} label="Remarks" value={issueRemarks} />}
                  </div>
                  <div className="mt-5 flex gap-3">
                    <button
                      onClick={() => setShowIssueModal(false)}
                      disabled={issueSubmitting}
                      className="flex-1 rounded-xl border border-[var(--border-light)] py-2.5 text-sm font-semibold text-[var(--brand-navy)] hover:bg-[var(--bg-cream)] transition-colors disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleIssueSubmit}
                      disabled={issueSubmitting}
                      className="flex-1 rounded-xl bg-[var(--brand-navy)] py-2.5 text-sm font-semibold text-white hover:bg-[var(--brand-navy)]/90 transition-colors disabled:opacity-50"
                    >
                      {issueSubmitting ? "Processing..." : "Confirm Issue"}
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Return Confirmation Modal ── */}
      <AnimatePresence>
        {showReturnModal && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            variants={modalOverlay}
            initial="hidden"
            animate="visible"
            exit="hidden"
          >
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => !returnSubmitting && setShowReturnModal(false)} />
            <motion.div
              className="relative z-10 w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
              variants={modalContent}
              initial="hidden"
              animate="visible"
              exit="hidden"
            >
              {returnSuccess ? (
                <div className="flex flex-col items-center py-6 text-center">
                  <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                    <CheckCircle className="h-8 w-8 text-green-600" />
                  </div>
                  <h3 className="text-lg font-bold text-[var(--brand-navy)]">Book Returned Successfully</h3>
                  <p className="mt-1 text-sm text-[var(--text-muted)]">
                    {finePreview ? `Fine of PKR ${finePreview.amount} has been recorded.` : "No fine applicable."}
                  </p>
                </div>
              ) : (
                <>
                  <div className="mb-5 flex items-center justify-between">
                    <h3 className="text-lg font-bold text-[var(--brand-navy)]">Confirm Return</h3>
                    <button onClick={() => setShowReturnModal(false)} className="rounded-lg p-1.5 hover:bg-[var(--bg-cream)] transition-colors">
                      <X className="h-5 w-5 text-[var(--text-muted)]" />
                    </button>
                  </div>
                  <div className="space-y-3 rounded-xl bg-[var(--bg-cream)] p-4">
                    <SummaryRow icon={<User className="h-4 w-4" />} label="Member" value={returnSelectedMember?.full_name ?? ""} />
                    <SummaryRow icon={<BookOpen className="h-4 w-4" />} label="Book" value={selectedIssueForReturn?.book_title ?? ""} sub={selectedIssueForReturn?.book_author ?? ""} />
                    <SummaryRow icon={<Calendar className="h-4 w-4" />} label="Due Date" value={formatDate(selectedIssueForReturn?.due_date)} />
                    <SummaryRow icon={<Calendar className="h-4 w-4" />} label="Return Date" value={new Date().toLocaleDateString("en-PK", { day: "2-digit", month: "short", year: "numeric" })} />
                    <SummaryRow icon={<Check className="h-4 w-4" />} label="Condition" value={returnCondition.charAt(0).toUpperCase() + returnCondition.slice(1)} />
                    {returnRemarks && <SummaryRow icon={<AlertCircle className="h-4 w-4" />} label="Remarks" value={returnRemarks} />}
                  </div>
                  {finePreview && (
                    <div className="mt-3 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
                      <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-500" />
                      <div>
                        <p className="text-sm font-semibold text-red-700">Overdue Fine Applicable</p>
                        <p className="mt-0.5 text-xs text-red-600">
                          {finePreview.overdueDays} day{finePreview.overdueDays !== 1 ? "s" : ""} overdue at PKR {FINE_RATE_PER_DAY}/day
                        </p>
                        <p className="mt-1 text-base font-bold text-red-700">Total: PKR {finePreview.amount}</p>
                      </div>
                    </div>
                  )}
                  <div className="mt-5 flex gap-3">
                    <button
                      onClick={() => setShowReturnModal(false)}
                      disabled={returnSubmitting}
                      className="flex-1 rounded-xl border border-[var(--border-light)] py-2.5 text-sm font-semibold text-[var(--brand-navy)] hover:bg-[var(--bg-cream)] transition-colors disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleReturnSubmit}
                      disabled={returnSubmitting}
                      className="flex-1 rounded-xl bg-[var(--brand-navy)] py-2.5 text-sm font-semibold text-white hover:bg-[var(--brand-navy)]/90 transition-colors disabled:opacity-50"
                    >
                      {returnSubmitting ? "Processing..." : "Confirm Return"}
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}

// ─── Summary Row ──────────────────────────────────────────────────────────────

function SummaryRow({
  icon,
  label,
  value,
  sub,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-[var(--brand-navy)]/10 text-[var(--brand-navy)]">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-[var(--text-muted)]">{label}</p>
        <p className="truncate text-sm font-semibold text-[var(--brand-navy)]">{value}</p>
        {sub && <p className="text-xs text-[var(--text-muted)]">{sub}</p>}
      </div>
    </div>
  );
}

// ─── Issue Tab ────────────────────────────────────────────────────────────────

interface IssueTabProps {
  members: MemberRow[];
  books: BookRow[];
  memberQuery: string;
  setMemberQuery: (v: string) => void;
  selectedMember: MemberRow | null;
  setSelectedMember: (m: MemberRow | null) => void;
  showMemberDropdown: boolean;
  setShowMemberDropdown: (v: boolean) => void;
  bookQuery: string;
  setBookQuery: (v: string) => void;
  selectedBook: BookRow | null;
  setSelectedBook: (b: BookRow | null) => void;
  showBookDropdown: boolean;
  setShowBookDropdown: (v: boolean) => void;
  issueRemarks: string;
  setIssueRemarks: (v: string) => void;
  dueDate: Date;
  onConfirm: () => void;
}

function IssueTab({
  members,
  books,
  memberQuery,
  setMemberQuery,
  selectedMember,
  setSelectedMember,
  showMemberDropdown,
  setShowMemberDropdown,
  bookQuery,
  setBookQuery,
  selectedBook,
  setSelectedBook,
  showBookDropdown,
  setShowBookDropdown,
  issueRemarks,
  setIssueRemarks,
  dueDate,
  onConfirm,
}: IssueTabProps) {
  const canSubmit = selectedMember && selectedBook;

  return (
    <div className="rounded-2xl border border-[var(--border-light)] bg-white p-6 shadow-sm">
      <h2 className="mb-6 text-base font-bold text-[var(--brand-navy)]">Issue a Book</h2>
      <div className="grid gap-6 md:grid-cols-2">
        {/* Member Search */}
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
            Library Member
          </label>
          {selectedMember ? (
            <div className="flex items-center justify-between rounded-xl border border-[var(--brand-gold)] bg-[var(--brand-gold)]/5 px-4 py-3">
              <div>
                <p className="text-sm font-semibold text-[var(--brand-navy)]">{selectedMember.full_name}</p>
                <p className="text-xs text-[var(--text-muted)]">{selectedMember.membership_number ?? selectedMember.email}</p>
              </div>
              <button
                onClick={() => { setSelectedMember(null); setMemberQuery(""); }}
                className="rounded-lg p-1 hover:bg-[var(--bg-cream)] transition-colors"
              >
                <X className="h-4 w-4 text-[var(--text-muted)]" />
              </button>
            </div>
          ) : (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" />
              <input
                value={memberQuery}
                onChange={(e) => { setMemberQuery(e.target.value); setShowMemberDropdown(true); }}
                onFocus={() => setShowMemberDropdown(true)}
                onBlur={() => setTimeout(() => setShowMemberDropdown(false), 150)}
                placeholder="Search by name, email, or ID..."
                className="w-full rounded-xl border border-[var(--border-light)] bg-[var(--bg-cream)] py-3 pl-9 pr-4 text-sm text-[var(--brand-navy)] placeholder:text-[var(--text-muted)] focus:border-[var(--brand-navy)] focus:outline-none"
              />
              <AnimatePresence>
                {showMemberDropdown && members.length > 0 && (
                  <motion.ul
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.15 }}
                    className="absolute z-20 mt-1 w-full overflow-hidden rounded-xl border border-[var(--border-light)] bg-white shadow-lg"
                  >
                    {members.map((m) => (
                      <li key={m.id}>
                        <button
                          onMouseDown={() => { setSelectedMember(m); setMemberQuery(""); setShowMemberDropdown(false); }}
                          className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-[var(--bg-cream)] transition-colors"
                        >
                          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-[var(--brand-navy)]/10 text-xs font-bold text-[var(--brand-navy)]">
                            {m.full_name.charAt(0)}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-[var(--brand-navy)]">{m.full_name}</p>
                            <p className="text-xs text-[var(--text-muted)]">{m.membership_number ?? m.email}</p>
                          </div>
                        </button>
                      </li>
                    ))}
                  </motion.ul>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* Book Search */}
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
            Book
          </label>
          {selectedBook ? (
            <div className="flex items-center justify-between rounded-xl border border-[var(--brand-gold)] bg-[var(--brand-gold)]/5 px-4 py-3">
              <div>
                <p className="text-sm font-semibold text-[var(--brand-navy)]">{selectedBook.title}</p>
                <p className="text-xs text-[var(--text-muted)]">{selectedBook.author} · {selectedBook.available_copies} available</p>
              </div>
              <button
                onClick={() => { setSelectedBook(null); setBookQuery(""); }}
                className="rounded-lg p-1 hover:bg-[var(--bg-cream)] transition-colors"
              >
                <X className="h-4 w-4 text-[var(--text-muted)]" />
              </button>
            </div>
          ) : (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" />
              <input
                value={bookQuery}
                onChange={(e) => { setBookQuery(e.target.value); setShowBookDropdown(true); }}
                onFocus={() => setShowBookDropdown(true)}
                onBlur={() => setTimeout(() => setShowBookDropdown(false), 150)}
                placeholder="Search by title, author, or ISBN..."
                className="w-full rounded-xl border border-[var(--border-light)] bg-[var(--bg-cream)] py-3 pl-9 pr-4 text-sm text-[var(--brand-navy)] placeholder:text-[var(--text-muted)] focus:border-[var(--brand-navy)] focus:outline-none"
              />
              <AnimatePresence>
                {showBookDropdown && books.length > 0 && (
                  <motion.ul
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.15 }}
                    className="absolute z-20 mt-1 w-full overflow-hidden rounded-xl border border-[var(--border-light)] bg-white shadow-lg"
                  >
                    {books.map((b) => (
                      <li key={b.id}>
                        <button
                          onMouseDown={() => { setSelectedBook(b); setBookQuery(""); setShowBookDropdown(false); }}
                          className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-[var(--bg-cream)] transition-colors"
                        >
                          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-[var(--brand-gold)]/20">
                            <BookOpen className="h-4 w-4 text-[var(--brand-gold)]" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold text-[var(--brand-navy)]">{b.title}</p>
                            <p className="text-xs text-[var(--text-muted)]">{b.author} · {b.available_copies}/{b.total_copies} available</p>
                          </div>
                        </button>
                      </li>
                    ))}
                  </motion.ul>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* Due Date (auto) */}
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
            Due Date (Auto-calculated)
          </label>
          <div className="flex items-center gap-3 rounded-xl border border-[var(--border-light)] bg-[var(--bg-cream)] px-4 py-3">
            <Calendar className="h-4 w-4 text-[var(--brand-gold)]" />
            <span className="text-sm font-semibold text-[var(--brand-navy)]">
              {dueDate.toLocaleDateString("en-PK", { day: "2-digit", month: "long", year: "numeric" })}
            </span>
            <span className="ml-auto text-xs text-[var(--text-muted)]">{DEFAULT_ISSUE_DAYS} days</span>
          </div>
        </div>

        {/* Remarks */}
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
            Remarks (Optional)
          </label>
          <input
            value={issueRemarks}
            onChange={(e) => setIssueRemarks(e.target.value)}
            placeholder="Any notes about this issue..."
            className="w-full rounded-xl border border-[var(--border-light)] bg-[var(--bg-cream)] px-4 py-3 text-sm text-[var(--brand-navy)] placeholder:text-[var(--text-muted)] focus:border-[var(--brand-navy)] focus:outline-none"
          />
        </div>
      </div>

      <div className="mt-6 flex justify-end">
        <motion.button
          whileHover={{ scale: canSubmit ? 1.02 : 1 }}
          whileTap={{ scale: canSubmit ? 0.98 : 1 }}
          onClick={onConfirm}
          disabled={!canSubmit}
          className="flex items-center gap-2 rounded-xl bg-[var(--brand-navy)] px-8 py-3 text-sm font-semibold text-white shadow transition-all hover:bg-[var(--brand-navy)]/90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ArrowRight className="h-4 w-4" />
          Issue Book
        </motion.button>
      </div>
    </div>
  );
}

// ─── Return Tab ───────────────────────────────────────────────────────────────

interface ReturnTabProps {
  members: MemberRow[];
  memberQuery: string;
  setMemberQuery: (v: string) => void;
  selectedMember: MemberRow | null;
  setSelectedMember: (m: MemberRow | null) => void;
  showMemberDropdown: boolean;
  setShowMemberDropdown: (v: boolean) => void;
  activeIssues: EnrichedIssue[];
  selectedIssue: EnrichedIssue | null;
  setSelectedIssue: (i: EnrichedIssue | null) => void;
  returnCondition: string;
  setReturnCondition: (v: string) => void;
  returnRemarks: string;
  setReturnRemarks: (v: string) => void;
  finePreview: { overdueDays: number; amount: number } | null;
  onConfirm: () => void;
}

function ReturnTab({
  members,
  memberQuery,
  setMemberQuery,
  selectedMember,
  setSelectedMember,
  showMemberDropdown,
  setShowMemberDropdown,
  activeIssues,
  selectedIssue,
  setSelectedIssue,
  returnCondition,
  setReturnCondition,
  returnRemarks,
  setReturnRemarks,
  finePreview,
  onConfirm,
}: ReturnTabProps) {
  const canSubmit = selectedMember && selectedIssue;

  return (
    <div className="rounded-2xl border border-[var(--border-light)] bg-white p-6 shadow-sm">
      <h2 className="mb-6 text-base font-bold text-[var(--brand-navy)]">Return a Book</h2>

      {/* Member Search */}
      <div className="mb-6">
        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
          Select Member
        </label>
        {selectedMember ? (
          <div className="flex items-center justify-between rounded-xl border border-[var(--brand-gold)] bg-[var(--brand-gold)]/5 px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-[var(--brand-navy)]">{selectedMember.full_name}</p>
              <p className="text-xs text-[var(--text-muted)]">{selectedMember.membership_number ?? selectedMember.email}</p>
            </div>
            <button
              onClick={() => { setSelectedMember(null); setMemberQuery(""); setSelectedIssue(null); }}
              className="rounded-lg p-1 hover:bg-[var(--bg-cream)] transition-colors"
            >
              <X className="h-4 w-4 text-[var(--text-muted)]" />
            </button>
          </div>
        ) : (
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" />
            <input
              value={memberQuery}
              onChange={(e) => { setMemberQuery(e.target.value); setShowMemberDropdown(true); }}
              onFocus={() => setShowMemberDropdown(true)}
              onBlur={() => setTimeout(() => setShowMemberDropdown(false), 150)}
              placeholder="Search member by name, email, or ID..."
              className="w-full rounded-xl border border-[var(--border-light)] bg-[var(--bg-cream)] py-3 pl-9 pr-4 text-sm text-[var(--brand-navy)] placeholder:text-[var(--text-muted)] focus:border-[var(--brand-navy)] focus:outline-none"
            />
            <AnimatePresence>
              {showMemberDropdown && members.length > 0 && (
                <motion.ul
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.15 }}
                  className="absolute z-20 mt-1 w-full overflow-hidden rounded-xl border border-[var(--border-light)] bg-white shadow-lg"
                >
                  {members.map((m) => (
                    <li key={m.id}>
                      <button
                        onMouseDown={() => { setSelectedMember(m); setMemberQuery(""); setShowMemberDropdown(false); }}
                        className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-[var(--bg-cream)] transition-colors"
                      >
                        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-[var(--brand-navy)]/10 text-xs font-bold text-[var(--brand-navy)]">
                          {m.full_name.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-[var(--brand-navy)]">{m.full_name}</p>
                          <p className="text-xs text-[var(--text-muted)]">{m.membership_number ?? m.email}</p>
                        </div>
                      </button>
                    </li>
                  ))}
                </motion.ul>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Active Issues List */}
      {selectedMember && (
        <div className="mb-6">
          <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
            Currently Issued Books ({activeIssues.length})
          </label>
          {activeIssues.length === 0 ? (
            <div className="flex items-center gap-3 rounded-xl border border-[var(--border-light)] bg-[var(--bg-cream)] px-4 py-4">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <p className="text-sm text-[var(--text-muted)]">No active issues for this member.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {activeIssues.map((issue) => {
                const overdue = calcOverdueDays(issue.due_date);
                const isSelected = selectedIssue?.id === issue.id;
                return (
                  <button
                    key={issue.id}
                    onClick={() => setSelectedIssue(isSelected ? null : issue)}
                    className={`w-full rounded-xl border px-4 py-3 text-left transition-all ${
                      isSelected
                        ? "border-[var(--brand-navy)] bg-[var(--brand-navy)]/5"
                        : "border-[var(--border-light)] bg-[var(--bg-cream)] hover:border-[var(--brand-navy)]/40"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-[var(--brand-navy)]">{issue.book_title}</p>
                        <p className="text-xs text-[var(--text-muted)]">{issue.book_author}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <StatusBadge status={issue.status} />
                        {overdue > 0 && (
                          <span className="text-xs font-semibold text-red-600">
                            {overdue}d overdue · PKR {overdue * FINE_RATE_PER_DAY}
                          </span>
                        )}
                        <span className="text-xs text-[var(--text-muted)]">Due: {formatDate(issue.due_date)}</span>
                      </div>
                    </div>
                    {isSelected && (
                      <div className="mt-1 flex items-center gap-1.5 text-xs font-medium text-[var(--brand-navy)]">
                        <Check className="h-3.5 w-3.5" /> Selected for return
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Return Form */}
      {selectedIssue && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="mb-6 grid gap-4 md:grid-cols-2"
        >
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
              Book Condition
            </label>
            <div className="relative">
              <select
                value={returnCondition}
                onChange={(e) => setReturnCondition(e.target.value)}
                className="w-full appearance-none rounded-xl border border-[var(--border-light)] bg-[var(--bg-cream)] px-4 py-3 pr-8 text-sm text-[var(--brand-navy)] focus:border-[var(--brand-navy)] focus:outline-none"
              >
                <option value="good">Good</option>
                <option value="fair">Fair</option>
                <option value="damaged">Damaged</option>
                <option value="lost">Lost</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" />
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
              Remarks (Optional)
            </label>
            <input
              value={returnRemarks}
              onChange={(e) => setReturnRemarks(e.target.value)}
              placeholder="Any notes about the return..."
              className="w-full rounded-xl border border-[var(--border-light)] bg-[var(--bg-cream)] px-4 py-3 text-sm text-[var(--brand-navy)] placeholder:text-[var(--text-muted)] focus:border-[var(--brand-navy)] focus:outline-none"
            />
          </div>
        </motion.div>
      )}

      {/* Fine Preview */}
      {finePreview && (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mb-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4"
        >
          <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-500" />
          <div>
            <p className="text-sm font-semibold text-red-700">Overdue Fine Preview</p>
            <p className="mt-0.5 text-xs text-red-600">
              {finePreview.overdueDays} day{finePreview.overdueDays !== 1 ? "s" : ""} overdue at PKR {FINE_RATE_PER_DAY}/day
            </p>
            <p className="mt-1 text-base font-bold text-red-700">Fine: PKR {finePreview.amount}</p>
            <p className="mt-0.5 text-xs text-red-500">This fine will be recorded automatically on return.</p>
          </div>
        </motion.div>
      )}

      <div className="flex justify-end">
        <motion.button
          whileHover={{ scale: canSubmit ? 1.02 : 1 }}
          whileTap={{ scale: canSubmit ? 0.98 : 1 }}
          onClick={onConfirm}
          disabled={!canSubmit}
          className="flex items-center gap-2 rounded-xl bg-[var(--brand-navy)] px-8 py-3 text-sm font-semibold text-white shadow transition-all hover:bg-[var(--brand-navy)]/90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ArrowLeft className="h-4 w-4" />
          Return Book
        </motion.button>
      </div>
    </div>
  );
}