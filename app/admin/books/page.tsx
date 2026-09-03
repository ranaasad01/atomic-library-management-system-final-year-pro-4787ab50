"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Plus, Edit, Trash2, X, Check, BookOpen, AlertCircle, ChevronDown, Save, Eye } from 'lucide-react';
import { Reveal } from "@/components/Reveal";
import { fadeInUp, staggerContainer, scaleIn } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { BOOK_CATEGORIES } from "@/lib/data";
type APP_BRAND = any;
const APP_BRAND: any = [];

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

type ModalMode = "add" | "edit" | "view" | null;

interface BookFormData {
  title: string;
  author: string;
  isbn: string;
  category: string;
  publisher: string;
  publication_year: string;
  total_copies: string;
  available_copies: string;
  shelf_location: string;
  description: string;
}

const EMPTY_FORM: BookFormData = {
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

const STATUS_FILTERS = ["All", "Available", "Unavailable"] as const;
type StatusFilter = (typeof STATUS_FILTERS)[number];

// ─── Stat Card ──────────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string | number;
  sub?: string;
  accent?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border p-5 flex flex-col gap-1 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_-8px_rgba(0,0,0,0.08)]",
        accent
          ? "bg-[var(--brand-navy)] border-[var(--brand-navy)] text-white"
          : "bg-white border-[var(--brand-border)]"
      )}
    >
      <span
        className={cn(
          "text-xs font-medium uppercase tracking-wider",
          accent ? "text-white/60" : "text-[var(--brand-muted)]"
        )}
      >
        {label}
      </span>
      <span
        className={cn(
          "text-3xl font-bold",
          accent ? "text-white" : "text-[var(--brand-navy)]"
        )}
      >
        {value}
      </span>
      {sub && (
        <span
          className={cn(
            "text-xs",
            accent ? "text-white/50" : "text-[var(--brand-muted)]"
          )}
        >
          {sub}
        </span>
      )}
    </div>
  );
}

// ─── Book Form Modal ─────────────────────────────────────────────────────────────

