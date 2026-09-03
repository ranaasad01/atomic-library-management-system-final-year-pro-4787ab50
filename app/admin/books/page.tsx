"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { Reveal } from "@/components/Reveal";
import { fadeInUp, staggerContainer, scaleIn, modalVariants, overlayVariants } from "@/lib/motion";
import { Search, Plus, Edit, Trash2, X, BookOpen, AlertCircle, Filter, Save, ChevronDown, Library, Hash, User, Tag, Building2, Calendar, Layers, MapPin, FileText, CheckCircle, BookMarked, TrendingUp, Package } from 'lucide-react';
import { cn } from "@/lib/utils";
import { BOOK_CATEGORIES } from "@/lib/data";

// ─── Types ──────────────────────────────────────────────────────────────────────

interface BookRow {
  id: string;
  title: string;
  author: string;
  isbn: string | null;
  category: string | null;
  publisher: string | null;
  publication_year: number | null;
  total_copies: number;
  available_copies: number;
  shelf_location: string | null;
  description: string | null;
  created_at: string;
  updated_at: string;
}

const ALL_CATEGORIES = ["All", ...BOOK_CATEGORIES] as const;
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

// ─── Status Badge ────────────────────────────────────────────────────────────────

function StatusBadge({ available, total }: { available: number; total: number }) {
  const pct = total > 0 ? available / total : 0;
  if (pct === 0) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700">
        <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
        Unavailable
      </span>
    );
  }
  if (pct < 0.4) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
        <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
        Low Stock
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
      Available
    </span>
  );
}

// ─── Form Field ──────────────────────────────────────────────────────────────────

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
      <label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-[#1e3a5f]">
        {Icon && <Icon className="h-3.5 w-3.5 text-[#c8a96e]" />}
        {label}
        {required && <span className="text-red-500">*</span>}
      </label>
      {children}
    </div>
  );
}

const inputCls =
  "w-full rounded-xl border border-[#d6cfc2] bg-[#f5f0e8]/60 px-3.5 py-2.5 text-sm text-[#1a2a3a] placeholder:text-slate-400 transition-all duration-200 focus:border-[#1e3a5f] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/10";

