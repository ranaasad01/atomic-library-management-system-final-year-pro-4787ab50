"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { Reveal } from "@/components/Reveal";
import { fadeInUp, staggerContainer, scaleIn, modalVariants, overlayVariants } from "@/lib/motion";
import { Search, Plus, Edit, Trash2, X, BookOpen, AlertCircle, Filter, Save, RefreshCw, Library, Hash, User, Tag, Building2, Calendar, Layers, MapPin, FileText, ChevronRight } from 'lucide-react';
import { cn } from "@/lib/utils";
import type { Database } from "@/types/supabase";

type BookRow = Database["public"]["Tables"]["books"]["Row"];

const BOOK_CATEGORIES = [
  "All",
  "Computer Science",
  "Mathematics",
  "Physics",
  "Chemistry",
  "Biology",
  "Economics",
  "Business Administration",
  "Literature",
  "History",
  "Philosophy",
  "Engineering",
  "Medicine",
  "Law",
  "Social Sciences",
  "Other",
] as const;

const AVAILABILITY_FILTERS = ["All", "Available", "Unavailable"] as const;

const EMPTY_FORM = {
  title: "",
  author: "",
  isbn: "",
  category: "",
  publisher: "",
  publication_year: "",
  total_copies: "1",
  available_copies: "1",
  shelf_location: "",
  description: "",
};

type FormState = typeof EMPTY_FORM;

// ─── Status Badge ────────────────────────────────────────────────────────────

function StatusBadge({ available, total }: { available: number; total: number }) {
  const pct = total > 0 ? available / total : 0;
  const color =
    pct === 0
      ? "bg-red-100 text-red-700 border-red-200"
      : pct < 0.4
      ? "bg-amber-100 text-amber-700 border-amber-200"
      : "bg-emerald-100 text-emerald-700 border-emerald-200";
  const label =
    pct === 0 ? "Unavailable" : pct < 0.4 ? "Low Stock" : "Available";
  const dotColor = pct === 0 ? "bg-red-500" : pct < 0.4 ? "bg-amber-500" : "bg-emerald-500";
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold", color)}>
      <span className={cn("h-1.5 w-1.5 rounded-full", dotColor)} />
      {label}
    </span>
  );
}

// ─── Input Field ─────────────────────────────────────────────────────────────