function BookModal({
  mode,
  book,
  onClose,
  onSave,
}: {
  mode: ModalMode;
  book: BookRow | null;
  onClose: () => void;
  onSave: (data: BookFormData, id?: string) => Promise<void>;
}) {
  const [form, setForm] = useState<BookFormData>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Partial<BookFormData>>({});

  useEffect(() => {
    if (book && (mode === "edit" || mode === "view")) {
      setForm({
        title: book.title,
        author: book.author,
        isbn: book.isbn ?? "",
        category: book.category ?? "",
        publisher: book.publisher ?? "",
        publication_year: book.publication_year?.toString() ?? "",
        total_copies: book.total_copies.toString(),
        available_copies: book.available_copies.toString(),
        shelf_location: book.shelf_location ?? "",
        description: book.description ?? "",
      });
    } else {
      setForm(EMPTY_FORM);
    }
    setErrors({});
  }, [book, mode]);

  const validate = (): boolean => {
    const e: Partial<BookFormData> = {};
    if (!form.title.trim()) e.title = "Title is required";
    if (!form.author.trim()) e.author = "Author is required";
    if (form.total_copies && isNaN(Number(form.total_copies)))
      e.total_copies = "Must be a number";
    if (form.available_copies && isNaN(Number(form.available_copies)))
      e.available_copies = "Must be a number";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      await onSave(form, book?.id);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const readOnly = mode === "view";
  const title =
    mode === "add"
      ? "Add New Book"
      : mode === "edit"
      ? "Edit Book"
      : "Book Details";

  return (
    <AnimatePresence>
      {mode && (
        <>
          <motion.div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-[var(--brand-border)]"
              variants={scaleIn}
              initial="hidden"
              animate="visible"
              exit="hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--brand-border)] bg-[var(--brand-cream)] rounded-t-2xl">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[var(--brand-navy)] flex items-center justify-center">
                    <BookOpen className="w-4 h-4 text-white" />
                  </div>
                  <h2 className="text-lg font-semibold text-[var(--brand-navy)]">
                    {title}
                  </h2>
                </div>
                <button
                  onClick={onClose}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--brand-muted)] hover:bg-black/5 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Modal Body */}
              <form onSubmit={handleSubmit} className="p-6 space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Title */}
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-medium text-[var(--brand-navy)] mb-1">
                      Title <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={form.title}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, title: e.target.value }))
                      }
                      readOnly={readOnly}
                      placeholder="Book title"
                      className={cn(
                        "w-full rounded-xl border px-3 py-2 text-sm text-[var(--brand-navy)] placeholder:text-[var(--brand-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-navy)]/20 transition-all",
                        readOnly
                          ? "bg-[var(--brand-cream)] border-[var(--brand-border)] cursor-default"
                          : "bg-white border-[var(--brand-border)] hover:border-[var(--brand-navy)]/40",
                        errors.title && "border-red-400"
                      )}
                    />
                    {errors.title && (
                      <p className="text-xs text-red-500 mt-1">{errors.title}</p>
                    )}
                  </div>

                  {/* Author */}
                  <div>
                    <label className="block text-xs font-medium text-[var(--brand-navy)] mb-1">
                      Author <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={form.author}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, author: e.target.value }))
                      }
                      readOnly={readOnly}
                      placeholder="Author name"
                      className={cn(
                        "w-full rounded-xl border px-3 py-2 text-sm text-[var(--brand-navy)] placeholder:text-[var(--brand-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-navy)]/20 transition-all",
                        readOnly
                          ? "bg-[var(--brand-cream)] border-[var(--brand-border)] cursor-default"
                          : "bg-white border-[var(--brand-border)] hover:border-[var(--brand-navy)]/40",
                        errors.author && "border-red-400"
                      )}
                    />
                    {errors.author && (
                      <p className="text-xs text-red-500 mt-1">{errors.author}</p>
                    )}
                  </div>

                  {/* ISBN */}
                  <div>
                    <label className="block text-xs font-medium text-[var(--brand-navy)] mb-1">
                      ISBN
                    </label>
                    <input
                      type="text"
                      value={form.isbn}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, isbn: e.target.value }))
                      }
                      readOnly={readOnly}
                      placeholder="978-3-16-148410-0"
                      className={cn(
                        "w-full rounded-xl border px-3 py-2 text-sm text-[var(--brand-navy)] placeholder:text-[var(--brand-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-navy)]/20 transition-all",
                        readOnly
                          ? "bg-[var(--brand-cream)] border-[var(--brand-border)] cursor-default"
                          : "bg-white border-[var(--brand-border)] hover:border-[var(--brand-navy)]/40"
                      )}
                    />
                  </div>

                  {/* Category */}
                  <div>
                    <label className="block text-xs font-medium text-[var(--brand-navy)] mb-1">
                      Category
                    </label>
                    {readOnly ? (
                      <input
                        type="text"
                        value={form.category}
                        readOnly
                        className="w-full rounded-xl border px-3 py-2 text-sm text-[var(--brand-navy)] bg-[var(--brand-cream)] border-[var(--brand-border)] cursor-default"
                      />
                    ) : (
                      <div className="relative">
                        <select
                          value={form.category}
                          onChange={(e) =>
                            setForm((p) => ({ ...p, category: e.target.value }))
                          }
                          className="w-full rounded-xl border border-[var(--brand-border)] px-3 py-2 text-sm text-[var(--brand-navy)] bg-white hover:border-[var(--brand-navy)]/40 focus:outline-none focus:ring-2 focus:ring-[var(--brand-navy)]/20 appearance-none transition-all"
                        >
                          <option value="">Select category</option>
                          {BOOK_CATEGORIES.map((c) => (
                            <option key={c} value={c}>
                              {c}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--brand-muted)] pointer-events-none" />
                      </div>
                    )}
                  </div>

                  {/* Publisher */}
                  <div>
                    <label className="block text-xs font-medium text-[var(--brand-navy)] mb-1">
                      Publisher
                    </label>
                    <input
                      type="text"
                      value={form.publisher}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, publisher: e.target.value }))
                      }
                      readOnly={readOnly}
                      placeholder="Publisher name"
                      className={cn(
                        "w-full rounded-xl border px-3 py-2 text-sm text-[var(--brand-navy)] placeholder:text-[var(--brand-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-navy)]/20 transition-all",
                        readOnly
                          ? "bg-[var(--brand-cream)] border-[var(--brand-border)] cursor-default"
                          : "bg-white border-[var(--brand-border)] hover:border-[var(--brand-navy)]/40"
                      )}
                    />
                  </div>

                  {/* Publication Year */}
                  <div>
                    <label className="block text-xs font-medium text-[var(--brand-navy)] mb-1">
                      Publication Year
                    </label>
                    <input
                      type="number"
                      value={form.publication_year}
                      onChange={(e) =>
                        setForm((p) => ({
                          ...p,
                          publication_year: e.target.value,
                        }))
                      }
                      readOnly={readOnly}
                      placeholder="2024"
                      min="1800"
                      max="2099"
                      className={cn(
                        "w-full rounded-xl border px-3 py-2 text-sm text-[var(--brand-navy)] placeholder:text-[var(--brand-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-navy)]/20 transition-all",
                        readOnly
                          ? "bg-[var(--brand-cream)] border-[var(--brand-border)] cursor-default"
                          : "bg-white border-[var(--brand-border)] hover:border-[var(--brand-navy)]/40"
                      )}
                    />
                  </div>

                  {/* Total Copies */}
                  <div>
                    <label className="block text-xs font-medium text-[var(--brand-navy)] mb-1">
                      Total Copies
                    </label>
                    <input
                      type="number"
                      value={form.total_copies}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, total_copies: e.target.value }))
                      }
                      readOnly={readOnly}
                      min="0"
                      className={cn(
                        "w-full rounded-xl border px-3 py-2 text-sm text-[var(--brand-navy)] placeholder:text-[var(--brand-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-navy)]/20 transition-all",
                        readOnly
                          ? "bg-[var(--brand-cream)] border-[var(--brand-border)] cursor-default"
                          : "bg-white border-[var(--brand-border)] hover:border-[var(--brand-navy)]/40",
                        errors.total_copies && "border-red-400"
                      )}
                    />
                    {errors.total_copies && (
                      <p className="text-xs text-red-500 mt-1">
                        {errors.total_copies}
                      </p>
                    )}
                  </div>

                  {/* Available Copies */}
                  <div>
                    <label className="block text-xs font-medium text-[var(--brand-navy)] mb-1">
                      Available Copies
                    </label>
                    <input
                      type="number"
                      value={form.available_copies}
                      onChange={(e) =>
                        setForm((p) => ({
                          ...p,
                          available_copies: e.target.value,
                        }))
                      }
                      readOnly={readOnly}
                      min="0"
                      className={cn(
                        "w-full rounded-xl border px-3 py-2 text-sm text-[var(--brand-navy)] placeholder:text-[var(--brand-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-navy)]/20 transition-all",
                        readOnly
                          ? "bg-[var(--brand-cream)] border-[var(--brand-border)] cursor-default"
                          : "bg-white border-[var(--brand-border)] hover:border-[var(--brand-navy)]/40",
                        errors.available_copies && "border-red-400"
                      )}
                    />
                    {errors.available_copies && (
                      <p className="text-xs text-red-500 mt-1">
                        {errors.available_copies}
                      </p>
                    )}
                  </div>

                  {/* Shelf Location */}
                  <div>
                    <label className="block text-xs font-medium text-[var(--brand-navy)] mb-1">
                      Shelf Location
                    </label>
                    <input
                      type="text"
                      value={form.shelf_location}
                      onChange={(e) =>
                        setForm((p) => ({
                          ...p,
                          shelf_location: e.target.value,
                        }))
                      }
                      readOnly={readOnly}
                      placeholder="e.g. A-12"
                      className={cn(
                        "w-full rounded-xl border px-3 py-2 text-sm text-[var(--brand-navy)] placeholder:text-[var(--brand-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-navy)]/20 transition-all",
                        readOnly
                          ? "bg-[var(--brand-cream)] border-[var(--brand-border)] cursor-default"
                          : "bg-white border-[var(--brand-border)] hover:border-[var(--brand-navy)]/40"
                      )}
                    />
                  </div>

                  {/* Description */}
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-medium text-[var(--brand-navy)] mb-1">
                      Description
                    </label>
                    <textarea
                      value={form.description}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, description: e.target.value }))
                      }
                      readOnly={readOnly}
                      rows={3}
                      placeholder="Brief description of the book..."
                      className={cn(
                        "w-full rounded-xl border px-3 py-2 text-sm text-[var(--brand-navy)] placeholder:text-[var(--brand-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-navy)]/20 resize-none transition-all",
                        readOnly
                          ? "bg-[var(--brand-cream)] border-[var(--brand-border)] cursor-default"
                          : "bg-white border-[var(--brand-border)] hover:border-[var(--brand-navy)]/40"
                      )}
                    />
                  </div>
                </div>

                {/* Actions */}
                {!readOnly && (
                  <div className="flex items-center justify-end gap-3 pt-2 border-t border-[var(--brand-border)]">
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-4 py-2 rounded-xl text-sm font-medium text-[var(--brand-muted)] hover:bg-black/5 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={saving}
                      className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold bg-[var(--brand-navy)] text-white hover:bg-[var(--brand-navy)]/90 disabled:opacity-60 transition-all shadow-sm"
                    >
                      {saving ? (
                        <>
                          <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
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
                )}
              </form>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ─── Delete Confirm Modal ────────────────────────────────────────────────────────

function DeleteModal({
  book,
  onClose,
  onConfirm,
}: {
  book: BookRow | null;
  onClose: () => void;
  onConfirm: (id: string) => Promise<void>;
}) {
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!book) return;
    setDeleting(true);
    try {
      await onConfirm(book.id);
      onClose();
    } finally {
      setDeleting(false);
    }
  };

  return (
    <AnimatePresence>
      {book && (
        <>
          <motion.div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white rounded-2xl shadow-2xl w-full max-w-md border border-[var(--brand-border)] p-6"
              variants={scaleIn}
              initial="hidden"
              animate="visible"
              exit="hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center flex-shrink-0">
                  <AlertCircle className="w-5 h-5 text-red-500" />
                </div>
                <div className="flex-1">
                  <h3 className="text-base font-semibold text-[var(--brand-navy)]">
                    Delete Book
                  </h3>
                  <p className="text-sm text-[var(--brand-muted)] mt-1">
                    Are you sure you want to delete{" "}
                    <span className="font-medium text-[var(--brand-navy)]">
                      &ldquo;{book.title}&rdquo;
                    </span>
                    ? This action cannot be undone.
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-end gap-3 mt-6">
                <button
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl text-sm font-medium text-[var(--brand-muted)] hover:bg-black/5 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold bg-red-500 text-white hover:bg-red-600 disabled:opacity-60 transition-all"
                >
                  {deleting ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      Delete
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

// ─── Main Page ───────────────────────────────────────────────────────────────────

export default function AdminBooksPage() {
  const supabase = createClient();

  const [books, setBooks] = useState<BookRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("All");

  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [selectedBook, setSelectedBook] = useState<BookRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<BookRow | null>(null);

  const [toast, setToast] = useState<{
    msg: string;
    type: "success" | "error";
  } | null>(null);

  const showToast = (msg: string, type: "success" | "error") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchBooks = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error: err } = await supabase
      .from("books")
      .select("*")
      .order("created_at", { ascending: false });
    if (err) {
      setError(err.message);
    } else {
      setBooks((data as BookRow[]) ?? []);
    }
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchBooks();
  }, [fetchBooks]);

  // ─── Derived stats ──────────────────────────────────────────────────────────
  const totalBooks = books.length;
  const totalCopies = books.reduce((s, b) => s + b.total_copies, 0);
  const availableCopies = books.reduce((s, b) => s + b.available_copies, 0);
  const issuedCopies = totalCopies - availableCopies;

  // ─── Filtered list ──────────────────────────────────────────────────────────
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
    const matchStatus =
      statusFilter === "All"
        ? true
        : statusFilter === "Available"
        ? b.available_copies > 0
        : b.available_copies === 0;
    return matchSearch && matchCategory && matchStatus;
  });

  // ─── CRUD handlers ──────────────────────────────────────────────────────────
  const handleSave = async (data: BookFormData, id?: string) => {
    const payload = {
      title: data.title.trim(),
      author: data.author.trim(),
      isbn: data.isbn.trim() || null,
      category: data.category || null,
      publisher: data.publisher.trim() || null,
      publication_year: data.publication_year
        ? parseInt(data.publication_year, 10)
        : null,
      total_copies: parseInt(data.total_copies, 10) || 1,
      available_copies: parseInt(data.available_copies, 10) || 1,
      shelf_location: data.shelf_location.trim() || null,
      description: data.description.trim() || null,
      updated_at: new Date().toISOString(),
    };

    if (id) {
      const { error: err } = await supabase
        .from("books")
        .update(payload)
        .eq("id", id);
      if (err) {
        showToast("Failed to update book: " + err.message, "error");
        throw err;
      }
      showToast("Book updated successfully.", "success");
    } else {
      const { error: err } = await supabase.from("books").insert({
        ...payload,
        created_at: new Date().toISOString(),
      });
      if (err) {
        showToast("Failed to add book: " + err.message, "error");
        throw err;
      }
      showToast("Book added successfully.", "success");
    }
    await fetchBooks();
  };

  const handleDelete = async (id: string) => {
    const { error: err } = await supabase.from("books").delete().eq("id", id);
    if (err) {
      showToast("Failed to delete book: " + err.message, "error");
      throw err;
    }
    showToast("Book deleted.", "success");
    await fetchBooks();
  };

  const openAdd = () => {
    setSelectedBook(null);
    setModalMode("add");
  };
  const openEdit = (b: BookRow) => {
    setSelectedBook(b);
    setModalMode("edit");
  };
  const openView = (b: BookRow) => {
    setSelectedBook(b);
    setModalMode("view");
  };
  const openDelete = (b: BookRow) => setDeleteTarget(b);
  const closeModal = () => {
    setModalMode(null);
    setSelectedBook(null);
  };

  const allCategories = ["All", ...BOOK_CATEGORIES];

  return (
    <div className="min-h-screen bg-[var(--brand-cream)]">
      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            className={cn(
              "fixed top-4 right-4 z-[100] flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg text-sm font-medium border",
              toast.type === "success"
                ? "bg-white border-green-200 text-green-700"
                : "bg-white border-red-200 text-red-600"
            )}
            initial={{ opacity: 0, y: -12, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.96 }}
            transition={{ duration: 0.25 }}
          >
            {toast.type === "success" ? (
              <Check className="w-4 h-4 text-green-500" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-500" />
            )}
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Page Header */}
        <Reveal>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-[var(--brand-gold)] mb-1">
                {APP_BRAND}
              </p>
              <h1 className="text-2xl sm:text-3xl font-bold text-[var(--brand-navy)] tracking-tight">
                Book Management
              </h1>
              <p className="text-sm text-[var(--brand-muted)] mt-1">
                Add, edit, and manage the library catalog.
              </p>
            </div>
            <motion.button
              onClick={openAdd}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[var(--brand-navy)] text-white text-sm font-semibold shadow-sm hover:bg-[var(--brand-navy)]/90 transition-all self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" />
              Add New Book
            </motion.button>
          </div>
        </Reveal>

        {/* Stat Cards */}
        <Reveal>
          <motion.div
            className="grid grid-cols-2 lg:grid-cols-4 gap-4"
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
          >
            {[
              {
                label: "Total Titles",
                value: totalBooks,
                sub: "unique books",
                accent: true,
              },
              {
                label: "Total Copies",
                value: totalCopies,
                sub: "across all titles",
              },
              {
                label: "Available",
                value: availableCopies,
                sub: "ready to issue",
              },
              {
                label: "Issued Out",
                value: issuedCopies,
                sub: "currently borrowed",
              },
            ].map((s, i) => (
              <motion.div key={s.label} variants={fadeInUp}>
                <StatCard
                  label={s.label}
                  value={loading ? "..." : s.value}
                  sub={s.sub}
                  accent={s.accent}
                />
              </motion.div>
            ))}
          </motion.div>
        </Reveal>

        {/* Filters */}
        <Reveal>
          <div className="bg-white rounded-2xl border border-[var(--brand-border)] p-4 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_-8px_rgba(0,0,0,0.08)]">
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Search */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--brand-muted)]" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by title, author, ISBN, or category..."
                  className="w-full pl-9 pr-4 py-2 rounded-xl border border-[var(--brand-border)] text-sm text-[var(--brand-navy)] placeholder:text-[var(--brand-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-navy)]/20 transition-all"
                />
              </div>

              {/* Category filter */}
              <div className="relative">
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="appearance-none pl-3 pr-8 py-2 rounded-xl border border-[var(--brand-border)] text-sm text-[var(--brand-navy)] bg-white focus:outline-none focus:ring-2 focus:ring-[var(--brand-navy)]/20 transition-all"
                >
                  {allCategories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--brand-muted)] pointer-events-none" />
              </div>

              {/* Status filter */}
              <div className="flex rounded-xl border border-[var(--brand-border)] overflow-hidden">
                {STATUS_FILTERS.map((f) => (
                  <button
                    key={f}
                    onClick={() => setStatusFilter(f)}
                    className={cn(
                      "px-3 py-2 text-xs font-medium transition-colors",
                      statusFilter === f
                        ? "bg-[var(--brand-navy)] text-white"
                        : "text-[var(--brand-muted)] hover:bg-black/5"
                    )}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </Reveal>

        {/* Books Table */}
        <Reveal>
          <div className="bg-white rounded-2xl border border-[var(--brand-border)] shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_-8px_rgba(0,0,0,0.08)] overflow-hidden">
            {/* Table header */}
            <div className="px-6 py-4 border-b border-[var(--brand-border)] flex items-center justify-between">
              <h2 className="text-sm font-semibold text-[var(--brand-navy)]">
                Library Catalog
              </h2>
              <span className="text-xs text-[var(--brand-muted)] bg-[var(--brand-cream)] px-2.5 py-1 rounded-full border border-[var(--brand-border)]">
                {loading ? "Loading..." : `${filtered.length} book${filtered.length !== 1 ? "s" : ""}`}
              </span>
            </div>

            {/* Error */}
            {error && (
              <div className="px-6 py-4 flex items-center gap-3 text-red-600 bg-red-50 border-b border-red-100">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span className="text-sm">{error}</span>
              </div>
            )}

            {/* Loading skeleton */}
            {loading && (
              <div className="divide-y divide-[var(--brand-border)]">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="px-6 py-4 flex items-center gap-4">
                    <div className="w-8 h-8 rounded-lg bg-gray-100 animate-pulse" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3 bg-gray-100 rounded animate-pulse w-1/3" />
                      <div className="h-2.5 bg-gray-100 rounded animate-pulse w-1/4" />
                    </div>
                    <div className="h-6 w-16 bg-gray-100 rounded-full animate-pulse" />
                  </div>
                ))}
              </div>
            )}

            {/* Empty state */}
            {!loading && filtered.length === 0 && (
              <div className="py-16 flex flex-col items-center gap-3 text-center">
                <div className="w-12 h-12 rounded-2xl bg-[var(--brand-cream)] border border-[var(--brand-border)] flex items-center justify-center">
                  <BookOpen className="w-6 h-6 text-[var(--brand-muted)]" />
                </div>
                <p className="text-sm font-medium text-[var(--brand-navy)]">
                  No books found
                </p>
                <p className="text-xs text-[var(--brand-muted)]">
                  {search || categoryFilter !== "All" || statusFilter !== "All"
                    ? "Try adjusting your filters."
                    : "Add your first book to get started."}
                </p>
                {!search && categoryFilter === "All" && statusFilter === "All" && (
                  <button
                    onClick={openAdd}
                    className="mt-2 flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[var(--brand-navy)] text-white text-xs font-semibold hover:bg-[var(--brand-navy)]/90 transition-all"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add First Book
                  </button>
                )}
              </div>
            )}

            {/* Table */}
            {!loading && filtered.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-[var(--brand-cream)] border-b border-[var(--brand-border)]">
                      <th className="text-left px-6 py-3 text-xs font-semibold text-[var(--brand-muted)] uppercase tracking-wider">
                        Book
                      </th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-[var(--brand-muted)] uppercase tracking-wider hidden md:table-cell">
                        Category
                      </th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-[var(--brand-muted)] uppercase tracking-wider hidden lg:table-cell">
                        Shelf
                      </th>
                      <th className="text-center px-4 py-3 text-xs font-semibold text-[var(--brand-muted)] uppercase tracking-wider">
                        Copies
                      </th>
                      <th className="text-center px-4 py-3 text-xs font-semibold text-[var(--brand-muted)] uppercase tracking-wider">
                        Status
                      </th>
                      <th className="text-right px-6 py-3 text-xs font-semibold text-[var(--brand-muted)] uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--brand-border)]">
                    <AnimatePresence initial={false}>
                      {filtered.map((book, i) => (
                        <motion.tr
                          key={book.id}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.2, delay: i * 0.02 }}
                          className="hover:bg-[var(--brand-cream)]/60 transition-colors group"
                        >
                          {/* Book info */}
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-lg bg-[var(--brand-navy)]/10 flex items-center justify-center flex-shrink-0">
                                <BookOpen className="w-4 h-4 text-[var(--brand-navy)]" />
                              </div>
                              <div className="min-w-0">
                                <p className="font-medium text-[var(--brand-navy)] truncate max-w-[200px]">
                                  {book.title}
                                </p>
                                <p className="text-xs text-[var(--brand-muted)] truncate">
                                  {book.author}
                                  {book.publication_year
                                    ? ` · ${book.publication_year}`
                                    : ""}
                                </p>
                                {book.isbn && (
                                  <p className="text-xs text-[var(--brand-muted)]/70 font-mono">
                                    {book.isbn}
                                  </p>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* Category */}
                          <td className="px-4 py-4 hidden md:table-cell">
                            {book.category ? (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[var(--brand-navy)]/8 text-[var(--brand-navy)] border border-[var(--brand-navy)]/10">
                                {book.category}
                              </span>
                            ) : (
                              <span className="text-xs text-[var(--brand-muted)]">
                                Uncategorized
                              </span>
                            )}
                          </td>

                          {/* Shelf */}
                          <td className="px-4 py-4 hidden lg:table-cell">
                            <span className="text-xs font-mono text-[var(--brand-muted)]">
                              {book.shelf_location ?? "—"}
                            </span>
                          </td>

                          {/* Copies */}
                          <td className="px-4 py-4 text-center">
                            <div className="flex flex-col items-center">
                              <span className="text-sm font-semibold text-[var(--brand-navy)]">
                                {book.available_copies}
                                <span className="text-[var(--brand-muted)] font-normal">
                                  /{book.total_copies}
                                </span>
                              </span>
                              <span className="text-xs text-[var(--brand-muted)]">
                                avail.
                              </span>
                            </div>
                          </td>

                          {/* Status */}
                          <td className="px-4 py-4 text-center">
                            <span
                              className={cn(
                                "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold",
                                book.available_copies > 0
                                  ? "bg-green-50 text-green-700 border border-green-200"
                                  : "bg-red-50 text-red-600 border border-red-200"
                              )}
                            >
                              <span
                                className={cn(
                                  "w-1.5 h-1.5 rounded-full",
                                  book.available_copies > 0
                                    ? "bg-green-500"
                                    : "bg-red-500"
                                )}
                              />
                              {book.available_copies > 0
                                ? "Available"
                                : "Unavailable"}
                            </span>
                          </td>

                          {/* Actions */}
                          <td className="px-6 py-4">
                            <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <motion.button
                                onClick={() => openView(book)}
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                title="View details"
                                className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--brand-muted)] hover:bg-[var(--brand-navy)]/8 hover:text-[var(--brand-navy)] transition-colors"
                              >
                                <Eye className="w-4 h-4" />
                              </motion.button>
                              <motion.button
                                onClick={() => openEdit(book)}
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                title="Edit book"
                                className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--brand-muted)] hover:bg-[var(--brand-gold)]/10 hover:text-[var(--brand-gold)] transition-colors"
                              >
                                <Edit className="w-4 h-4" />
                              </motion.button>
                              <motion.button
                                onClick={() => openDelete(book)}
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                title="Delete book"
                                className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--brand-muted)] hover:bg-red-50 hover:text-red-500 transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </motion.button>
                            </div>
                          </td>
                        </motion.tr>
                      ))}
                    </AnimatePresence>
                  </tbody>
                </table>
              </div>
            )}

            {/* Table footer */}
            {!loading && filtered.length > 0 && (
              <div className="px-6 py-3 border-t border-[var(--brand-border)] bg-[var(--brand-cream)] flex items-center justify-between">
                <span className="text-xs text-[var(--brand-muted)]">
                  Showing {filtered.length} of {books.length} books
                </span>
                <span className="text-xs text-[var(--brand-muted)]">
                  {availableCopies} copies available out of {totalCopies} total
                </span>
              </div>
            )}
          </div>
        </Reveal>
      </div>

      {/* Modals */}
      <BookModal
        mode={modalMode}
        book={selectedBook}
        onClose={closeModal}
        onSave={handleSave}
      />
      <DeleteModal
        book={deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
}