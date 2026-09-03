"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, BookOpen, Filter, X, ChevronDown, Star, MapPin, User, Hash, Calendar, Layers, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import { Reveal } from "@/components/Reveal";
import { fadeInUp, staggerContainer, scaleIn } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
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

type SortOption = "title" | "author" | "year" | "availability";
type AvailabilityFilter = "all" | "available" | "unavailable";

// ─── Helpers ────────────────────────────────────────────────────────────────────

function getAvailabilityInfo(available: number, total: number) {
  if (total === 0) return { label: "Unknown", color: "bg-gray-100 text-gray-600 border-gray-200", dot: "bg-gray-400", pct: 0 };
  const pct = available / total;
  if (pct === 0) return { label: "Unavailable", color: "bg-red-100 text-red-700 border-red-200", dot: "bg-red-500", pct };
  if (pct < 0.4) return { label: "Low Stock", color: "bg-amber-100 text-amber-700 border-amber-200", dot: "bg-amber-500", pct };
  return { label: "Available", color: "bg-emerald-100 text-emerald-700 border-emerald-200", dot: "bg-emerald-500", pct };
}

function highlightText(text: string, query: string): React.ReactNode {
  if (!query.trim()) return text;
  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi");
  const parts = text.split(regex);
  return parts.map((part, i) =>
    regex.test(part) ? (
      <mark key={i} className="bg-[var(--accent)]/30 text-[var(--foreground)] rounded px-0.5">
        {part}
      </mark>
    ) : (
      part
    )
  );
}

// ─── Book Card ───────────────────────────────────────────────────────────────────

