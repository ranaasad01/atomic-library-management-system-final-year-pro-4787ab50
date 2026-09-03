"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { Reveal } from "@/components/Reveal";
import { fadeInUp, staggerContainer, scaleIn } from "@/lib/motion";
import { Search, Plus, Edit, Trash2, X, Check, BookOpen, AlertCircle, ChevronDown, Filter, Save, Eye } from 'lucide-react';
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
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium", color)}>
      <span className={cn("h-1.5 w-1.5 rounded-full", pct === 0 ? "bg-red-500" : pct < 0.4 ? "bg-amber-500" : "bg-emerald-500")} />
      {label}
    </span>
  );
}

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
          <motion.div
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
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
              className="relative w-full max-w-2xl rounded-2xl border border-[var(--brand-border)] bg-white shadow-[0_8px_40px_-8px_rgba(30,58,95,0.18)] overflow-hidden"
              initial={{ scale: 0.95, y: 16 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 16 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal header */}
              <div className="flex items-center justify-between border-b border-[var(--brand-border)] bg-[var(--brand-navy)] px-6 py-4">
                <div className="flex items-center gap-3">
                  <BookOpen className="h-5 w-5 text-[var(--brand-gold)]" />
                  <h2 className="text-lg font-semibold text-white">
                    {mode === "add" ? "Add New Book" : "Edit Book"}
                  </h2>
                </div>
                <button
                  onClick={onClose}
                  className="rounded-lg p-1.5 text-white/60 transition-colors hover:bg-white/10 hover:text-white"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="max-h-[75vh] overflow-y-auto p-6">
                {error && (
                  <div className="mb-4 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    {error}
                  </div>
                )}

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {/* Title */}
                  <div className="sm:col-span-2">
                    <label className="mb-1.5 block text-sm font-medium text-[var(--brand-navy)]">
                      Title <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={form.title}
                      onChange={(e) => set("title", e.target.value)}
                      placeholder="e.g. Introduction to Algorithms"
                      className="w-full rounded-xl border border-[var(--brand-border)] bg-[var(--brand-cream)] px-4 py-2.5 text-sm text-[var(--brand-navy)] placeholder-gray-400 outline-none transition focus:border-[var(--brand-gold)] focus:ring-2 focus:ring-[var(--brand-gold)]/20"
                    />
                  </div>

                  {/* Author */}
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-[var(--brand-navy)]">
                      Author <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={form.author}
                      onChange={(e) => set("author", e.target.value)}
                      placeholder="e.g. Thomas H. Cormen"
                      className="w-full rounded-xl border border-[var(--brand-border)] bg-[var(--brand-cream)] px-4 py-2.5 text-sm text-[var(--brand-navy)] placeholder-gray-400 outline-none transition focus:border-[var(--brand-gold)] focus:ring-2 focus:ring-[var(--brand-gold)]/20"
                    />
                  </div>

                  {/* ISBN */}
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-[var(--brand-navy)]">
                      ISBN
                    </label>
                    <input
                      type="text"
                      value={form.isbn}
                      onChange={(e) => set("isbn", e.target.value)}
                      placeholder="e.g. 978-0-262-03384-8"
                      className="w-full rounded-xl border border-[var(--brand-border)] bg-[var(--brand-cream)] px-4 py-2.5 text-sm text-[var(--brand-navy)] placeholder-gray-400 outline-none transition focus:border-[var(--brand-gold)] focus:ring-2 focus:ring-[var(--brand-gold)]/20"
                    />
                  </div>

                  {/* Category */}
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-[var(--brand-navy)]">
                      Category
                    </label>
                    <div className="relative">
                      <select
                        value={form.category}
                        onChange={(e) => set("category", e.target.value)}
                        className="w-full appearance-none rounded-xl border border-[var(--brand-border)] bg-[var(--brand-cream)] px-4 py-2.5 text-sm text-[var(--brand-navy)] outline-none transition focus:border-[var(--brand-gold)] focus:ring-2 focus:ring-[var(--brand-gold)]/20"
                      >
                        <option value="">Select category</option>
                        {BOOK_CATEGORIES.filter((c) => c !== "All").map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    </div>
                  </div>

                  {/* Publisher */}
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-[var(--brand-navy)]">
                      Publisher
                    </label>
                    <input
                      type="text"
                      value={form.publisher}
                      onChange={(e) => set("publisher", e.target.value)}
                      placeholder="e.g. MIT Press"
                      className="w-full rounded-xl border border-[var(--brand-border)] bg-[var(--brand-cream)] px-4 py-2.5 text-sm text-[var(--brand-navy)] placeholder-gray-400 outline-none transition focus:border-[var(--brand-gold)] focus:ring-2 focus:ring-[var(--brand-gold)]/20"
                    />
                  </div>

                  {/* Publication Year */}
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-[var(--brand-navy)]">
                      Publication Year
                    </label>
                    <input
                      type="number"
                      value={form.publication_year}
                      onChange={(e) => set("publication_year", e.target.value)}
                      placeholder="e.g. 2022"
                      min="1800"
                      max="2099"
                      className="w-full rounded-xl border border-[var(--brand-border)] bg-[var(--brand-cream)] px-4 py-2.5 text-sm text-[var(--brand-navy)] placeholder-gray-400 outline-none transition focus:border-[var(--brand-gold)] focus:ring-2 focus:ring-[var(--brand-gold)]/20"
                    />
                  </div>

                  {/* Total Copies */}
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-[var(--brand-navy)]">
                      Total Copies
                    </label>
                    <input
                      type="number"
                      value={form.total_copies}
                      onChange={(e) => set("total_copies", e.target.value)}
                      min="1"
                      className="w-full rounded-xl border border-[var(--brand-border)] bg-[var(--brand-cream)] px-4 py-2.5 text-sm text-[var(--brand-navy)] placeholder-gray-400 outline-none transition focus:border-[var(--brand-gold)] focus:ring-2 focus:ring-[var(--brand-gold)]/20"
                    />
                  </div>

                  {/* Available Copies */}
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-[var(--brand-navy)]">
                      Available Copies
                    </label>
                    <input
                      type="number"
                      value={form.available_copies}
                      onChange={(e) => set("available_copies", e.target.value)}
                      min="0"
                      className="w-full rounded-xl border border-[var(--brand-border)] bg-[var(--brand-cream)] px-4 py-2.5 text-sm text-[var(--brand-navy)] placeholder-gray-400 outline-none transition focus:border-[var(--brand-gold)] focus:ring-2 focus:ring-[var(--brand-gold)]/20"
                    />
                  </div>

                  {/* Shelf Location */}
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-[var(--brand-navy)]">
                      Shelf Location
                    </label>
                    <input
                      type="text"
                      value={form.shelf_location}
                      onChange={(e) => set("shelf_location", e.target.value)}
                      placeholder="e.g. A-12"
                      className="w-full rounded-xl border border-[var(--brand-border)] bg-[var(--brand-cream)] px-4 py-2.5 text-sm text-[var(--brand-navy)] placeholder-gray-400 outline-none transition focus:border-[var(--brand-gold)] focus:ring-2 focus:ring-[var(--brand-gold)]/20"
                    />
                  </div>

                  {/* Description */}
                  <div className="sm:col-span-2">
                    <label className="mb-1.5 block text-sm font-medium text-[var(--brand-navy)]">
                      Description
                    </label>
                    <textarea
                      value={form.description}
                      onChange={(e) => set("description", e.target.value)}
                      rows={3}
                      placeholder="Brief description of the book..."
                      className="w-full resize-none rounded-xl border border-[var(--brand-border)] bg-[var(--brand-cream)] px-4 py-2.5 text-sm text-[var(--brand-navy)] placeholder-gray-400 outline-none transition focus:border-[var(--brand-gold)] focus:ring-2 focus:ring-[var(--brand-gold)]/20"
                    />
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-6 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={onClose}
                    className="rounded-xl border border-[var(--brand-border)] bg-white px-5 py-2.5 text-sm font-medium text-[var(--brand-navy)] transition hover:bg-[var(--brand-cream)]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex items-center gap-2 rounded-xl bg-[var(--brand-navy)] px-5 py-2.5 text-sm font-medium text-white transition hover:bg-[var(--brand-navy)]/90 disabled:opacity-60"
                  >
                    {saving ? (
                      <>
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
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
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function DeleteConfirmModal({
  open,
  book,
  onClose,
  onConfirm,
}: {
  open: boolean;
  book: BookRow | null;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}) {
  const [deleting, setDeleting] = useState(false);

  const handleConfirm = async () => {
    setDeleting(true);
    try {
      await onConfirm();
      onClose();
    } finally {
      setDeleting(false);
    }
  };

  return (
    <AnimatePresence>
      {open && book && (
        <>
          <motion.div
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
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
              className="w-full max-w-md rounded-2xl border border-[var(--brand-border)] bg-white p-6 shadow-[0_8px_40px_-8px_rgba(30,58,95,0.18)]"
              initial={{ scale: 0.95, y: 16 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 16 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100">
                  <Trash2 className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-[var(--brand-navy)]">Delete Book</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Are you sure you want to delete{" "}
                    <span className="font-medium text-[var(--brand-navy)]">&ldquo;{book.title}&rdquo;</span>?
                    This action cannot be undone.
                  </p>
                </div>
              </div>
              <div className="mt-5 flex justify-end gap-3">
                <button
                  onClick={onClose}
                  className="rounded-xl border border-[var(--brand-border)] bg-white px-4 py-2 text-sm font-medium text-[var(--brand-navy)] transition hover:bg-[var(--brand-cream)]"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirm}
                  disabled={deleting}
                  className="flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700 disabled:opacity-60"
                >
                  {deleting ? (
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                  Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function ViewBookModal({ open, book, onClose }: { open: boolean; book: BookRow | null; onClose: () => void }) {
  return (
    <AnimatePresence>
      {open && book && (
        <>
          <motion.div
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
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
              className="w-full max-w-lg rounded-2xl border border-[var(--brand-border)] bg-white shadow-[0_8px_40px_-8px_rgba(30,58,95,0.18)] overflow-hidden"
              initial={{ scale: 0.95, y: 16 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 16 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-[var(--brand-border)] bg-[var(--brand-navy)] px-6 py-4">
                <div className="flex items-center gap-3">
                  <BookOpen className="h-5 w-5 text-[var(--brand-gold)]" />
                  <h2 className="text-lg font-semibold text-white">Book Details</h2>
                </div>
                <button
                  onClick={onClose}
                  className="rounded-lg p-1.5 text-white/60 transition-colors hover:bg-white/10 hover:text-white"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-gray-400">Title</p>
                  <p className="mt-0.5 text-base font-semibold text-[var(--brand-navy)]">{book.title}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wider text-gray-400">Author</p>
                    <p className="mt-0.5 text-sm text-[var(--brand-navy)]">{book.author}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wider text-gray-400">ISBN</p>
                    <p className="mt-0.5 text-sm text-[var(--brand-navy)]">{book.isbn ?? "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wider text-gray-400">Category</p>
                    <p className="mt-0.5 text-sm text-[var(--brand-navy)]">{book.category ?? "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wider text-gray-400">Publisher</p>
                    <p className="mt-0.5 text-sm text-[var(--brand-navy)]">{book.publisher ?? "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wider text-gray-400">Year</p>
                    <p className="mt-0.5 text-sm text-[var(--brand-navy)]">{book.publication_year ?? "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wider text-gray-400">Shelf</p>
                    <p className="mt-0.5 text-sm text-[var(--brand-navy)]">{book.shelf_location ?? "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wider text-gray-400">Total Copies</p>
                    <p className="mt-0.5 text-sm font-semibold text-[var(--brand-navy)]">{book.total_copies}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wider text-gray-400">Available</p>
                    <p className="mt-0.5 text-sm font-semibold text-emerald-600">{book.available_copies}</p>
                  </div>
                </div>
                {book.description && (
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wider text-gray-400">Description</p>
                    <p className="mt-0.5 text-sm leading-relaxed text-gray-600">{book.description}</p>
                  </div>
                )}
                <div>
                  <StatusBadge available={book.available_copies} total={book.total_copies} />
                </div>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export default function BookManagementPage() {
  const supabase = createClient();

  const [books, setBooks] = useState<BookRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("All");
  const [availFilter, setAvailFilter] = useState<string>("All");

  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<BookRow | null>(null);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<BookRow | null>(null);

  const [viewOpen, setViewOpen] = useState(false);
  const [viewTarget, setViewTarget] = useState<BookRow | null>(null);

  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

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
      availFilter === "All" ||
      (availFilter === "Available" && b.available_copies > 0) ||
      (availFilter === "Unavailable" && b.available_copies === 0);
    return matchSearch && matchCat && matchAvail;
  });

  const totalBooks = books.length;
  const totalCopies = books.reduce((s, b) => s + b.total_copies, 0);
  const availableCopies = books.reduce((s, b) => s + b.available_copies, 0);
  const unavailableCount = books.filter((b) => b.available_copies === 0).length;

  const handleSave = async (form: FormState) => {
    const payload = {
      title: form.title.trim(),
      author: form.author.trim(),
      isbn: form.isbn.trim() || null,
      category: form.category || null,
      publisher: form.publisher.trim() || null,
      publication_year: form.publication_year ? parseInt(form.publication_year, 10) : null,
      total_copies: parseInt(form.total_copies, 10) || 1,
      available_copies: parseInt(form.available_copies, 10) || 0,
      shelf_location: form.shelf_location.trim() || null,
      description: form.description.trim() || null,
      updated_at: new Date().toISOString(),
    };

    if (modalMode === "add") {
      const { error: insertError } = await supabase.from("books").insert([
        { ...payload, created_at: new Date().toISOString() },
      ]);
      if (insertError) throw insertError;
      showToast("Book added successfully.");
    } else if (editTarget) {
      const { error: updateError } = await supabase
        .from("books")
        .update(payload)
        .eq("id", editTarget.id);
      if (updateError) throw updateError;
      showToast("Book updated successfully.");
    }
    await fetchBooks();
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const { error: deleteError } = await supabase
      .from("books")
      .delete()
      .eq("id", deleteTarget.id);
    if (deleteError) throw deleteError;
    showToast("Book deleted.");
    await fetchBooks();
  };

  return (
    <div className="min-h-screen bg-[var(--brand-cream)]">
      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            className={cn(
              "fixed right-4 top-4 z-[100] flex items-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium shadow-lg",
              toast.type === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                : "border-red-200 bg-red-50 text-red-800"
            )}
            initial={{ opacity: 0, y: -12, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.95 }}
            transition={{ duration: 0.22 }}
          >
            {toast.type === "success" ? (
              <Check className="h-4 w-4 text-emerald-600" />
            ) : (
              <AlertCircle className="h-4 w-4 text-red-600" />
            )}
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Page Header */}
        <Reveal>
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-[var(--brand-navy)] sm:text-3xl">
                Book Management
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                Add, edit, and manage the library catalog. Track availability and shelf locations.
              </p>
            </div>
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => {
                setModalMode("add");
                setEditTarget(null);
                setFormOpen(true);
              }}
              className="flex items-center gap-2 rounded-xl bg-[var(--brand-navy)] px-5 py-2.5 text-sm font-semibold text-white shadow-[0_2px_8px_rgba(30,58,95,0.25)] transition hover:bg-[var(--brand-navy)]/90"
            >
              <Plus className="h-4 w-4" />
              Add New Book
            </motion.button>
          </div>
        </Reveal>

        {/* Stats Row */}
        <Reveal delay={0.05}>
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4"
          >
            {[
              { label: "Total Titles", value: totalBooks, color: "text-[var(--brand-navy)]", bg: "bg-[var(--brand-navy)]/5" },
              { label: "Total Copies", value: totalCopies, color: "text-[var(--brand-gold)]", bg: "bg-[var(--brand-gold)]/10" },
              { label: "Available", value: availableCopies, color: "text-emerald-600", bg: "bg-emerald-50" },
              { label: "Unavailable Titles", value: unavailableCount, color: "text-red-600", bg: "bg-red-50" },
            ].map((stat) => (
              <motion.div
                key={stat.label}
                variants={scaleIn}
                className={cn(
                  "rounded-2xl border border-[var(--brand-border)] p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_4px_12px_-4px_rgba(0,0,0,0.08)]",
                  stat.bg
                )}
              >
                <p className="text-xs font-medium uppercase tracking-wider text-gray-500">{stat.label}</p>
                <p className={cn("mt-1.5 text-3xl font-bold", stat.color)}>{stat.value}</p>
              </motion.div>
            ))}
          </motion.div>
        </Reveal>

        {/* Filters */}
        <Reveal delay={0.1}>
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by title, author, ISBN, or category..."
                className="w-full rounded-xl border border-[var(--brand-border)] bg-white py-2.5 pl-10 pr-4 text-sm text-[var(--brand-navy)] placeholder-gray-400 outline-none transition focus:border-[var(--brand-gold)] focus:ring-2 focus:ring-[var(--brand-gold)]/20"
              />
            </div>

            {/* Category filter */}
            <div className="relative">
              <Filter className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="appearance-none rounded-xl border border-[var(--brand-border)] bg-white py-2.5 pl-9 pr-8 text-sm text-[var(--brand-navy)] outline-none transition focus:border-[var(--brand-gold)] focus:ring-2 focus:ring-[var(--brand-gold)]/20"
              >
                {BOOK_CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            </div>

            {/* Availability filter */}
            <div className="relative">
              <select
                value={availFilter}
                onChange={(e) => setAvailFilter(e.target.value)}
                className="appearance-none rounded-xl border border-[var(--brand-border)] bg-white py-2.5 pl-4 pr-8 text-sm text-[var(--brand-navy)] outline-none transition focus:border-[var(--brand-gold)] focus:ring-2 focus:ring-[var(--brand-gold)]/20"
              >
                {AVAILABILITY_FILTERS.map((f) => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            </div>
          </div>
        </Reveal>

        {/* Table */}
        <Reveal delay={0.15}>
          <div className="overflow-hidden rounded-2xl border border-[var(--brand-border)] bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_-8px_rgba(0,0,0,0.08)]">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                <span className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--brand-gold)]/30 border-t-[var(--brand-gold)]" />
                <p className="mt-3 text-sm">Loading books...</p>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center py-20 text-red-500">
                <AlertCircle className="h-8 w-8" />
                <p className="mt-2 text-sm">{error}</p>
                <button
                  onClick={fetchBooks}
                  className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-xs font-medium text-red-700 hover:bg-red-100"
                >
                  Retry
                </button>
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                <BookOpen className="h-10 w-10 opacity-40" />
                <p className="mt-3 text-sm font-medium">No books found</p>
                <p className="text-xs">Try adjusting your search or filters.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[var(--brand-border)] bg-[var(--brand-navy)]/5">
                      <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-[var(--brand-navy)]">Title / Author</th>
                      <th className="hidden px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-[var(--brand-navy)] md:table-cell">Category</th>
                      <th className="hidden px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-[var(--brand-navy)] lg:table-cell">ISBN</th>
                      <th className="hidden px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-[var(--brand-navy)] sm:table-cell">Copies</th>
                      <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-[var(--brand-navy)]">Status</th>
                      <th className="hidden px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-[var(--brand-navy)] lg:table-cell">Shelf</th>
                      <th className="px-4 py-3.5 text-right text-xs font-semibold uppercase tracking-wider text-[var(--brand-navy)]">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--brand-border)]">
                    <AnimatePresence>
                      {filtered.map((book, i) => (
                        <motion.tr
                          key={book.id}
                          variants={fadeInUp}
                          initial="hidden"
                          animate="visible"
                          transition={{ delay: i * 0.03 }}
                          className="group transition-colors hover:bg-[var(--brand-cream)]/60"
                        >
                          <td className="px-5 py-4">
                            <p className="font-semibold text-[var(--brand-navy)] leading-tight">{book.title}</p>
                            <p className="mt-0.5 text-xs text-gray-500">{book.author}</p>
                          </td>
                          <td className="hidden px-4 py-4 md:table-cell">
                            {book.category ? (
                              <span className="inline-flex items-center rounded-full bg-[var(--brand-navy)]/8 px-2.5 py-0.5 text-xs font-medium text-[var(--brand-navy)]">
                                {book.category}
                              </span>
                            ) : (
                              <span className="text-xs text-gray-400">N/A</span>
                            )}
                          </td>
                          <td className="hidden px-4 py-4 text-xs text-gray-500 lg:table-cell">
                            {book.isbn ?? "N/A"}
                          </td>
                          <td className="hidden px-4 py-4 sm:table-cell">
                            <span className="text-sm font-medium text-[var(--brand-navy)]">{book.available_copies}</span>
                            <span className="text-xs text-gray-400"> / {book.total_copies}</span>
                          </td>
                          <td className="px-4 py-4">
                            <StatusBadge available={book.available_copies} total={book.total_copies} />
                          </td>
                          <td className="hidden px-4 py-4 text-xs text-gray-500 lg:table-cell">
                            {book.shelf_location ?? "N/A"}
                          </td>
                          <td className="px-4 py-4 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => { setViewTarget(book); setViewOpen(true); }}
                                className="rounded-lg p-1.5 text-gray-400 transition hover:bg-[var(--brand-navy)]/8 hover:text-[var(--brand-navy)]"
                                title="View details"
                              >
                                <Eye className="h-4 w-4" />
                              </motion.button>
                              <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => {
                                  setModalMode("edit");
                                  setEditTarget(book);
                                  setFormOpen(true);
                                }}
                                className="rounded-lg p-1.5 text-gray-400 transition hover:bg-[var(--brand-gold)]/10 hover:text-[var(--brand-gold)]"
                                title="Edit book"
                              >
                                <Edit className="h-4 w-4" />
                              </motion.button>
                              <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => { setDeleteTarget(book); setDeleteOpen(true); }}
                                className="rounded-lg p-1.5 text-gray-400 transition hover:bg-red-50 hover:text-red-600"
                                title="Delete book"
                              >
                                <Trash2 className="h-4 w-4" />
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
            {!loading && !error && filtered.length > 0 && (
              <div className="border-t border-[var(--brand-border)] bg-[var(--brand-cream)]/40 px-5 py-3">
                <p className="text-xs text-gray-500">
                  Showing <span className="font-medium text-[var(--brand-navy)]">{filtered.length}</span> of{" "}
                  <span className="font-medium text-[var(--brand-navy)]">{totalBooks}</span> books
                </p>
              </div>
            )}
          </div>
        </Reveal>
      </div>

      {/* Modals */}
      <BookFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSave={handleSave}
        initial={editTarget}
        mode={modalMode}
      />
      <DeleteConfirmModal
        open={deleteOpen}
        book={deleteTarget}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
      />
      <ViewBookModal
        open={viewOpen}
        book={viewTarget}
        onClose={() => setViewOpen(false)}
      />
    </div>
  );
}