function FormField({
  label,
  icon: Icon,
  required,
  children,
}: {
  label: string;
  icon?: React.ElementType;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold text-[#1e3a5f] uppercase tracking-wide flex items-center gap-1.5">
        {Icon && <Icon className="w-3.5 h-3.5 text-[#c8a96e]" />}
        {label}
        {required && <span className="text-red-500">*</span>}
      </label>
      {children}
    </div>
  );
}

const inputCls =
  "w-full rounded-xl border border-[#d6cfc2] bg-[#f5f0e8]/60 px-3.5 py-2.5 text-sm text-[#1a2a3a] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#c8a96e]/50 focus:border-[#c8a96e] transition-all duration-200";

// ─── Book Form Modal ─────────────────────────────────────────────────────────

function BookFormModal({
  open,
  onClose,
  onSave,
  initial,
  mode,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (data: FormState) => Promise<void>;
  initial?: BookRow | null;
  mode: "add" | "edit";
}) {
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      if (initial && mode === "edit") {
        setForm({
          title: initial.title ?? "",
          author: initial.author ?? "",
          isbn: initial.isbn ?? "",
          category: initial.category ?? "",
          publisher: initial.publisher ?? "",
          publication_year: initial.publication_year?.toString() ?? "",
          total_copies: initial.total_copies?.toString() ?? "1",
          available_copies: initial.available_copies?.toString() ?? "1",
          shelf_location: initial.shelf_location ?? "",
          description: initial.description ?? "",
        });
      } else {
        setForm(EMPTY_FORM);
      }
      setError(null);
    }
  }, [open, initial, mode]);

  const set = (field: keyof FormState, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.author.trim()) {
      setError("Title and Author are required.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await onSave(form);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save book.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
            variants={overlayVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            variants={overlayVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
          >
            <motion.div
              className="relative w-full max-w-2xl max-h-[90vh] overflow-hidden rounded-2xl bg-white shadow-[0_8px_40px_-8px_rgba(30,58,95,0.35)] flex flex-col"
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div
                className="flex items-center justify-between px-6 py-5 flex-shrink-0"
                style={{ background: "linear-gradient(135deg, #1e3a5f 0%, #2a4f7c 100%)" }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center">
                    <BookOpen className="w-5 h-5 text-[#c8a96e]" />
                  </div>
                  <div>
                    <h2 className="text-white font-bold text-lg leading-tight">
                      {mode === "add" ? "Add New Book" : "Edit Book"}
                    </h2>
                    <p className="text-white/60 text-xs mt-0.5">
                      {mode === "add" ? "Fill in the details to add a book to the catalog" : "Update the book information below"}
                    </p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors duration-200"
                  aria-label="Close modal"
                >
                  <X className="w-4 h-4 text-white" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="overflow-y-auto flex-1 px-6 py-5">
                {error && (
                  <div className="mb-4 flex items-center gap-2.5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    <AlertCircle className="h-4 w-4 flex-shrink-0" />
                    {error}
                  </div>
                )}

                <form id="book-form" onSubmit={handleSubmit} className="space-y-4">
                  {/* Row 1: Title + Author */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField label="Title" icon={BookOpen} required>
                      <input
                        className={inputCls}
                        placeholder="e.g. Introduction to Algorithms"
                        value={form.title}
                        onChange={(e) => set("title", e.target.value)}
                        required
                      />
                    </FormField>
                    <FormField label="Author" icon={User} required>
                      <input
                        className={inputCls}
                        placeholder="e.g. Thomas H. Cormen"
                        value={form.author}
                        onChange={(e) => set("author", e.target.value)}
                        required
                      />
                    </FormField>
                  </div>

                  {/* Row 2: ISBN + Category */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField label="ISBN" icon={Hash}>
                      <input
                        className={inputCls}
                        placeholder="e.g. 978-0-262-03384-8"
                        value={form.isbn}
                        onChange={(e) => set("isbn", e.target.value)}
                      />
                    </FormField>
                    <FormField label="Category" icon={Tag}>
                      <select
                        className={inputCls}
                        value={form.category}
                        onChange={(e) => set("category", e.target.value)}
                      >
                        <option value="">Select category</option>
                        {BOOK_CATEGORIES.filter((c) => c !== "All").map((cat) => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                    </FormField>
                  </div>

                  {/* Row 3: Publisher + Year */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField label="Publisher" icon={Building2}>
                      <input
                        className={inputCls}
                        placeholder="e.g. MIT Press"
                        value={form.publisher}
                        onChange={(e) => set("publisher", e.target.value)}
                      />
                    </FormField>
                    <FormField label="Publication Year" icon={Calendar}>
                      <input
                        className={inputCls}
                        type="number"
                        placeholder="e.g. 2022"
                        min={1800}
                        max={new Date().getFullYear() + 1}
                        value={form.publication_year}
                        onChange={(e) => set("publication_year", e.target.value)}
                      />
                    </FormField>
                  </div>

                  {/* Row 4: Total Copies + Available Copies */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField label="Total Copies" icon={Layers}>
                      <input
                        className={inputCls}
                        type="number"
                        min={1}
                        value={form.total_copies}
                        onChange={(e) => set("total_copies", e.target.value)}
                      />
                    </FormField>
                    <FormField label="Available Copies" icon={Layers}>
                      <input
                        className={inputCls}
                        type="number"
                        min={0}
                        value={form.available_copies}
                        onChange={(e) => set("available_copies", e.target.value)}
                      />
                    </FormField>
                  </div>

                  {/* Row 5: Shelf Location */}
                  <FormField label="Shelf Location" icon={MapPin}>
                    <input
                      className={inputCls}
                      placeholder="e.g. CS-A3"
                      value={form.shelf_location}
                      onChange={(e) => set("shelf_location", e.target.value)}
                    />
                  </FormField>

                  {/* Row 6: Description */}
                  <FormField label="Description" icon={FileText}>
                    <textarea
                      className={cn(inputCls, "resize-none")}
                      rows={3}
                      placeholder="Brief description of the book..."
                      value={form.description}
                      onChange={(e) => set("description", e.target.value)}
                    />
                  </FormField>
                </form>
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[#d6cfc2] bg-[#f5f0e8]/50 flex-shrink-0">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl border border-[#d6cfc2] bg-white text-sm font-medium text-[#1a2a3a] hover:bg-[#f5f0e8] transition-all duration-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  form="book-form"
                  disabled={saving}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed shadow-[0_2px_8px_rgba(200,169,110,0.35)] hover:shadow-[0_4px_16px_rgba(200,169,110,0.45)] hover:scale-[1.02]"
                  style={{ background: "linear-gradient(135deg, #c8a96e 0%, #b8944f 100%)" }}
                >
                  {saving ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      {mode === "add" ? "Add Book" : "Save Changes"}
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ─── Delete Confirm Modal ─────────────────────────────────────────────────────

function DeleteConfirmModal({
  open,
  book,
  onClose,
  onConfirm,
  deleting,
}: {
  open: boolean;
  book: BookRow | null;
  onClose: () => void;
  onConfirm: () => void;
  deleting: boolean;
}) {
  return (
    <AnimatePresence>
      {open && book && (
        <>
          <motion.div
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
            variants={overlayVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            onClick={onClose}
          />
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            variants={overlayVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
          >
            <motion.div
              className="relative w-full max-w-md rounded-2xl bg-white shadow-[0_8px_40px_-8px_rgba(30,58,95,0.35)] overflow-hidden"
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center flex-shrink-0">
                    <Trash2 className="w-5 h-5 text-red-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-[#1e3a5f] text-lg">Delete Book</h3>
                    <p className="text-sm text-slate-500">This action cannot be undone.</p>
                  </div>
                </div>
                <p className="text-sm text-[#1a2a3a] mb-6">
                  Are you sure you want to delete{" "}
                  <span className="font-semibold">&ldquo;{book.title}&rdquo;</span>? All associated records may be affected.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={onClose}
                    className="flex-1 px-4 py-2.5 rounded-xl border border-[#d6cfc2] bg-white text-sm font-medium text-[#1a2a3a] hover:bg-[#f5f0e8] transition-all duration-200"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={onConfirm}
                    disabled={deleting}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-semibold transition-all duration-200 disabled:opacity-60"
                  >
                    {deleting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                    {deleting ? "Deleting..." : "Delete Book"}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function BookManagementPage() {
  const supabase = createClient();

  const [books, setBooks] = useState<BookRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("All");
  const [availabilityFilter, setAvailabilityFilter] = useState<string>("All");

  // Modal state
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<"add" | "edit">("add");
  const [editTarget, setEditTarget] = useState<BookRow | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<BookRow | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  // ─── Data Fetching ──────────────────────────────────────────────────────────

  const fetchBooks = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: fetchError } = await supabase
        .from("books")
        .select("*")
        .order("created_at", { ascending: false });
      if (fetchError) throw fetchError;
      setBooks(data ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load books.");
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchBooks();
  }, [fetchBooks]);

  // ─── Toast ──────────────────────────────────────────────────────────────────

  const showToast = (msg: string, type: "success" | "error") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  // ─── CRUD ───────────────────────────────────────────────────────────────────

  const handleSave = async (form: FormState) => {
    const payload = {
      title: form.title.trim(),
      author: form.author.trim(),
      isbn: form.isbn.trim() || null,
      category: form.category || null,
      publisher: form.publisher.trim() || null,
      publication_year: form.publication_year ? parseInt(form.publication_year, 10) : null,
      total_copies: parseInt(form.total_copies, 10) || 1,
      available_copies: parseInt(form.available_copies, 10) || 1,
      shelf_location: form.shelf_location.trim() || null,
      description: form.description.trim() || null,
    };

    if (formMode === "add") {
      const { error: insertError } = await supabase.from("books").insert([payload]);
      if (insertError) throw insertError;
      showToast("Book added successfully.", "success");
    } else if (editTarget) {
      const { error: updateError } = await supabase
        .from("books")
        .update(payload)
        .eq("id", editTarget.id);
      if (updateError) throw updateError;
      showToast("Book updated successfully.", "success");
    }
    await fetchBooks();
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const { error: deleteError } = await supabase
        .from("books")
        .delete()
        .eq("id", deleteTarget.id);
      if (deleteError) throw deleteError;
      showToast("Book deleted.", "success");
      setDeleteOpen(false);
      setDeleteTarget(null);
      await fetchBooks();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Delete failed.", "error");
    } finally {
      setDeleting(false);
    }
  };

  // ─── Filtering ──────────────────────────────────────────────────────────────

  const filtered = books.filter((b) => {
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      b.title.toLowerCase().includes(q) ||
      b.author.toLowerCase().includes(q) ||
      (b.isbn ?? "").toLowerCase().includes(q) ||
      (b.category ?? "").toLowerCase().includes(q);

    const matchCategory =
      categoryFilter === "All" || b.category === categoryFilter;

    const matchAvailability =
      availabilityFilter === "All" ||
      (availabilityFilter === "Available" && (b.available_copies ?? 0) > 0) ||
      (availabilityFilter === "Unavailable" && (b.available_copies ?? 0) === 0);

    return matchSearch && matchCategory && matchAvailability;
  });

  // ─── Stats ──────────────────────────────────────────────────────────────────

  const totalBooks = books.length;
  const availableBooks = books.filter((b) => (b.available_copies ?? 0) > 0).length;
  const unavailableBooks = books.filter((b) => (b.available_copies ?? 0) === 0).length;
  const totalCopies = books.reduce((sum, b) => sum + (b.total_copies ?? 0), 0);

  return (
    <div className="min-h-screen" style={{ background: "#f5f0e8" }}>
      {/* ── Page Header ─────────────────────────────────────────────────────── */}
      <div
        className="relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, #1e3a5f 0%, #2a4f7c 100%)" }}
      >
        {/* Decorative circles */}
        <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-white/5 pointer-events-none" />
        <div className="absolute -bottom-8 -left-8 w-40 h-40 rounded-full bg-white/5 pointer-events-none" />
        <div className="absolute top-1/2 right-1/4 w-24 h-24 rounded-full bg-[#c8a96e]/10 pointer-events-none" />

        <div className="container-lms relative py-10">
          <motion.div
            className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: "easeOut" }}
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-[#c8a96e]/20 border border-[#c8a96e]/30 flex items-center justify-center flex-shrink-0">
                <Library className="w-6 h-6 text-[#c8a96e]" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[#c8a96e] text-xs font-semibold uppercase tracking-widest">Catalog</span>
                  <ChevronRight className="w-3 h-3 text-white/30" />
                  <span className="text-white/50 text-xs">Book Management</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Book Management</h1>
                <p className="text-white/60 text-sm mt-0.5">
                  {loading ? "Loading catalog..." : `${totalBooks} book${totalBooks !== 1 ? "s" : ""} in catalog · ${totalCopies} total copies`}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={fetchBooks}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white text-sm font-medium transition-all duration-200"
              >
                <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
                Refresh
              </button>
              <button
                onClick={() => { setFormMode("add"); setEditTarget(null); setFormOpen(true); }}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-[#1e3a5f] transition-all duration-200 shadow-[0_2px_8px_rgba(200,169,110,0.4)] hover:shadow-[0_4px_16px_rgba(200,169,110,0.5)] hover:scale-[1.02]"
                style={{ background: "linear-gradient(135deg, #c8a96e 0%, #b8944f 100%)" }}
              >
                <Plus className="w-4 h-4" />
                Add Book
              </button>
            </div>
          </motion.div>

          {/* Stat pills */}
          <motion.div
            className="flex flex-wrap gap-3 mt-6"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: "easeOut", delay: 0.1 }}
          >
            {[
              { label: "Total Books", value: totalBooks, color: "bg-white/10 text-white" },
              { label: "Available", value: availableBooks, color: "bg-emerald-500/20 text-emerald-300" },
              { label: "Unavailable", value: unavailableBooks, color: "bg-red-500/20 text-red-300" },
              { label: "Total Copies", value: totalCopies, color: "bg-[#c8a96e]/20 text-[#c8a96e]" },
            ].map((stat) => (
              <div
                key={stat.label}
                className={cn("flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium border border-white/10", stat.color)}
              >
                <span className="font-bold">{stat.value}</span>
                <span className="opacity-70">{stat.label}</span>
              </div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* ── Main Content ─────────────────────────────────────────────────────── */}
      <div className="container-lms py-8 space-y-6">

        {/* ── Search & Filter Bar ──────────────────────────────────────────── */}
        <Reveal>
          <div className="bg-white rounded-2xl border border-[#d6cfc2] shadow-[0_1px_3px_rgba(30,58,95,0.06),0_8px_24px_-8px_rgba(30,58,95,0.10)] p-5 space-y-4">
            {/* Search input */}
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400 pointer-events-none" style={{ width: 18, height: 18 }} />
              <input
                type="text"
                placeholder="Search by title, author, ISBN, or category..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#d6cfc2] bg-[#f5f0e8]/60 text-sm text-[#1a2a3a] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#c8a96e]/50 focus:border-[#c8a96e] transition-all duration-200"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-slate-200 hover:bg-slate-300 flex items-center justify-center transition-colors"
                >
                  <X className="w-3 h-3 text-slate-600" />
                </button>
              )}
            </div>

            {/* Filters row */}
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Category pills */}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-[#1e3a5f] uppercase tracking-wide mb-2 flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-[#c8a96e]" />
                  Category
                </p>
                <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                  {BOOK_CATEGORIES.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setCategoryFilter(cat)}
                      className={cn(
                        "flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-all duration-200",
                        categoryFilter === cat
                          ? "bg-[#1e3a5f] text-white border-[#1e3a5f] shadow-sm"
                          : "bg-white text-[#1a2a3a] border-[#d6cfc2] hover:border-[#1e3a5f]/40 hover:bg-[#f5f0e8]"
                      )}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Availability toggle */}
              <div className="flex-shrink-0">
                <p className="text-xs font-semibold text-[#1e3a5f] uppercase tracking-wide mb-2 flex items-center gap-1.5">
                  <Filter className="w-3.5 h-3.5 text-[#c8a96e]" />
                  Availability
                </p>
                <div className="flex gap-1.5">
                  {AVAILABILITY_FILTERS.map((f) => (
                    <button
                      key={f}
                      onClick={() => setAvailabilityFilter(f)}
                      className={cn(
                        "px-3.5 py-1.5 rounded-xl text-xs font-semibold border transition-all duration-200",
                        availabilityFilter === f
                          ? f === "Available"
                            ? "bg-emerald-600 text-white border-emerald-600"
                            : f === "Unavailable"
                            ? "bg-red-600 text-white border-red-600"
                            : "bg-[#1e3a5f] text-white border-[#1e3a5f]"
                          : "bg-white text-[#1a2a3a] border-[#d6cfc2] hover:bg-[#f5f0e8]"
                      )}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Results count */}
            {!loading && (
              <p className="text-xs text-slate-500">
                Showing <span className="font-semibold text-[#1e3a5f]">{filtered.length}</span> of{" "}
                <span className="font-semibold text-[#1e3a5f]">{books.length}</span> books
                {search && <> matching &ldquo;<span className="italic">{search}</span>&rdquo;</>}
              </p>
            )}
          </div>
        </Reveal>

        {/* ── Error State ──────────────────────────────────────────────────── */}
        {error && (
          <div className="flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            <span>{error}</span>
            <button onClick={fetchBooks} className="ml-auto text-xs underline hover:no-underline">Retry</button>
          </div>
        )}

        {/* ── Loading Skeleton ─────────────────────────────────────────────── */}
        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="bg-white rounded-2xl border border-[#d6cfc2] p-5 animate-pulse"
              >
                <div className="flex items-start gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-slate-100 rounded-lg w-3/4" />
                    <div className="h-3 bg-slate-100 rounded-lg w-1/2" />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="h-3 bg-slate-100 rounded-lg w-full" />
                  <div className="h-3 bg-slate-100 rounded-lg w-2/3" />
                </div>
                <div className="mt-4 flex gap-2">
                  <div className="h-6 bg-slate-100 rounded-full w-20" />
                  <div className="h-6 bg-slate-100 rounded-full w-16" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Books Grid ───────────────────────────────────────────────────── */}
        {!loading && filtered.length > 0 && (
          <motion.div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
          >
            {filtered.map((book) => (
              <motion.div
                key={book.id}
                variants={fadeInUp}
                whileHover={{ y: -4, boxShadow: "0 12px 40px -8px rgba(30,58,95,0.18)" }}
                transition={{ duration: 0.2 }}
                className="group bg-white rounded-2xl border border-[#d6cfc2] shadow-[0_1px_2px_rgba(0,0,0,0.04),0_4px_16px_-4px_rgba(0,0,0,0.06)] overflow-hidden flex flex-col"
              >
                {/* Card top accent */}
                <div
                  className="h-1.5 w-full flex-shrink-0"
                  style={{
                    background:
                      (book.available_copies ?? 0) === 0
                        ? "linear-gradient(90deg, #e74c3c, #c0392b)"
                        : (book.available_copies ?? 0) / (book.total_copies ?? 1) < 0.4
                        ? "linear-gradient(90deg, #f39c12, #e67e22)"
                        : "linear-gradient(90deg, #27ae60, #2ecc71)",
                  }}
                />

                <div className="p-5 flex flex-col flex-1">
                  {/* Book icon + title */}
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-[#1e3a5f]/8 flex items-center justify-center flex-shrink-0 group-hover:bg-[#1e3a5f]/12 transition-colors">
                      <BookOpen className="w-5 h-5 text-[#1e3a5f]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-[#1e3a5f] text-sm leading-snug line-clamp-2">
                        {book.title}
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5 truncate">{book.author}</p>
                    </div>
                  </div>

                  {/* Meta info */}
                  <div className="space-y-1.5 mb-3 flex-1">
                    {book.category && (
                      <div className="flex items-center gap-1.5">
                        <Tag className="w-3 h-3 text-[#c8a96e] flex-shrink-0" />
                        <span className="text-xs text-slate-500 truncate">{book.category}</span>
                      </div>
                    )}
                    {book.isbn && (
                      <div className="flex items-center gap-1.5">
                        <Hash className="w-3 h-3 text-slate-400 flex-shrink-0" />
                        <span className="text-xs text-slate-400 font-mono truncate">{book.isbn}</span>
                      </div>
                    )}
                    {book.shelf_location && (
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3 h-3 text-slate-400 flex-shrink-0" />
                        <span className="text-xs text-slate-400 truncate">{book.shelf_location}</span>
                      </div>
                    )}
                  </div>

                  {/* Status + copies */}
                  <div className="flex items-center justify-between mb-4">
                    <StatusBadge
                      available={book.available_copies ?? 0}
                      total={book.total_copies ?? 0}
                    />
                    <span className="text-xs text-slate-400 font-medium">
                      {book.available_copies ?? 0}/{book.total_copies ?? 0} copies
                    </span>
                  </div>

                  {/* Action buttons */}
                  <div className="flex gap-2 pt-3 border-t border-[#f0ebe0]">
                    <button
                      onClick={() => { setEditTarget(book); setFormMode("edit"); setFormOpen(true); }}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-[#d6cfc2] bg-[#f5f0e8]/60 hover:bg-[#1e3a5f] hover:text-white hover:border-[#1e3a5f] text-xs font-medium text-[#1e3a5f] transition-all duration-200"
                    >
                      <Edit className="w-3.5 h-3.5" />
                      Edit
                    </button>
                    <button
                      onClick={() => { setDeleteTarget(book); setDeleteOpen(true); }}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-red-200 bg-red-50/60 hover:bg-red-600 hover:text-white hover:border-red-600 text-xs font-medium text-red-600 transition-all duration-200"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Delete
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* ── Empty State ──────────────────────────────────────────────────── */}
        {!loading && filtered.length === 0 && !error && (
          <Reveal>
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-16 h-16 rounded-2xl bg-[#1e3a5f]/8 flex items-center justify-center mb-4">
                <BookOpen className="w-8 h-8 text-[#1e3a5f]/40" />
              </div>
              <h3 className="text-lg font-semibold text-[#1e3a5f] mb-2">
                {search || categoryFilter !== "All" || availabilityFilter !== "All"
                  ? "No books match your filters"
                  : "No books in catalog yet"}
              </h3>
              <p className="text-sm text-slate-500 max-w-sm mb-6">
                {search || categoryFilter !== "All" || availabilityFilter !== "All"
                  ? "Try adjusting your search or filter criteria."
                  : "Start building your library catalog by adding the first book."}
              </p>
              {!(search || categoryFilter !== "All" || availabilityFilter !== "All") && (
                <button
                  onClick={() => { setFormMode("add"); setEditTarget(null); setFormOpen(true); }}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-[#1e3a5f] shadow-[0_2px_8px_rgba(200,169,110,0.35)] hover:shadow-[0_4px_16px_rgba(200,169,110,0.45)] hover:scale-[1.02] transition-all duration-200"
                  style={{ background: "linear-gradient(135deg, #c8a96e 0%, #b8944f 100%)" }}
                >
                  <Plus className="w-4 h-4" />
                  Add First Book
                </button>
              )}
            </div>
          </Reveal>
        )}
      </div>

      {/* ── Modals ───────────────────────────────────────────────────────────── */}
      <BookFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSave={handleSave}
        initial={editTarget}
        mode={formMode}
      />

      <DeleteConfirmModal
        open={deleteOpen}
        book={deleteTarget}
        onClose={() => { setDeleteOpen(false); setDeleteTarget(null); }}
        onConfirm={handleDelete}
        deleting={deleting}
      />

      {/* ── Toast ────────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {toast && (
          <motion.div
            key="toast"
            initial={{ opacity: 0, y: 24, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.95 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className={cn(
              "fixed bottom-6 right-6 z-[60] flex items-center gap-3 rounded-2xl border px-5 py-3.5 text-sm font-medium shadow-[0_8px_32px_-8px_rgba(0,0,0,0.25)]",
              toast.type === "success"
                ? "bg-white border-emerald-200 text-emerald-700"
                : "bg-white border-red-200 text-red-700"
            )}
          >
            {toast.type === "success" ? (
              <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                <svg className="w-3.5 h-3.5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
            ) : (
              <div className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                <AlertCircle className="w-3.5 h-3.5 text-red-600" />
              </div>
            )}
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