function BookCard({ book, query }: { book: BookRow; query: string }) {
  const avail = getAvailabilityInfo(book.available_copies, book.total_copies);

  return (
    <motion.div
      variants={fadeInUp}
      whileHover={{ y: -4, boxShadow: "0 12px 40px -8px rgba(30,58,95,0.18)" }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="group relative bg-white rounded-2xl border border-[var(--border)] overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.04),0_6px_20px_-6px_rgba(0,0,0,0.08)] hover:border-[var(--accent)]/40 transition-all duration-300"
    >
      {/* Top accent bar */}
      <div className="h-1 w-full bg-gradient-to-r from-[var(--primary)] via-[var(--accent)] to-[var(--primary)] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

      <div className="p-5">
        {/* Header row */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-[var(--foreground)] text-base leading-snug line-clamp-2 group-hover:text-[var(--primary)] transition-colors duration-200">
              {highlightText(book.title, query)}
            </h3>
            <p className="text-sm text-[var(--muted-foreground)] mt-0.5 flex items-center gap-1">
              <User className="w-3 h-3 flex-shrink-0" />
              <span className="truncate">{highlightText(book.author, query)}</span>
            </p>
          </div>

          {/* Book icon */}
          <div className="w-10 h-10 rounded-xl bg-[var(--primary)]/8 flex items-center justify-center flex-shrink-0 group-hover:bg-[var(--primary)]/15 transition-colors duration-200">
            <BookOpen className="w-5 h-5 text-[var(--primary)]" />
          </div>
        </div>

        {/* Availability badge */}
        <div className="mb-4">
          <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold", avail.color)}>
            <span className={cn("h-1.5 w-1.5 rounded-full", avail.dot)} />
            {avail.label}
            <span className="opacity-60">({book.available_copies}/{book.total_copies})</span>
          </span>
        </div>

        {/* Meta grid */}
        <div className="grid grid-cols-2 gap-2 text-xs text-[var(--muted-foreground)]">
          {book.isbn && (
            <div className="flex items-center gap-1.5 truncate">
              <Hash className="w-3 h-3 flex-shrink-0 text-[var(--accent)]" />
              <span className="truncate">{book.isbn}</span>
            </div>
          )}
          {book.category && (
            <div className="flex items-center gap-1.5 truncate">
              <Layers className="w-3 h-3 flex-shrink-0 text-[var(--accent)]" />
              <span className="truncate">{book.category}</span>
            </div>
          )}
          {book.publication_year && (
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3 h-3 flex-shrink-0 text-[var(--accent)]" />
              <span>{book.publication_year}</span>
            </div>
          )}
          {book.shelf_location && (
            <div className="flex items-center gap-1.5 truncate">
              <MapPin className="w-3 h-3 flex-shrink-0 text-[var(--accent)]" />
              <span className="truncate">{book.shelf_location}</span>
            </div>
          )}
        </div>

        {/* Description */}
        {book.description && (
          <p className="mt-3 text-xs text-[var(--muted-foreground)] line-clamp-2 leading-relaxed border-t border-[var(--border)] pt-3">
            {book.description}
          </p>
        )}

        {/* Publisher */}
        {book.publisher && (
          <p className="mt-2 text-[10px] text-[var(--muted-foreground)]/70 uppercase tracking-wide">
            {book.publisher}
          </p>
        )}
      </div>

      {/* Availability progress bar */}
      <div className="px-5 pb-4">
        <div className="h-1 w-full rounded-full bg-[var(--muted)] overflow-hidden">
          <div
            className={cn(
              "h-full rounded-full transition-all duration-500",
              avail.pct === 0 ? "bg-red-400" : avail.pct < 0.4 ? "bg-amber-400" : "bg-emerald-400"
            )}
            style={{ width: `${avail.pct * 100}%` }}
          />
        </div>
        <p className="text-[10px] text-[var(--muted-foreground)]/60 mt-1 text-right">
          {book.available_copies} of {book.total_copies} copies available
        </p>
      </div>
    </motion.div>
  );
}

// ─── Skeleton Card ───────────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl border border-[var(--border)] p-5 animate-pulse">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1">
          <div className="h-4 bg-[var(--muted)] rounded w-3/4 mb-2" />
          <div className="h-3 bg-[var(--muted)] rounded w-1/2" />
        </div>
        <div className="w-10 h-10 rounded-xl bg-[var(--muted)]" />
      </div>
      <div className="h-6 bg-[var(--muted)] rounded-full w-28 mb-4" />
      <div className="grid grid-cols-2 gap-2">
        <div className="h-3 bg-[var(--muted)] rounded" />
        <div className="h-3 bg-[var(--muted)] rounded" />
        <div className="h-3 bg-[var(--muted)] rounded" />
        <div className="h-3 bg-[var(--muted)] rounded" />
      </div>
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────────

export default function BookSearchPage() {
  const supabase = createClient();

  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [availabilityFilter, setAvailabilityFilter] = useState<AvailabilityFilter>("all");
  const [sortBy, setSortBy] = useState<SortOption>("title");
  const [books, setBooks] = useState<BookRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);

  // Debounce search query
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query), 350);
    return () => clearTimeout(t);
  }, [query]);

  const fetchBooks = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let q = supabase
        .from("books")
        .select("*", { count: "exact" });

      if (debouncedQuery.trim()) {
        q = q.or(
          `title.ilike.%${debouncedQuery}%,author.ilike.%${debouncedQuery}%,isbn.ilike.%${debouncedQuery}%`
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

      switch (sortBy) {
        case "author":
          q = q.order("author", { ascending: true });
          break;
        case "year":
          q = q.order("publication_year", { ascending: false, nullsFirst: false });
          break;
        case "availability":
          q = q.order("available_copies", { ascending: false });
          break;
        default:
          q = q.order("title", { ascending: true });
      }

      const { data, error: fetchError, count } = await q.limit(60);

      if (fetchError) throw fetchError;
      setBooks(data ?? []);
      setTotalCount(count ?? 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load books.");
    } finally {
      setLoading(false);
    }
  }, [debouncedQuery, selectedCategory, availabilityFilter, sortBy]);

  useEffect(() => {
    fetchBooks();
  }, [fetchBooks]);

  const clearFilters = () => {
    setQuery("");
    setSelectedCategory("All");
    setAvailabilityFilter("all");
    setSortBy("title");
  };

  const hasActiveFilters =
    debouncedQuery.trim() !== "" ||
    selectedCategory !== "All" ||
    availabilityFilter !== "all" ||
    sortBy !== "title";

  const availableCount = books.filter((b) => b.available_copies > 0).length;
  const unavailableCount = books.filter((b) => b.available_copies === 0).length;

  const SORT_OPTIONS: { value: SortOption; label: string }[] = [
    { value: "title", label: "Title (A-Z)" },
    { value: "author", label: "Author (A-Z)" },
    { value: "year", label: "Year (Newest)" },
    { value: "availability", label: "Availability" },
  ];

  const CATEGORIES = ["All", ...BOOK_CATEGORIES];

  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* ── Hero Search Header ─────────────────────────────────────────────── */}
      <div className="relative overflow-hidden bg-[var(--primary)]">
        {/* Background texture */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 50%, #c8a96e 0%, transparent 50%), radial-gradient(circle at 80% 20%, #4a90d9 0%, transparent 40%)",
          }}
        />
        <div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage:
              "repeating-linear-gradient(0deg, transparent, transparent 40px, rgba(255,255,255,0.3) 40px, rgba(255,255,255,0.3) 41px), repeating-linear-gradient(90deg, transparent, transparent 40px, rgba(255,255,255,0.3) 40px, rgba(255,255,255,0.3) 41px)",
          }}
        />

        <div className="relative container-lms py-16 md:py-20">
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="max-w-3xl mx-auto text-center"
          >
            {/* Badge */}
            <motion.div variants={fadeInUp} className="mb-5">
              <span className="inline-flex items-center gap-2 rounded-full border border-[var(--accent)]/40 bg-[var(--accent)]/10 px-4 py-1.5 text-xs font-semibold text-[var(--accent)] uppercase tracking-widest">
                <BookOpen className="w-3.5 h-3.5" />
                Library Catalog
              </span>
            </motion.div>

            {/* Headline */}
            <motion.h1
              variants={fadeInUp}
              className="text-3xl md:text-5xl font-bold text-white tracking-tight text-balance mb-3"
            >
              Search Our
              <span className="text-[var(--accent)]" style={{ fontStyle: "italic" }}> Collection</span>
            </motion.h1>
            <motion.p
              variants={fadeInUp}
              className="text-white/60 text-base md:text-lg mb-8 text-pretty"
            >
              Browse {totalCount > 0 ? totalCount.toLocaleString("en-US") : "thousands of"} books by title, author, or ISBN. Check real-time availability before visiting.
            </motion.p>

            {/* Search Input */}
            <motion.div variants={scaleIn} className="relative">
              <div className="relative flex items-center">
                <Search className="absolute left-4 w-5 h-5 text-white/40 pointer-events-none" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search by title, author, or ISBN..."
                  className="w-full pl-12 pr-12 py-4 rounded-2xl bg-white/10 border border-white/20 text-white placeholder-white/40 text-base focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/60 focus:border-[var(--accent)]/60 backdrop-blur-sm transition-all duration-200"
                />
                {query && (
                  <button
                    onClick={() => setQuery("")}
                    className="absolute right-4 w-6 h-6 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors"
                  >
                    <X className="w-3.5 h-3.5 text-white" />
                  </button>
                )}
              </div>

              {/* Quick stats below search */}
              <div className="flex items-center justify-center gap-6 mt-4 text-xs text-white/50">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  {availableCount} available
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-red-400" />
                  {unavailableCount} unavailable
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[var(--accent)]" />
                  {totalCount} total
                </span>
              </div>
            </motion.div>
          </motion.div>
        </div>

        {/* Wave divider */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
            <path d="M0 40L1440 40L1440 20C1200 0 960 40 720 20C480 0 240 40 0 20L0 40Z" fill="var(--background)" />
          </svg>
        </div>
      </div>

      {/* ── Filters Bar ───────────────────────────────────────────────────── */}
      <div className="container-lms pt-6 pb-2">
        <Reveal>
          <div className="flex flex-wrap items-center gap-3">
            {/* Category dropdown */}
            <div className="relative">
              <button
                onClick={() => { setCategoryOpen((o) => !o); setSortOpen(false); }}
                className={cn(
                  "flex items-center gap-2 rounded-xl border px-3.5 py-2 text-sm font-medium transition-all duration-200",
                  selectedCategory !== "All"
                    ? "bg-[var(--primary)] border-[var(--primary)] text-white"
                    : "bg-white border-[var(--border)] text-[var(--foreground)] hover:border-[var(--primary)]/40"
                )}
              >
                <Filter className="w-3.5 h-3.5" />
                {selectedCategory === "All" ? "Category" : selectedCategory}
                <ChevronDown className={cn("w-3.5 h-3.5 transition-transform", categoryOpen && "rotate-180")} />
              </button>
              <AnimatePresence>
                {categoryOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -8, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.97 }}
                    transition={{ duration: 0.18 }}
                    className="absolute top-full left-0 mt-1.5 z-30 bg-white border border-[var(--border)] rounded-xl shadow-[0_8px_32px_-8px_rgba(0,0,0,0.16)] py-1.5 min-w-[180px] max-h-64 overflow-y-auto"
                  >
                    {CATEGORIES.map((cat) => (
                      <button
                        key={cat}
                        onClick={() => { setSelectedCategory(cat); setCategoryOpen(false); }}
                        className={cn(
                          "w-full text-left px-3.5 py-2 text-sm transition-colors",
                          selectedCategory === cat
                            ? "bg-[var(--primary)]/8 text-[var(--primary)] font-medium"
                            : "text-[var(--foreground)] hover:bg-[var(--muted)]"
                        )}
                      >
                        {cat}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Availability filter pills */}
            <div className="flex items-center gap-1.5 bg-white border border-[var(--border)] rounded-xl p-1">
              {(["all", "available", "unavailable"] as AvailabilityFilter[]).map((f) => (
                <button
                  key={f}
                  onClick={() => setAvailabilityFilter(f)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all duration-200",
                    availabilityFilter === f
                      ? "bg-[var(--primary)] text-white shadow-sm"
                      : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                  )}
                >
                  {f === "all" ? "All" : f === "available" ? "Available" : "Unavailable"}
                </button>
              ))}
            </div>

            {/* Sort dropdown */}
            <div className="relative ml-auto">
              <button
                onClick={() => { setSortOpen((o) => !o); setCategoryOpen(false); }}
                className="flex items-center gap-2 rounded-xl border border-[var(--border)] bg-white px-3.5 py-2 text-sm font-medium text-[var(--foreground)] hover:border-[var(--primary)]/40 transition-all duration-200"
              >
                Sort: {SORT_OPTIONS.find((s) => s.value === sortBy)?.label}
                <ChevronDown className={cn("w-3.5 h-3.5 transition-transform", sortOpen && "rotate-180")} />
              </button>
              <AnimatePresence>
                {sortOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -8, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.97 }}
                    transition={{ duration: 0.18 }}
                    className="absolute top-full right-0 mt-1.5 z-30 bg-white border border-[var(--border)] rounded-xl shadow-[0_8px_32px_-8px_rgba(0,0,0,0.16)] py-1.5 min-w-[160px]"
                  >
                    {SORT_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => { setSortBy(opt.value); setSortOpen(false); }}
                        className={cn(
                          "w-full text-left px-3.5 py-2 text-sm transition-colors",
                          sortBy === opt.value
                            ? "bg-[var(--primary)]/8 text-[var(--primary)] font-medium"
                            : "text-[var(--foreground)] hover:bg-[var(--muted)]"
                        )}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Clear filters */}
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="flex items-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-100 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
                Clear
              </button>
            )}
          </div>
        </Reveal>

        {/* Results count */}
        <Reveal delay={0.05}>
          <div className="flex items-center justify-between mt-4 mb-1">
            <p className="text-sm text-[var(--muted-foreground)]">
              {loading ? (
                <span className="inline-flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full border-2 border-[var(--primary)] border-t-transparent animate-spin" />
                  Searching...
                </span>
              ) : (
                <>
                  <span className="font-semibold text-[var(--foreground)]">{books.length}</span>
                  {" "}result{books.length !== 1 ? "s" : ""}
                  {debouncedQuery && (
                    <> for <span className="font-medium text-[var(--primary)]">&ldquo;{debouncedQuery}&rdquo;</span></>
                  )}
                </>
              )}
            </p>
          </div>
        </Reveal>
      </div>

      {/* ── Results Grid ──────────────────────────────────────────────────── */}
      <div className="container-lms pb-16 pt-4">
        {/* Error state */}
        {error && (
          <Reveal>
            <div className="flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 mb-6">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-red-700">Failed to load books</p>
                <p className="text-xs text-red-500 mt-0.5">{error}</p>
              </div>
              <button
                onClick={fetchBooks}
                className="ml-auto text-xs font-medium text-red-600 hover:text-red-800 underline"
              >
                Retry
              </button>
            </div>
          </Reveal>
        )}

        {/* Loading skeletons */}
        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {Array.from({ length: 8 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && books.length === 0 && (
          <Reveal>
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="w-20 h-20 rounded-2xl bg-[var(--primary)]/8 flex items-center justify-center mb-5">
                <BookOpen className="w-10 h-10 text-[var(--primary)]/40" />
              </div>
              <h3 className="text-lg font-semibold text-[var(--foreground)] mb-2">
                No books found
              </h3>
              <p className="text-sm text-[var(--muted-foreground)] max-w-sm mb-5">
                {debouncedQuery
                  ? `No results for "${debouncedQuery}". Try a different search term or adjust your filters.`
                  : "No books match the selected filters. Try adjusting your criteria."}
              </p>
              <button
                onClick={clearFilters}
                className="rounded-xl bg-[var(--primary)] px-5 py-2.5 text-sm font-medium text-white hover:bg-[var(--primary-hover)] transition-colors"
              >
                Clear all filters
              </button>
            </div>
          </Reveal>
        )}

        {/* Book grid */}
        {!loading && !error && books.length > 0 && (
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5"
          >
            {books.map((book) => (
              <BookCard key={book.id} book={book} query={debouncedQuery} />
            ))}
          </motion.div>
        )}

        {/* Limit notice */}
        {!loading && books.length === 60 && (
          <Reveal>
            <div className="mt-8 text-center">
              <p className="text-sm text-[var(--muted-foreground)]">
                Showing first 60 results. Refine your search to find specific books.
              </p>
            </div>
          </Reveal>
        )}
      </div>
    </div>
  );
}
