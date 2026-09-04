"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { Reveal } from "@/components/Reveal";
import { fadeInUp, staggerContainer, scaleIn, modalVariants, overlayVariants } from "@/lib/motion";
import { Search, Plus, Edit, Trash2, X, BookOpen, AlertCircle, Filter, Save, ChevronDown, Library, Hash, User, Tag, Building2, Calendar, Layers, MapPin, FileText, CheckCircle, BookMarked, TrendingUp, Package, ChevronRight, Database, Info } from 'lucide-react';
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
const AVAILABILITY_FILTERS = ["All", "Available", "Low Stock", "Unavailable"] as const;
type AvailabilityFilter = typeof AVAILABILITY_FILTERS[number];

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
  if (available === 0) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700">
        <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
        Unavailable
      </span>
    );
  }
  if (available < 2) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
        <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
        Low Stock
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

// ─── Skeleton Row ────────────────────────────────────────────────────────────────

function SkeletonRow() {
  return (
    <tr className="border-b border-[#d6cfc2]/40">
      {[...Array(9)].map((_, i) => (
        <td key={i} className="px-4 py-4">
          <div className="h-4 rounded-lg bg-[#ede8df] animate-pulse" style={{ width: i === 0 ? '24px' : i === 1 ? '80%' : i === 7 ? '70px' : '60%' }} />
        </td>
      ))}
    </tr>
  );
}

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
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (open) {
      if (initial && mode === "edit") {
        setForm({
          title: initial.title,
          author: initial.author,
          isbn: initial.isbn ?? "",
          category: initial.category ?? "",
          publisher: initial.publisher ?? "",
          publication_year: initial.publication_year?.toString() ?? "",
          total_copies: initial.total_copies.toString(),
          available_copies: initial.available_copies.toString(),
          shelf_location: initial.shelf_location ?? "",
          description: initial.description ?? "",
        });
      } else {
        setForm(EMPTY_FORM);
      }
      setError(null);
      setSuccess(false);
    }
  }, [open, initial, mode]);

  function set<K extends keyof FormState>(key: K, val: string) {
    setForm((prev) => ({ ...prev, [key]: val }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) { setError("Title is required."); return; }
    if (!form.author.trim()) { setError("Author is required."); return; }
    setSaving(true);
    setError(null);
    try {
      await onSave(form);
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 900);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save book.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          initial="hidden"
          animate="visible"
          exit="hidden"
          variants={overlayVariants}
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-[#1a2a3a]/60 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal card */}
          <motion.div
            className="relative z-10 w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-[0_8px_40px_-8px_rgba(30,58,95,0.28)] border border-[#d6cfc2]"
            variants={modalVariants}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-[#d6cfc2] bg-gradient-to-r from-[#1e3a5f] to-[#2a4f7c] rounded-t-2xl">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#c8a96e]/20 flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-[#c8a96e]" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">
                    {mode === "add" ? "Add New Book" : "Edit Book"}
                  </h2>
                  <p className="text-xs text-white/60">Book Collection — LMS Database Module</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-all duration-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <form onSubmit={handleSubmit} className="p-6">
              {/* Toast messages */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="mb-4 flex items-center gap-2.5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
                  >
                    <AlertCircle className="h-4 w-4 flex-shrink-0" />
                    {error}
                  </motion.div>
                )}
                {success && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="mb-4 flex items-center gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700"
                  >
                    <CheckCircle className="h-4 w-4 flex-shrink-0" />
                    Book saved successfully!
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Title */}
                <FormField label="Title" icon={BookOpen} required>
                  <input
                    className={inputCls}
                    placeholder="e.g. Introduction to Algorithms"
                    value={form.title}
                    onChange={(e) => set("title", e.target.value)}
                    required
                  />
                </FormField>

                {/* Author */}
                <FormField label="Author" icon={User} required>
                  <input
                    className={inputCls}
                    placeholder="e.g. Thomas H. Cormen"
                    value={form.author}
                    onChange={(e) => set("author", e.target.value)}
                    required
                  />
                </FormField>

                {/* ISBN */}
                <FormField label="ISBN" icon={Hash}>
                  <input
                    className={inputCls}
                    placeholder="e.g. 978-0-262-03384-8"
                    value={form.isbn}
                    onChange={(e) => set("isbn", e.target.value)}
                  />
                </FormField>

                {/* Category */}
                <FormField label="Category" icon={Tag}>
                  <select
                    className={inputCls}
                    value={form.category}
                    onChange={(e) => set("category", e.target.value)}
                  >
                    <option value="">Select category</option>
                    {BOOK_CATEGORIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </FormField>

                {/* Publisher */}
                <FormField label="Publisher" icon={Building2}>
                  <input
                    className={inputCls}
                    placeholder="e.g. MIT Press"
                    value={form.publisher}
                    onChange={(e) => set("publisher", e.target.value)}
                  />
                </FormField>

                {/* Publication Year */}
                <FormField label="Publication Year" icon={Calendar}>
                  <input
                    className={inputCls}
                    type="number"
                    placeholder="e.g. 2022"
                    min="1800"
                    max={new Date().getFullYear() + 1}
                    value={form.publication_year}
                    onChange={(e) => set("publication_year", e.target.value)}
                  />
                </FormField>

                {/* Total Copies */}
                <FormField label="Total Copies" icon={Layers}>
                  <input
                    className={inputCls}
                    type="number"
                    min="0"
                    placeholder="1"
                    value={form.total_copies}
                    onChange={(e) => set("total_copies", e.target.value)}
                  />
                </FormField>

                {/* Available Copies */}
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

                {/* Shelf Location */}
                <FormField label="Shelf Location" icon={MapPin}>
                  <input
                    className={inputCls}
                    placeholder="e.g. A-12, Row 3"
                    value={form.shelf_location}
                    onChange={(e) => set("shelf_location", e.target.value)}
                  />
                </FormField>

                {/* Description — full width */}
                <div className="sm:col-span-2">
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
              </div>

              {/* Footer buttons */}
              <div className="mt-6 flex items-center justify-end gap-3 pt-4 border-t border-[#d6cfc2]">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2.5 rounded-xl border border-[#d6cfc2] bg-white text-sm font-semibold text-[#1e3a5f] hover:bg-[#f5f0e8] transition-all duration-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#c8a96e] text-sm font-semibold text-white hover:bg-[#b8944f] disabled:opacity-60 transition-all duration-200 shadow-[0_2px_8px_rgba(200,169,110,0.35)]"
                >
                  {saving ? (
                    <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  {saving ? "Saving..." : mode === "add" ? "Add Book" : "Save Changes"}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── Delete Confirm Modal ────────────────────────────────────────────────────────

function DeleteModal({
  open,
  bookTitle,
  onConfirm,
  onCancel,
  deleting,
}: {
  open: boolean;
  bookTitle: string;
  onConfirm: () => void;
  onCancel: () => void;
  deleting: boolean;
}) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          initial="hidden"
          animate="visible"
          exit="hidden"
          variants={overlayVariants}
        >
          <motion.div
            className="absolute inset-0 bg-[#1a2a3a]/60 backdrop-blur-sm"
            onClick={onCancel}
          />
          <motion.div
            className="relative z-10 w-full max-w-md rounded-2xl bg-white shadow-[0_8px_40px_-8px_rgba(30,58,95,0.28)] border border-[#d6cfc2] p-6"
            variants={modalVariants}
          >
            <div className="flex items-start gap-4 mb-5">
              <div className="w-11 h-11 rounded-xl bg-red-50 border border-red-200 flex items-center justify-center flex-shrink-0">
                <Trash2 className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#1e3a5f]">Delete Book</h3>
                <p className="text-sm text-slate-500 mt-1">
                  Are you sure you want to delete{" "}
                  <span className="font-semibold text-[#1a2a3a]">&ldquo;{bookTitle}&rdquo;</span>?
                  This action cannot be undone and will remove all associated records.
                </p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={onCancel}
                className="px-4 py-2.5 rounded-xl border border-[#d6cfc2] bg-white text-sm font-semibold text-[#1e3a5f] hover:bg-[#f5f0e8] transition-all duration-200"
              >
                Cancel
              </button>
              <button
                onClick={onConfirm}
                disabled={deleting}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-600 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60 transition-all duration-200"
              >
                {deleting ? (
                  <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
                {deleting ? "Deleting..." : "Confirm Delete"}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────────

export default function AdminBooksPage() {
  const supabase = createClient();

  const [books, setBooks] = useState<BookRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [availFilter, setAvailFilter] = useState<AvailabilityFilter>("All");

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [editingBook, setEditingBook] = useState<BookRow | null>(null);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletingBook, setDeletingBook] = useState<BookRow | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  // ── Fetch ──────────────────────────────────────────────────────────────────

  const fetchBooks = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("books")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      setBooks(data ?? []);
    } catch (err) {
      showToast("error", err instanceof Error ? err.message : "Failed to load books.");
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => { fetchBooks(); }, [fetchBooks]);

  // ── Toast ──────────────────────────────────────────────────────────────────

  function showToast(type: "success" | "error", msg: string) {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3500);
  }

  // ── Filtering ──────────────────────────────────────────────────────────────

  const filtered = books.filter((b) => {
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      b.title.toLowerCase().includes(q) ||
      b.author.toLowerCase().includes(q) ||
      (b.isbn ?? "").toLowerCase().includes(q);

    const matchCat = categoryFilter === "All" || b.category === categoryFilter;

    let matchAvail = true;
    if (availFilter === "Available") matchAvail = b.available_copies >= 2;
    else if (availFilter === "Low Stock") matchAvail = b.available_copies > 0 && b.available_copies < 2;
    else if (availFilter === "Unavailable") matchAvail = b.available_copies === 0;

    return matchSearch && matchCat && matchAvail;
  });

  // ── Stats ──────────────────────────────────────────────────────────────────

  const totalBooks = books.length;
  const availableBooks = books.filter((b) => b.available_copies > 0).length;
  const categories = new Set(books.map((b) => b.category).filter(Boolean)).size;
  const lowStock = books.filter((b) => b.available_copies > 0 && b.available_copies < 2).length;

  // ── CRUD ───────────────────────────────────────────────────────────────────

  async function handleSave(form: FormState) {
    const payload = {
      title: form.title.trim(),
      author: form.author.trim(),
      isbn: form.isbn.trim() || null,
      category: form.category || null,
      publisher: form.publisher.trim() || null,
      publication_year: form.publication_year ? parseInt(form.publication_year) : null,
      total_copies: parseInt(form.total_copies) || 1,
      available_copies: parseInt(form.available_copies) || 1,
      shelf_location: form.shelf_location.trim() || null,
      description: form.description.trim() || null,
    };

    if (modalMode === "add") {
      const { error } = await supabase.from("books").insert([payload]);
      if (error) throw new Error(error.message);
      showToast("success", `"${payload.title}" added to the catalog.`);
    } else if (editingBook) {
      const { error } = await supabase
        .from("books")
        .update({ ...payload, updated_at: new Date().toISOString() })
        .eq("id", editingBook.id);
      if (error) throw new Error(error.message);
      showToast("success", `"${payload.title}" updated successfully.`);
    }
    await fetchBooks();
  }

  async function handleDelete() {
    if (!deletingBook) return;
    setDeleting(true);
    try {
      const { error } = await supabase.from("books").delete().eq("id", deletingBook.id);
      if (error) throw new Error(error.message);
      showToast("success", `"${deletingBook.title}" removed from catalog.`);
      setDeleteOpen(false);
      setDeletingBook(null);
      await fetchBooks();
    } catch (err) {
      showToast("error", err instanceof Error ? err.message : "Delete failed.");
    } finally {
      setDeleting(false);
    }
  }

  function openAdd() {
    setEditingBook(null);
    setModalMode("add");
    setModalOpen(true);
  }

  function openEdit(book: BookRow) {
    setEditingBook(book);
    setModalMode("edit");
    setModalOpen(true);
  }

  function openDelete(book: BookRow) {
    setDeletingBook(book);
    setDeleteOpen(true);
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[#f5f0e8]">
      {/* ── Toast ── */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20, x: "-50%" }}
            animate={{ opacity: 1, y: 0, x: "-50%" }}
            exit={{ opacity: 0, y: -20, x: "-50%" }}
            className={cn(
              "fixed top-20 left-1/2 z-[100] flex items-center gap-2.5 rounded-xl border px-5 py-3 text-sm font-semibold shadow-lg",
              toast.type === "success"
                ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                : "bg-red-50 border-red-200 text-red-800"
            )}
          >
            {toast.type === "success" ? (
              <CheckCircle className="h-4 w-4 text-emerald-600" />
            ) : (
              <AlertCircle className="h-4 w-4 text-red-600" />
            )}
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Page Header ── */}
      <div
        className="relative overflow-hidden"
        style={{
          background: "linear-gradient(135deg, #0f1f33 0%, #1e3a5f 50%, #2a4f7c 100%)",
        }}
      >
        {/* Decorative glow */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div
            className="absolute -top-32 -right-32 w-80 h-80 rounded-full opacity-10"
            style={{ background: "radial-gradient(circle, #c8a96e, transparent)" }}
          />
          <div
            className="absolute bottom-0 left-1/4 w-64 h-32 opacity-5"
            style={{ background: "radial-gradient(ellipse, #c8a96e, transparent)" }}
          />
        </div>

        <div className="container-lms relative py-10 pt-24">
          {/* Breadcrumb */}
          <Reveal>
            <div className="flex items-center gap-2 text-xs text-white/50 mb-4 font-medium">
              <Library className="h-3.5 w-3.5" />
              <span>Admin Panel</span>
              <ChevronRight className="h-3 w-3" />
              <span className="text-[#c8a96e]">Book Management</span>
            </div>
          </Reveal>

          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
            <Reveal>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
                  Book Management
                </h1>
                <p className="text-white/60 text-sm mt-1.5">
                  Add, edit, search and manage the library catalog
                </p>
                {/* FYP doc reference */}
                <div className="mt-3 inline-flex items-center gap-2 rounded-lg bg-white/8 border border-white/10 px-3 py-1.5">
                  <Database className="h-3.5 w-3.5 text-[#c8a96e]" />
                  <span className="text-xs text-white/60 font-medium">
                    Book Collection — LMS Database Module &middot; Chapter 5: Database Design
                  </span>
                </div>
              </div>
            </Reveal>

            <Reveal delay={0.1}>
              <button
                onClick={openAdd}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#c8a96e] text-sm font-bold text-white hover:bg-[#b8944f] transition-all duration-200 shadow-[0_4px_16px_rgba(200,169,110,0.4)] whitespace-nowrap"
              >
                <Plus className="h-4 w-4" />
                Add New Book
              </button>
            </Reveal>
          </div>

          {/* Stats row */}
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8"
          >
            {[
              { label: "Total Books", value: totalBooks, icon: BookOpen, color: "text-[#c8a96e]", bg: "bg-[#c8a96e]/15" },
              { label: "Available", value: availableBooks, icon: CheckCircle, color: "text-emerald-400", bg: "bg-emerald-400/15" },
              { label: "Categories", value: categories, icon: Tag, color: "text-blue-400", bg: "bg-blue-400/15" },
              { label: "Low Stock", value: lowStock, icon: AlertCircle, color: "text-amber-400", bg: "bg-amber-400/15" },
            ].map((stat) => (
              <motion.div
                key={stat.label}
                variants={fadeInUp}
                className="rounded-xl bg-white/8 border border-white/10 backdrop-blur-sm px-4 py-4 flex items-center gap-3"
              >
                <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0", stat.bg)}>
                  <stat.icon className={cn("w-4.5 h-4.5", stat.color)} />
                </div>
                <div>
                  <p className="text-xl font-bold text-white leading-none">{stat.value}</p>
                  <p className="text-xs text-white/55 mt-0.5 font-medium">{stat.label}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* ── Main Content ── */}
      <div className="container-lms py-8">

        {/* ── Search & Filter Bar ── */}
        <Reveal>
          <div className="bg-white rounded-2xl border border-[#d6cfc2] shadow-[0_1px_2px_rgba(0,0,0,0.04),0_4px_16px_-4px_rgba(0,0,0,0.08)] p-4 mb-6">
            <div className="flex flex-col md:flex-row gap-3">
              {/* Search */}
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by title, author, or ISBN..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#d6cfc2] bg-[#f5f0e8]/60 text-sm text-[#1a2a3a] placeholder:text-slate-400 focus:border-[#1e3a5f] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/10 transition-all duration-200"
                />
              </div>

              {/* Category filter */}
              <div className="relative">
                <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="pl-9 pr-8 py-2.5 rounded-xl border border-[#d6cfc2] bg-[#f5f0e8]/60 text-sm text-[#1a2a3a] focus:border-[#1e3a5f] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/10 transition-all duration-200 appearance-none cursor-pointer"
                >
                  {ALL_CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
              </div>

              {/* Availability filter */}
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <select
                  value={availFilter}
                  onChange={(e) => setAvailFilter(e.target.value as AvailabilityFilter)}
                  className="pl-9 pr-8 py-2.5 rounded-xl border border-[#d6cfc2] bg-[#f5f0e8]/60 text-sm text-[#1a2a3a] focus:border-[#1e3a5f] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/10 transition-all duration-200 appearance-none cursor-pointer"
                >
                  {AVAILABILITY_FILTERS.map((f) => (
                    <option key={f} value={f}>{f}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
              </div>
            </div>

            {/* Results count */}
            <div className="mt-3 flex items-center gap-2">
              <Info className="h-3.5 w-3.5 text-slate-400" />
              <span className="text-xs text-slate-500 font-medium">
                Showing <span className="font-bold text-[#1e3a5f]">{filtered.length}</span> of{" "}
                <span className="font-bold text-[#1e3a5f]">{books.length}</span> books
              </span>
            </div>
          </div>
        </Reveal>

        {/* ── Books Table ── */}
        <Reveal delay={0.05}>
          <div className="bg-white rounded-2xl border border-[#d6cfc2] shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_-8px_rgba(0,0,0,0.10)] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#d6cfc2] bg-[#f5f0e8]">
                    {["#", "Title & Author", "ISBN", "Category", "Publisher", "Year", "Copies", "Status", "Actions"].map((col) => (
                      <th
                        key={col}
                        className="px-4 py-3.5 text-left text-xs font-bold uppercase tracking-wider text-[#1e3a5f] whitespace-nowrap"
                      >
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    [...Array(6)].map((_, i) => <SkeletonRow key={i} />)
                  ) : filtered.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-20 text-center">
                        <div className="flex flex-col items-center gap-4">
                          <div className="w-16 h-16 rounded-2xl bg-[#f5f0e8] border border-[#d6cfc2] flex items-center justify-center">
                            <BookOpen className="w-8 h-8 text-[#c8a96e]" />
                          </div>
                          <div>
                            <p className="text-base font-bold text-[#1e3a5f]">No books found</p>
                            <p className="text-sm text-slate-400 mt-1">
                              {search || categoryFilter !== "All" || availFilter !== "All"
                                ? "Try adjusting your search or filters."
                                : "Start by adding your first book to the catalog."}
                            </p>
                          </div>
                          {!search && categoryFilter === "All" && availFilter === "All" && (
                            <button
                              onClick={openAdd}
                              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#c8a96e] text-sm font-semibold text-white hover:bg-[#b8944f] transition-all duration-200"
                            >
                              <Plus className="h-4 w-4" />
                              Add First Book
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filtered.map((book, idx) => (
                      <motion.tr
                        key={book.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.25, delay: idx * 0.03 }}
                        className={cn(
                          "border-b border-[#d6cfc2]/40 transition-colors duration-150 group",
                          idx % 2 === 0 ? "bg-white" : "bg-[#faf8f4]",
                          "hover:bg-[#f5f0e8]"
                        )}
                      >
                        {/* # */}
                        <td className="px-4 py-3.5">
                          <span className="text-xs font-bold text-slate-400">{idx + 1}</span>
                        </td>

                        {/* Title & Author */}
                        <td className="px-4 py-3.5 min-w-[180px]">
                          <div>
                            <p className="font-semibold text-[#1e3a5f] leading-tight line-clamp-1">{book.title}</p>
                            <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                              <User className="h-3 w-3" />
                              {book.author}
                            </p>
                          </div>
                        </td>

                        {/* ISBN */}
                        <td className="px-4 py-3.5">
                          <span className="text-xs font-mono text-slate-500">
                            {book.isbn ?? <span className="text-slate-300">—</span>}
                          </span>
                        </td>

                        {/* Category */}
                        <td className="px-4 py-3.5">
                          {book.category ? (
                            <span className="inline-flex items-center rounded-full bg-[#1e3a5f]/8 border border-[#1e3a5f]/15 px-2.5 py-0.5 text-xs font-medium text-[#1e3a5f]">
                              {book.category}
                            </span>
                          ) : (
                            <span className="text-slate-300 text-xs">—</span>
                          )}
                        </td>

                        {/* Publisher */}
                        <td className="px-4 py-3.5">
                          <span className="text-xs text-slate-500 line-clamp-1">
                            {book.publisher ?? <span className="text-slate-300">—</span>}
                          </span>
                        </td>

                        {/* Year */}
                        <td className="px-4 py-3.5">
                          <span className="text-xs text-slate-500">
                            {book.publication_year ?? <span className="text-slate-300">—</span>}
                          </span>
                        </td>

                        {/* Copies */}
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-1">
                            <span
                              className={cn(
                                "text-sm font-bold",
                                book.available_copies === 0
                                  ? "text-red-600"
                                  : book.available_copies < 2
                                  ? "text-amber-600"
                                  : "text-emerald-600"
                              )}
                            >
                              {book.available_copies}
                            </span>
                            <span className="text-xs text-slate-400">/ {book.total_copies}</span>
                          </div>
                        </td>

                        {/* Status */}
                        <td className="px-4 py-3.5">
                          <StatusBadge available={book.available_copies} total={book.total_copies} />
                        </td>

                        {/* Actions */}
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-1.5 opacity-70 group-hover:opacity-100 transition-opacity duration-150">
                            <button
                              onClick={() => openEdit(book)}
                              title="Edit book"
                              className="w-8 h-8 rounded-lg flex items-center justify-center border border-[#1e3a5f]/20 bg-[#1e3a5f]/5 text-[#1e3a5f] hover:bg-[#1e3a5f] hover:text-white hover:border-[#1e3a5f] transition-all duration-200"
                            >
                              <Edit className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => openDelete(book)}
                              title="Delete book"
                              className="w-8 h-8 rounded-lg flex items-center justify-center border border-red-200 bg-red-50 text-red-600 hover:bg-red-600 hover:text-white hover:border-red-600 transition-all duration-200"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Table footer */}
            {!loading && filtered.length > 0 && (
              <div className="px-4 py-3 border-t border-[#d6cfc2]/60 bg-[#f5f0e8]/50 flex items-center justify-between">
                <span className="text-xs text-slate-500">
                  {filtered.length} record{filtered.length !== 1 ? "s" : ""} displayed
                </span>
                <span className="text-xs text-slate-400 font-medium">
                  Book Collection &middot; LMS Database Module
                </span>
              </div>
            )}
          </div>
        </Reveal>
      </div>

      {/* ── Modals ── */}
      <BookFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
        initial={editingBook}
        mode={modalMode}
      />

      <DeleteModal
        open={deleteOpen}
        bookTitle={deletingBook?.title ?? ""}
        onConfirm={handleDelete}
        onCancel={() => { setDeleteOpen(false); setDeletingBook(null); }}
        deleting={deleting}
      />
    </div>
  );
}
