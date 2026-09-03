"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, BookOpen, MapPin, Hash, User, Tag, AlertCircle, X, Loader2, BookMarked, ChevronRight } from 'lucide-react';
import { createClient } from "@/lib/supabase/client";
import { Reveal } from "@/components/Reveal";
import { staggerContainer, fadeInUp, scaleIn } from "@/lib/motion";
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
}

type AvailabilityFilter = "all" | "available" | "unavailable";

// ─── Helpers ────────────────────────────────────────────────────────────────────

function getAvailabilityInfo(available: number, total: number) {
  const pct = total > 0 ? available / total : 0;
  if (pct === 0) {
    return {
      label: "Unavailable",
      dot: "bg-red-500",
      badge: "bg-red-50 text-red-700 border-red-200",
    };
  }
  if (pct < 0.4) {
    return {
      label: "Low Stock",
      dot: "bg-amber-500",
      badge: "bg-amber-50 text-amber-700 border-amber-200",
    };
  }
  return {
    label: "Available",
    dot: "bg-emerald-500",
    badge: "bg-emerald-50 text-emerald-700 border-emerald-200",
  };
}

// ─── Book Card ───────────────────────────────────────────────────────────────────

function BookCard({ book }: { book: BookRow }) {
  const avail = getAvailabilityInfo(book.available_copies, book.total_copies);
  const initials = book.title
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");

  return (
    <motion.div
      variants={fadeInUp}
      whileHover={{
        y: -6,
        boxShadow:
          "0 12px 40px -8px rgba(30,58,95,0.22), 0 2px 8px rgba(30,58,95,0.08)",
      }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="group relative flex flex-col bg-white rounded-2xl border border-[var(--border)] overflow-hidden shadow-[0_1px_3px_rgba(30,58,95,0.07),0_4px_16px_-4px_rgba(30,58,95,0.09)] transition-all duration-300"
    >
      {/* Cover placeholder */}
      <div className="relative h-40 flex items-center justify-center bg-gradient-to-br from-[#1e3a5f] via-[#2a4f7c] to-[#c8a96e] overflow-hidden flex-shrink-0">
        {/* Decorative circles */}
        <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full bg-white/5" />
        <div className="absolute -bottom-4 -left-4 w-20 h-20 rounded-full bg-white/5" />
        <div className="absolute top-3 left-3 w-8 h-8 rounded-full bg-[var(--accent)]/20" />

        {/* Initials block */}
        <div className="relative z-10 flex flex-col items-center gap-2">
          <div className="w-14 h-14 rounded-xl bg-white/15 backdrop-blur-sm border border-white/20 flex items-center justify-center">
            <span className="text-white font-bold text-xl tracking-tight">{initials}</span>
          </div>
          <BookOpen className="w-4 h-4 text-white/40" />
        </div>

        {/* Availability badge — top right */}
        <span
          className={cn(
            "absolute top-3 right-3 inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold backdrop-blur-sm",
            avail.badge
          )}
        >
          <span className={cn("h-1.5 w-1.5 rounded-full", avail.dot)} />
          {avail.label}
        </span>
      </div>

      {/* Body */}
      <div className="flex flex-col gap-3 p-4 flex-1">
        {/* Title & Author */}
        <div>
          <h3 className="font-semibold text-[var(--foreground)] text-sm leading-snug line-clamp-2 group-hover:text-[var(--primary)] transition-colors duration-200">
            {book.title}
          </h3>
          <p className="text-xs text-[var(--muted-foreground)] mt-0.5 flex items-center gap-1">
            <User className="w-3 h-3 flex-shrink-0" />
            {book.author}
          </p>
        </div>

        {/* Meta chips */}
        <div className="flex flex-wrap gap-1.5">
          {book.category && (
            <span className="inline-flex items-center gap-1 rounded-full bg-[var(--primary)]/8 text-[var(--primary)] border border-[var(--primary)]/15 px-2 py-0.5 text-[10px] font-medium">
              <Tag className="w-2.5 h-2.5" />
              {book.category}
            </span>
          )}
          {book.isbn && (
            <span className="inline-flex items-center gap-1 rounded-full bg-[var(--muted)] text-[var(--muted-foreground)] border border-[var(--border)] px-2 py-0.5 text-[10px] font-medium">
              <Hash className="w-2.5 h-2.5" />
              {book.isbn}
            </span>
          )}
        </div>

        {/* Divider */}
        <div className="border-t border-[var(--border)]" />

        {/* Footer row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 text-[10px] text-[var(--muted-foreground)]">
            {book.shelf_location ? (
              <>
                <MapPin className="w-3 h-3 text-[var(--accent)]" />
                <span className="font-medium text-[var(--foreground)]">{book.shelf_location}</span>
              </>
            ) : (
              <span className="italic">No shelf info</span>
            )}
          </div>
          <span className="text-[10px] text-[var(--muted-foreground)]">
            {book.available_copies}/{book.total_copies} copies
          </span>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Empty State ─────────────────────────────────────────────────────────────────

function EmptyState({ query }: { query: string }) {
  return (
    <motion.div
      variants={scaleIn}
      initial="hidden"
      animate="visible"
      className="flex flex-col items-center justify-center py-24 px-6 text-center"
    >
      <div className="relative mb-6">
        <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-[var(--primary)]/10 to-[var(--accent)]/10 flex items-center justify-center border border-[var(--border)]">
          <BookOpen className="w-12 h-12 text-[var(--primary)]/40" />
        </div>
        <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-[var(--accent)]/20 flex items-center justify-center">
          <Search className="w-4 h-4 text-[var(--accent)]" />
        </div>
      </div>
      <h3 className="text-lg font-semibold text-[var(--foreground)] mb-2">
        {query ? `No results for "${query}"` : "No books found"}
      </h3>
      <p className="text-sm text-[var(--muted-foreground)] max-w-xs leading-relaxed">
        {query
          ? "Try a different title, author, or ISBN. You can also browse by category using the filters above."
          : "The catalog appears to be empty. Check back later or contact the library administrator."}
      </p>
    </motion.div>
  );
}

// ─── Category Pill ───────────────────────────────────────────────────────────────

function CategoryPill({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-medium transition-all duration-200 whitespace-nowrap",
        active
          ? "bg-[var(--primary)] border-[var(--primary)] text-white shadow-[0_2px_8px_rgba(30,58,95,0.25)]"
          : "bg-white border-[var(--border)] text-[var(--foreground)] hover:border-[var(--primary)]/40 hover:bg-[var(--primary)]/5"
      )}
    >
      {label}
    </button>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────────

export default function BookSearchPage() {
  const supabase = createClient();

  const [query, setQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [availabilityFilter, setAvailabilityFilter] = useState<AvailabilityFilter>("all");
  const [books, setBooks] = useState<BookRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);

  const categories = ["All", ...BOOK_CATEGORIES];

  const fetchBooks = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let q = supabase
        .from("books")
        .select("*", { count: "exact" })
        .order("title", { ascending: true });

      if (query.trim()) {
        q = q.or(
          `title.ilike.%${query.trim()}%,author.ilike.%${query.trim()}%,isbn.ilike.%${query.trim()}%`
        );
      }

      if (selectedCategory !== "All") {
        q = q.eq("category", selectedCategory);
      }

      if (availabilityFilter === "available") {
        q = q.gt("available_copies", 0);
      } else if (availabilityFilter === "unavailable") {
        q = q.eq("available_copies", 0);
      }

      const { data, error: fetchError, count } = await q;

      if (fetchError) throw fetchError;
      setBooks(data ?? []);
      setTotalCount(count ?? 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch books.");
    } finally {
      setLoading(false);
    }
  }, [query, selectedCategory, availabilityFilter]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchBooks();
    }, 300);
    return () => clearTimeout(timer);
  }, [fetchBooks]);

  const clearSearch = () => {
    setQuery("");
    setSelectedCategory("All");
    setAvailabilityFilter("all");
  };

  const hasFilters =
    query.trim() !== "" ||
    selectedCategory !== "All" ||
    availabilityFilter !== "all";

  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* ── Hero Search Header ─────────────────────────────────────────────── */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#1e3a5f] via-[#1a3356] to-[#0f2240]">
        {/* Background texture */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 25% 25%, #c8a96e 0%, transparent 50%), radial-gradient(circle at 75% 75%, #c8a96e 0%, transparent 50%)",
          }}
        />
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "repeating-linear-gradient(0deg, transparent, transparent 40px, rgba(255,255,255,1) 40px, rgba(255,255,255,1) 41px), repeating-linear-gradient(90deg, transparent, transparent 40px, rgba(255,255,255,1) 40px, rgba(255,255,255,1) 41px)",
          }}
        />

        <div className="relative container-lms py-16 md:py-20">
          <Reveal>
            <div className="text-center mb-10">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/8 px-4 py-1.5 mb-5 backdrop-blur-sm">
                <BookMarked className="w-3.5 h-3.5 text-[var(--accent)]" />
                <span className="text-white/80 text-xs font-medium tracking-wide">
                  NCBA&amp;E Library Catalog
                </span>
              </div>

              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white tracking-tight text-balance mb-3">
                Find Your Next{" "}
                <span className="text-[var(--accent)]">
                  Book
                </span>
              </h1>
              <p className="text-white/60 text-base md:text-lg max-w-xl mx-auto leading-relaxed">
                Search across thousands of titles by name, author, or ISBN. Filter by category and check real-time availability.
              </p>
            </div>
          </Reveal>

          {/* Search Input */}
          <Reveal delay={0.1}>
            <div className="max-w-2xl mx-auto mb-6">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40 pointer-events-none" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search by title, author, or ISBN..."
                  className="w-full pl-12 pr-12 py-4 rounded-2xl bg-white/10 border border-white/20 text-white placeholder:text-white/40 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/60 focus:border-[var(--accent)]/60 backdrop-blur-sm transition-all duration-200"
                />
                {query && (
                  <button
                    onClick={() => setQuery("")}
                    className="absolute right-4 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors"
                  >
                    <X className="w-3.5 h-3.5 text-white" />
                  </button>
                )}
              </div>
            </div>
          </Reveal>

          {/* Category Pills */}
          <Reveal delay={0.15}>
            <div className="max-w-4xl mx-auto">
              <div className="flex flex-wrap gap-2 justify-center">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={cn(
                      "inline-flex items-center rounded-full border px-3.5 py-1.5 text-xs font-medium transition-all duration-200 whitespace-nowrap",
                      selectedCategory === cat
                        ? "bg-[var(--accent)] border-[var(--accent)] text-[var(--foreground)] shadow-[0_2px_12px_rgba(200,169,110,0.4)]"
                        : "bg-white/8 border-white/15 text-white/70 hover:bg-white/15 hover:text-white backdrop-blur-sm"
                    )}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
          </Reveal>
        </div>
      </div>

      {/* ── Results Area ──────────────────────────────────────────────────── */}
      <div className="container-lms py-8">
        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            {loading ? (
              <div className="flex items-center gap-2 text-sm text-[var(--muted-foreground)]">
                <Loader2 className="w-4 h-4 animate-spin" />
                Searching...
              </div>
            ) : (
              <p className="text-sm text-[var(--muted-foreground)]">
                <span className="font-semibold text-[var(--foreground)]">{totalCount}</span>{" "}
                {totalCount === 1 ? "book" : "books"} found
                {selectedCategory !== "All" && (
                  <span className="text-[var(--accent)] font-medium"> in {selectedCategory}</span>
                )}
              </p>
            )}
            {hasFilters && (
              <button
                onClick={clearSearch}
                className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border)] bg-white px-3 py-1 text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:border-[var(--primary)]/30 transition-all duration-200"
              >
                <X className="w-3 h-3" />
                Clear filters
              </button>
            )}
          </div>

          {/* Availability filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-[var(--muted-foreground)] font-medium">Show:</span>
            {(["all", "available", "unavailable"] as AvailabilityFilter[]).map((f) => (
              <button
                key={f}
                onClick={() => setAvailabilityFilter(f)}
                className={cn(
                  "rounded-full border px-3 py-1 text-xs font-medium transition-all duration-200 capitalize",
                  availabilityFilter === f
                    ? "bg-[var(--primary)] border-[var(--primary)] text-white"
                    : "bg-white border-[var(--border)] text-[var(--muted-foreground)] hover:border-[var(--primary)]/30"
                )}
              >
                {f === "all" ? "All" : f === "available" ? "Available" : "Unavailable"}
              </button>
            ))}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 mb-6 text-sm text-red-700">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}

        {/* Results Grid */}
        {!loading && books.length === 0 && !error ? (
          <EmptyState query={query} />
        ) : (
          <AnimatePresence mode="wait">
            {!loading && (
              <motion.div
                key={`${query}-${selectedCategory}-${availabilityFilter}`}
                variants={staggerContainer}
                initial="hidden"
                animate="visible"
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5"
              >
                {books.map((book) => (
                  <BookCard key={book.id} book={book} />
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        )}

        {/* Loading skeleton */}
        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="rounded-2xl border border-[var(--border)] bg-white overflow-hidden animate-pulse"
              >
                <div className="h-40 bg-gradient-to-br from-[var(--muted)] to-[var(--border)]" />
                <div className="p-4 space-y-3">
                  <div className="h-4 bg-[var(--muted)] rounded-full w-3/4" />
                  <div className="h-3 bg-[var(--muted)] rounded-full w-1/2" />
                  <div className="flex gap-2">
                    <div className="h-5 bg-[var(--muted)] rounded-full w-20" />
                    <div className="h-5 bg-[var(--muted)] rounded-full w-16" />
                  </div>
                  <div className="border-t border-[var(--border)] pt-3 flex justify-between">
                    <div className="h-3 bg-[var(--muted)] rounded-full w-16" />
                    <div className="h-3 bg-[var(--muted)] rounded-full w-12" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