// ─── Book Form Modal ─────────────────────────────────────────────────────────────

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
            variants={overlayVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="relative w-full max-w-2xl max-h-[90vh] overflow-hidden rounded-2xl bg-white shadow-[0_8px_40px_-8px_rgba(30,58,95,0.35)] flex flex-col">
              {/* Modal Header */}
              <div className="relative overflow-hidden bg-gradient-to-r from-[#1e3a5f] to-[#2a4f7c] px-6 py-5 flex-shrink-0">
                <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 80% 50%, #c8a96e 0%, transparent 60%)' }} />
                <div className="relative flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 backdrop-blur-sm">
                      <BookOpen className="h-5 w-5 text-[#c8a96e]" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-white">
                        {mode === "add" ? "Add New Book" : "Edit Book"}
                      </h2>
                      <p className="text-xs text-white/60">
                        {mode === "add" ? "Fill in the details to add a book to the catalog" : "Update the book information below"}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={onClose}
                    className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 text-white/70 transition-all hover:bg-white/20 hover:text-white"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Modal Body */}
              <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
                <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
                  {error && (
                    <div className="flex items-center gap-2.5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                      <AlertCircle className="h-4 w-4 flex-shrink-0" />
                      {error}
                    </div>
                  )}

                  {/* Row 1: Title + Author */}
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
                        {BOOK_CATEGORIES.map((cat) => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                    </FormField>
                  </div>

                  {/* Row 3: Publisher + Year */}
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
                        min="1900"
                        max={new Date().getFullYear() + 1}
                        value={form.publication_year}
                        onChange={(e) => set("publication_year", e.target.value)}
                      />
                    </FormField>
                  </div>

                  {/* Row 4: Total + Available Copies */}
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <FormField label="Total Copies" icon={Layers}>
                      <input
                        className={inputCls}
                        type="number"
                        min="1"
                        placeholder="1"
                        value={form.total_copies}
                        onChange={(e) => set("total_copies", e.target.value)}
                      />
                    </FormField>
                    <FormField label="Available Copies" icon={Package}>
                      <input
                        className={inputCls}
                        type="number"
                        min="0"
                        placeholder="1"
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
                </div>

                {/* Modal Footer */}
                <div className="flex-shrink-0 border-t border-[#d6cfc2] bg-[#f5f0e8]/50 px-6 py-4 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={onClose}
                    disabled={saving}
                    className="rounded-xl border border-[#d6cfc2] bg-white px-5 py-2.5 text-sm font-medium text-[#1a2a3a] transition-all hover:bg-[#f5f0e8] hover:border-[#1e3a5f]/30 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#c8a96e] to-[#b8944f] px-5 py-2.5 text-sm font-semibold text-white shadow-[0_2px_8px_rgba(200,169,110,0.4)] transition-all hover:from-[#b8944f] hover:to-[#a07d3a] hover:shadow-[0_4px_16px_rgba(200,169,110,0.5)] disabled:opacity-60"
                  >
                    {saving ? (
                      <>
                        <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                        </svg>
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4" />
                        {mode === "add" ? "Add Book" : "Save Changes"}
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ─── Delete Confirm Modal ────────────────────────────────────────────────────────

function DeleteConfirmModal({
  open,
  bookTitle,
  onConfirm,
  onCancel,
  loading,
}: {
  open: boolean;
  bookTitle: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading: boolean;
}) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            variants={overlayVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
            onClick={onCancel}
          />
          <motion.div
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="w-full max-w-md rounded-2xl bg-white shadow-[0_8px_40px_-8px_rgba(30,58,95,0.35)] overflow-hidden">
              <div className="bg-gradient-to-r from-red-600 to-red-700 px-6 py-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15">
                    <Trash2 className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">Delete Book</h3>
                    <p className="text-xs text-white/70">This action cannot be undone</p>
                  </div>
                </div>
              </div>
              <div className="px-6 py-5">
                <p className="text-sm text-[#1a2a3a]">
                  Are you sure you want to delete{" "}
                  <span className="font-semibold text-[#1e3a5f]">&ldquo;{bookTitle}&rdquo;</span>?
                  This will permanently remove the book from the catalog.
                </p>
              </div>
              <div className="flex items-center justify-end gap-3 border-t border-[#d6cfc2] bg-[#f5f0e8]/50 px-6 py-4">
                <button
                  onClick={onCancel}
                  disabled={loading}
                  className="rounded-xl border border-[#d6cfc2] bg-white px-5 py-2.5 text-sm font-medium text-[#1a2a3a] transition-all hover:bg-[#f5f0e8] disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={onConfirm}
                  disabled={loading}
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-red-600 to-red-700 px-5 py-2.5 text-sm font-semibold text-white shadow-[0_2px_8px_rgba(231,76,60,0.4)] transition-all hover:from-red-700 hover:to-red-800 disabled:opacity-60"
                >
                  {loading ? "Deleting..." : "Delete Book"}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────────

export default function AdminBooksPage() {
  const supabase = createClient();

  const [books, setBooks] = useState<BookRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [availFilter, setAvailFilter] = useState<"All" | "Available" | "Unavailable">("All");

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [editTarget, setEditTarget] = useState<BookRow | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<BookRow | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  // ─── Fetch ─────────────────────────────────────────────────────────────────────

  const fetchBooks = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: fetchErr } = await supabase
        .from("books")
        .select("*")
        .order("created_at", { ascending: false });
      if (fetchErr) throw fetchErr;
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

  // ─── Toast ─────────────────────────────────────────────────────────────────────

  const showToast = (msg: string, type: "success" | "error") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  // ─── CRUD ──────────────────────────────────────────────────────────────────────

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

    if (modalMode === "add") {
      const { error: insertErr } = await supabase.from("books").insert([payload]);
      if (insertErr) throw insertErr;
      showToast("Book added successfully.", "success");
    } else if (editTarget) {
      const { error: updateErr } = await supabase
        .from("books")
        .update(payload)
        .eq("id", editTarget.id);
      if (updateErr) throw updateErr;
      showToast("Book updated successfully.", "success");
    }
    await fetchBooks();
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      const { error: delErr } = await supabase
        .from("books")
        .delete()
        .eq("id", deleteTarget.id);
      if (delErr) throw delErr;
      showToast("Book deleted.", "success");
      setDeleteTarget(null);
      await fetchBooks();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Delete failed.", "error");
    } finally {
      setDeleteLoading(false);
    }
  };

  // ─── Filtered list ─────────────────────────────────────────────────────────────

  const filtered = books.filter((b) => {
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      b.title.toLowerCase().includes(q) ||
      b.author.toLowerCase().includes(q) ||
      (b.isbn ?? "").toLowerCase().includes(q) ||
      (b.category ?? "").toLowerCase().includes(q);
    const matchCat = categoryFilter === "All" || b.category === categoryFilter;
    const matchAvail =
      availFilter === "All"
        ? true
        : availFilter === "Available"
        ? b.available_copies > 0
        : b.available_copies === 0;
    return matchSearch && matchCat && matchAvail;
  });

  const totalBooks = books.length;
  const totalAvailable = books.filter((b) => b.available_copies > 0).length;
  const totalUnavailable = books.filter((b) => b.available_copies === 0).length;

  return (
    <div className="min-h-screen bg-[#f5f0e8]">
      {/* ── Page Header ─────────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#1e3a5f] via-[#1e3a5f] to-[#2a4f7c]">
        {/* Decorative glow */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-24 -right-24 h-96 w-96 rounded-full bg-[#c8a96e]/10 blur-3xl" />
          <div className="absolute -bottom-16 -left-16 h-64 w-64 rounded-full bg-[#c8a96e]/8 blur-2xl" />
          <div
            className="absolute inset-0 opacity-5"
            style={{
              backgroundImage:
                "repeating-linear-gradient(0deg, transparent, transparent 40px, rgba(255,255,255,0.3) 40px, rgba(255,255,255,0.3) 41px), repeating-linear-gradient(90deg, transparent, transparent 40px, rgba(255,255,255,0.3) 40px, rgba(255,255,255,0.3) 41px)",
            }}
          />
        </div>

        <div className="relative container-lms py-10 md:py-14">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#c8a96e] to-[#b8944f] shadow-[0_4px_16px_rgba(200,169,110,0.4)]">
                <Library className="h-7 w-7 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="rounded-full border border-[#c8a96e]/40 bg-[#c8a96e]/15 px-3 py-0.5 text-xs font-semibold text-[#c8a96e] uppercase tracking-wide">
                    Admin Panel
                  </span>
                </div>
                <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
                  Book Management
                </h1>
                <p className="text-sm text-white/60 mt-0.5">
                  Add, edit, and manage the library catalog
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                setModalMode("add");
                setEditTarget(null);
                setModalOpen(true);
              }}
              className="inline-flex items-center gap-2.5 self-start md:self-auto rounded-xl bg-gradient-to-r from-[#c8a96e] to-[#b8944f] px-5 py-3 text-sm font-semibold text-white shadow-[0_4px_16px_rgba(200,169,110,0.45)] transition-all duration-200 hover:from-[#b8944f] hover:to-[#a07d3a] hover:shadow-[0_6px_24px_rgba(200,169,110,0.55)] hover:-translate-y-0.5"
            >
              <Plus className="h-4 w-4" />
              Add New Book
            </button>
          </div>

          {/* Stats row */}
          <div className="mt-8 grid grid-cols-3 gap-4 max-w-lg">
            <div className="rounded-xl bg-white/10 border border-white/15 px-4 py-3 text-center backdrop-blur-sm">
              <p className="text-2xl font-bold text-white">{totalBooks}</p>
              <p className="text-xs text-white/60 mt-0.5">Total Books</p>
            </div>
            <div className="rounded-xl bg-white/10 border border-white/15 px-4 py-3 text-center backdrop-blur-sm">
              <p className="text-2xl font-bold text-emerald-300">{totalAvailable}</p>
              <p className="text-xs text-white/60 mt-0.5">Available</p>
            </div>
            <div className="rounded-xl bg-white/10 border border-white/15 px-4 py-3 text-center backdrop-blur-sm">
              <p className="text-2xl font-bold text-red-300">{totalUnavailable}</p>
              <p className="text-xs text-white/60 mt-0.5">Unavailable</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Main Content ─────────────────────────────────────────────────────── */}
      <div className="container-lms py-8 space-y-6">

        {/* ── Filter / Search Card ─────────────────────────────────────────── */}
        <Reveal>
          <div className="rounded-2xl border border-[#d6cfc2] bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_-8px_rgba(30,58,95,0.10)] p-5">
            <div className="flex flex-col gap-4 md:flex-row md:items-center">
              {/* Search */}
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by title, author, ISBN, or category..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full rounded-xl border border-[#d6cfc2] bg-[#f5f0e8]/60 py-2.5 pl-10 pr-4 text-sm text-[#1a2a3a] placeholder:text-slate-400 transition-all focus:border-[#1e3a5f] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/10"
                />
                {search && (
                  <button
                    onClick={() => setSearch("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              {/* Availability filter */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <Filter className="h-4 w-4 text-slate-400" />
                <div className="flex rounded-xl border border-[#d6cfc2] bg-[#f5f0e8]/60 p-1 gap-1">
                  {AVAILABILITY_FILTERS.map((f) => (
                    <button
                      key={f}
                      onClick={() => setAvailFilter(f as typeof availFilter)}
                      className={cn(
                        "rounded-lg px-3 py-1.5 text-xs font-semibold transition-all duration-200",
                        availFilter === f
                          ? "bg-[#1e3a5f] text-white shadow-sm"
                          : "text-slate-500 hover:text-[#1e3a5f]"
                      )}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Category pills */}
            <div className="mt-4 flex flex-wrap gap-2">
              {ALL_CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(cat)}
                  className={cn(
                    "rounded-full border px-3.5 py-1 text-xs font-medium transition-all duration-200",
                    categoryFilter === cat
                      ? "border-[#1e3a5f] bg-[#1e3a5f] text-white shadow-sm"
                      : "border-[#d6cfc2] bg-white text-slate-600 hover:border-[#1e3a5f]/40 hover:text-[#1e3a5f]"
                  )}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Results count */}
            {(search || categoryFilter !== "All" || availFilter !== "All") && (
              <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
                <BookMarked className="h-3.5 w-3.5" />
                Showing <span className="font-semibold text-[#1e3a5f]">{filtered.length}</span> of{" "}
                <span className="font-semibold text-[#1e3a5f]">{totalBooks}</span> books
              </div>
            )}
          </div>
        </Reveal>

        {/* ── Error ────────────────────────────────────────────────────────── */}
        {error && (
          <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            {error}
          </div>
        )}

        {/* ── Books Table ──────────────────────────────────────────────────── */}
        <Reveal>
          <div className="rounded-2xl border border-[#d6cfc2] bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_-8px_rgba(30,58,95,0.10)] overflow-hidden">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-24 gap-4">
                <div className="h-10 w-10 rounded-full border-4 border-[#1e3a5f]/20 border-t-[#1e3a5f] animate-spin" />
                <p className="text-sm text-slate-500">Loading books...</p>
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#f5f0e8] border border-[#d6cfc2]">
                  <BookOpen className="h-8 w-8 text-[#c8a96e]" />
                </div>
                <div className="text-center">
                  <p className="font-semibold text-[#1e3a5f]">No books found</p>
                  <p className="text-sm text-slate-500 mt-1">
                    {search || categoryFilter !== "All" || availFilter !== "All"
                      ? "Try adjusting your filters."
                      : "Add your first book to get started."}
                  </p>
                </div>
                {!search && categoryFilter === "All" && availFilter === "All" && (
                  <button
                    onClick={() => { setModalMode("add"); setEditTarget(null); setModalOpen(true); }}
                    className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#c8a96e] to-[#b8944f] px-4 py-2.5 text-sm font-semibold text-white shadow-[0_2px_8px_rgba(200,169,110,0.4)] hover:from-[#b8944f] hover:to-[#a07d3a] transition-all"
                  >
                    <Plus className="h-4 w-4" />
                    Add First Book
                  </button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[#d6cfc2] bg-gradient-to-r from-[#1e3a5f]/5 to-[#1e3a5f]/3">
                      <th className="px-5 py-3.5 text-left text-[10px] font-bold uppercase tracking-widest text-[#1e3a5f]/70">
                        Book
                      </th>
                      <th className="hidden px-5 py-3.5 text-left text-[10px] font-bold uppercase tracking-widest text-[#1e3a5f]/70 md:table-cell">
                        Category
                      </th>
                      <th className="hidden px-5 py-3.5 text-left text-[10px] font-bold uppercase tracking-widest text-[#1e3a5f]/70 lg:table-cell">
                        ISBN
                      </th>
                      <th className="px-5 py-3.5 text-center text-[10px] font-bold uppercase tracking-widest text-[#1e3a5f]/70">
                        Copies
                      </th>
                      <th className="px-5 py-3.5 text-left text-[10px] font-bold uppercase tracking-widest text-[#1e3a5f]/70">
                        Status
                      </th>
                      <th className="hidden px-5 py-3.5 text-left text-[10px] font-bold uppercase tracking-widest text-[#1e3a5f]/70 md:table-cell">
                        Shelf
                      </th>
                      <th className="px-5 py-3.5 text-right text-[10px] font-bold uppercase tracking-widest text-[#1e3a5f]/70">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#d6cfc2]/60">
                    {filtered.map((book) => (
                      <motion.tr
                        key={book.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="group transition-colors duration-150 hover:bg-[#f5f0e8]/60"
                      >
                        {/* Book info */}
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#1e3a5f]/10 to-[#1e3a5f]/5 border border-[#1e3a5f]/10">
                              <BookOpen className="h-5 w-5 text-[#1e3a5f]/60" />
                            </div>
                            <div className="min-w-0">
                              <p className="font-semibold text-[#1a2a3a] text-sm leading-tight truncate max-w-[200px]">
                                {book.title}
                              </p>
                              <p className="text-xs text-slate-500 mt-0.5 truncate max-w-[200px]">
                                {book.author}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Category */}
                        <td className="hidden px-5 py-4 md:table-cell">
                          {book.category ? (
                            <span className="inline-flex items-center rounded-full border border-[#c8a96e]/30 bg-[#c8a96e]/10 px-2.5 py-0.5 text-xs font-medium text-[#1e3a5f]">
                              {book.category}
                            </span>
                          ) : (
                            <span className="text-xs text-slate-400">—</span>
                          )}
                        </td>

                        {/* ISBN */}
                        <td className="hidden px-5 py-4 lg:table-cell">
                          <span className="font-mono text-xs text-slate-500">
                            {book.isbn ?? "—"}
                          </span>
                        </td>

                        {/* Copies */}
                        <td className="px-5 py-4 text-center">
                          <span className="text-sm font-semibold text-[#1e3a5f]">
                            {book.available_copies}
                          </span>
                          <span className="text-xs text-slate-400">/{book.total_copies}</span>
                        </td>

                        {/* Status */}
                        <td className="px-5 py-4">
                          <StatusBadge
                            available={book.available_copies}
                            total={book.total_copies}
                          />
                        </td>

                        {/* Shelf */}
                        <td className="hidden px-5 py-4 md:table-cell">
                          {book.shelf_location ? (
                            <span className="inline-flex items-center gap-1 rounded-lg border border-[#d6cfc2] bg-[#f5f0e8] px-2 py-0.5 text-xs font-mono text-slate-600">
                              <MapPin className="h-3 w-3 text-slate-400" />
                              {book.shelf_location}
                            </span>
                          ) : (
                            <span className="text-xs text-slate-400">—</span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="px-5 py-4">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => {
                                setEditTarget(book);
                                setModalMode("edit");
                                setModalOpen(true);
                              }}
                              title="Edit book"
                              className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#d6cfc2] bg-white text-slate-500 transition-all hover:border-[#1e3a5f]/40 hover:bg-[#1e3a5f]/5 hover:text-[#1e3a5f]"
                            >
                              <Edit className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => setDeleteTarget(book)}
                              title="Delete book"
                              className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#d6cfc2] bg-white text-slate-500 transition-all hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Table footer */}
            {!loading && filtered.length > 0 && (
              <div className="border-t border-[#d6cfc2]/60 bg-[#f5f0e8]/40 px-5 py-3 flex items-center justify-between">
                <p className="text-xs text-slate-500">
                  Showing <span className="font-semibold text-[#1e3a5f]">{filtered.length}</span> book{filtered.length !== 1 ? "s" : ""}
                </p>
                <div className="flex items-center gap-1.5 text-xs text-slate-500">
                  <TrendingUp className="h-3.5 w-3.5 text-[#c8a96e]" />
                  <span>
                    <span className="font-semibold text-emerald-600">{totalAvailable}</span> available
                  </span>
                  <span className="text-slate-300">·</span>
                  <span>
                    <span className="font-semibold text-red-500">{totalUnavailable}</span> unavailable
                  </span>
                </div>
              </div>
            )}
          </div>
        </Reveal>
      </div>

      {/* ── Modals ───────────────────────────────────────────────────────────── */}
      <BookFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
        initial={editTarget}
        mode={modalMode}
      />

      <DeleteConfirmModal
        open={!!deleteTarget}
        bookTitle={deleteTarget?.title ?? ""}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={deleteLoading}
      />

      {/* ── Toast ────────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.95 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className={cn(
              "fixed bottom-6 right-6 z-[60] flex items-center gap-3 rounded-xl border px-4 py-3 shadow-[0_8px_32px_-8px_rgba(0,0,0,0.25)] text-sm font-medium",
              toast.type === "success"
                ? "border-emerald-200 bg-white text-emerald-700"
                : "border-red-200 bg-white text-red-700"
            )}
          >
            {toast.type === "success" ? (
              <CheckCircle className="h-4 w-4 flex-shrink-0" />
            ) : (
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
            )}
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
