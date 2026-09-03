"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Search, BookOpen, Filter, X, ChevronDown, Star, MapPin, Copy, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { Reveal } from "@/components/Reveal";
import { staggerContainer, fadeInUp } from "@/lib/motion";
import { createClient } from "@/lib/supabase/client";
import { BOOK_CATEGORIES } from "@/lib/data";
import type from "@/lib/data";
type Book = any;
const Book: any = [];

const AVAILABILITY_OPTIONS = ["All", "Available", "Unavailable"] as const;
type AvailabilityFilter = (typeof AVAILABILITY_OPTIONS)[number];

function AvailabilityBadge({ available, total }: { available: number; total: number }) {
  const isAvailable = available > 0;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${
        isAvailable
          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
          : "bg-red-50 text-red-700 border border-red-200"
      }`}
    >
      {isAvailable ? (
        <CheckCircle className="h-3 w-3" />
      ) : (
        <AlertCircle className="h-3 w-3" />
      )}
      {isAvailable ? `${available} of ${total} available` : "Unavailable"}
    </span>
  );
}

function BookCard({ book }: { book: Book }) {
  const categoryColors: Record<string, string> = {
    Fiction: "bg-purple-50 text-purple-700 border-purple-200",
    "Non-Fiction": "bg-blue-50 text-blue-700 border-blue-200",
    Science: "bg-cyan-50 text-cyan-700 border-cyan-200",
    Technology: "bg-indigo-50 text-indigo-700 border-indigo-200",
    History: "bg-amber-50 text-amber-700 border-amber-200",
    Mathematics: "bg-green-50 text-green-700 border-green-200",
    Literature: "bg-rose-50 text-rose-700 border-rose-200",
    Business: "bg-orange-50 text-orange-700 border-orange-200",
    Philosophy: "bg-violet-50 text-violet-700 border-violet-200",
    Religion: "bg-yellow-50 text-yellow-700 border-yellow-200",
    Arts: "bg-pink-50 text-pink-700 border-pink-200",
    Law: "bg-slate-50 text-slate-700 border-slate-200",
    Medicine: "bg-teal-50 text-teal-700 border-teal-200",
    Economics: "bg-lime-50 text-lime-700 border-lime-200",
    Other: "bg-gray-50 text-gray-700 border-gray-200",
  };

  const catClass =
    book.category && categoryColors[book.category]
      ? categoryColors[book.category]
      : "bg-gray-50 text-gray-700 border-gray-200";

  return (
    <motion.div
      whileHover={{ y: -3, boxShadow: "0 8px 32px -8px rgba(30,58,95,0.18)" }}
      transition={{ duration: 0.22, ease: "easeOut" }}
      className="group flex flex-col rounded-2xl border border-[var(--border-color)] bg-white shadow-[0_1px_4px_rgba(30,58,95,0.06)] overflow-hidden"
    >
      {/* Color band by category */}
      <div className="h-1.5 w-full bg-[var(--brand-primary)]" />

      <div className="flex flex-col flex-1 p-5 gap-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-[var(--brand-primary)] text-base leading-snug line-clamp-2 group-hover:text-[var(--brand-gold)] transition-colors duration-200">
              {book.title}
            </h3>
            <p className="mt-0.5 text-sm text-[var(--text-muted)] line-clamp-1">{book.author}</p>
          </div>
          <BookOpen className="h-5 w-5 text-[var(--brand-gold)] shrink-0 mt-0.5" />
        </div>

        {/* Category + Availability */}
        <div className="flex flex-wrap gap-2 items-center">
          {book.category && (
            <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${catClass}`}>
              {book.category}
            </span>
          )}
          <AvailabilityBadge available={book.available_copies} total={book.total_copies} />
        </div>

        {/* Meta info */}
        <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs text-[var(--text-muted)]">
          {book.isbn && (
            <div className="flex items-center gap-1 col-span-2">
              <Copy className="h-3 w-3 shrink-0" />
              <span className="truncate">ISBN: {book.isbn}</span>
            </div>
          )}
          {book.publisher && (
            <div className="flex items-center gap-1 col-span-2">
              <Star className="h-3 w-3 shrink-0" />
              <span className="truncate">{book.publisher}{book.publication_year ? `, ${book.publication_year}` : ""}</span>
            </div>
          )}
          {book.shelf_location && (
            <div className="flex items-center gap-1 col-span-2">
              <MapPin className="h-3 w-3 shrink-0" />
              <span className="truncate">Shelf: {book.shelf_location}</span>
            </div>
          )}
        </div>

        {/* Description */}
        {book.description && (
          <p className="text-xs text-[var(--text-muted)] leading-relaxed line-clamp-2 border-t border-[var(--border-color)] pt-2">
            {book.description}
          </p>
        )}

        {/* Copies bar */}
        <div className="mt-auto pt-2">
          <div className="flex items-center justify-between text-xs text-[var(--text-muted)] mb-1">
            <span>Copies</span>
            <span className="font-medium text-[var(--brand-primary)]">
              {book.available_copies}/{book.total_copies}
            </span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-gray-100 overflow-hidden">
            <div
              className="h-full rounded-full bg-[var(--brand-primary)] transition-all duration-500"
              style={{
                width: book.total_copies > 0
                  ? `${Math.round((book.available_copies / book.total_copies) * 100)}%`
                  : "0%",
              }}
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default function BookSearchPage() {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [availability, setAvailability] = useState<AvailabilityFilter>("All");
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [totalCount, setTotalCount] = useState(0);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 350);
    return () => clearTimeout(timer);
  }, [query]);

  const fetchBooks = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const supabase = createClient();
      let queryBuilder = supabase.from("books").select("*", { count: "exact" });

      if (debouncedQuery.trim()) {
        queryBuilder = queryBuilder.or(
          `title.ilike.%${debouncedQuery.trim()}%,author.ilike.%${debouncedQuery.trim()}%,isbn.ilike.%${debouncedQuery.trim()}%,publisher.ilike.%${debouncedQuery.trim()}%`
        );
      }

      if (selectedCategory !== "All") {
        queryBuilder = queryBuilder.eq("category", selectedCategory);
      }

      if (availability === "Available") {
        queryBuilder = queryBuilder.gt("available_copies", 0);
      } else if (availability === "Unavailable") {
        queryBuilder = queryBuilder.eq("available_copies", 0);
      }

      queryBuilder = queryBuilder.order("title", { ascending: true });

      const { data, error: fetchError, count } = await queryBuilder;

      if (fetchError) throw fetchError;

      setBooks((data as Book[]) ?? []);
      setTotalCount(count ?? 0);
    } catch (err) {
      console.error("Failed to fetch books:", err);
      setError("Failed to load books. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [debouncedQuery, selectedCategory, availability]);

  useEffect(() => {
    fetchBooks();
  }, [fetchBooks]);

  const clearFilters = () => {
    setQuery("");
    setSelectedCategory("All");
    setAvailability("All");
  };

  const hasActiveFilters =
    query.trim() !== "" || selectedCategory !== "All" || availability !== "All";

  const categories = ["All", ...BOOK_CATEGORIES];

  return (
    <div className="min-h-screen bg-[var(--page-bg)]">
      {/* Page Header */}
      <Reveal>
        <div className="bg-[var(--brand-primary)] text-white">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 md:py-14">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <BookOpen className="h-6 w-6 text-[var(--brand-gold)]" />
                  <span className="text-sm font-medium text-white/70 uppercase tracking-widest">
                    NCBA&amp;E Library
                  </span>
                </div>
                <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-white">
                  Book Search
                </h1>
                <p className="mt-2 text-white/70 text-base max-w-xl">
                  Search the complete library catalog. Check availability, shelf location, and copy counts in real time.
                </p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <div className="rounded-xl bg-white/10 border border-white/20 px-4 py-2 text-center">
                  <div className="text-2xl font-bold text-[var(--brand-gold)]">{totalCount}</div>
                  <div className="text-xs text-white/60 mt-0.5">Books Found</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Reveal>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Search Bar */}
        <Reveal>
          <div className="relative mb-4">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[var(--text-muted)]" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by title, author, ISBN, or publisher..."
              className="w-full rounded-xl border border-[var(--border-color)] bg-white pl-12 pr-12 py-3.5 text-sm text-[var(--brand-primary)] placeholder:text-[var(--text-muted)] shadow-[0_1px_4px_rgba(30,58,95,0.07)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]/30 focus:border-[var(--brand-primary)] transition-all duration-200"
            />
            {query && (
              <button
                onClick={() => setQuery("")}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--brand-primary)] transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </Reveal>

        {/* Filter Bar */}
        <Reveal delay={0.05}>
          <div className="flex flex-wrap items-center gap-3 mb-6">
            <button
              onClick={() => setShowFilters((v) => !v)}
              className={`inline-flex items-center gap-2 rounded-lg border px-3.5 py-2 text-sm font-medium transition-all duration-200 ${
                showFilters
                  ? "bg-[var(--brand-primary)] text-white border-[var(--brand-primary)]"
                  : "bg-white text-[var(--brand-primary)] border-[var(--border-color)] hover:border-[var(--brand-primary)]"
              }`}
            >
              <Filter className="h-4 w-4" />
              Filters
              <ChevronDown
                className={`h-3.5 w-3.5 transition-transform duration-200 ${showFilters ? "rotate-180" : ""}`}
              />
            </button>

            {/* Quick availability pills */}
            {AVAILABILITY_OPTIONS.map((opt) => (
              <button
                key={opt}
                onClick={() => setAvailability(opt)}
                className={`rounded-full border px-3.5 py-1.5 text-xs font-medium transition-all duration-200 ${
                  availability === opt
                    ? "bg-[var(--brand-primary)] text-white border-[var(--brand-primary)]"
                    : "bg-white text-[var(--text-muted)] border-[var(--border-color)] hover:border-[var(--brand-primary)] hover:text-[var(--brand-primary)]"
                }`}
              >
                {opt}
              </button>
            ))}

            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="inline-flex items-center gap-1.5 rounded-full border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-100 transition-colors"
              >
                <X className="h-3 w-3" />
                Clear all
              </button>
            )}
          </div>

          {/* Expanded filters */}
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="mb-6 rounded-xl border border-[var(--border-color)] bg-white p-5 shadow-[0_1px_4px_rgba(30,58,95,0.06)]"
            >
              <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-3">
                Filter by Category
              </p>
              <div className="flex flex-wrap gap-2">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`rounded-full border px-3 py-1 text-xs font-medium transition-all duration-200 ${
                      selectedCategory === cat
                        ? "bg-[var(--brand-primary)] text-white border-[var(--brand-primary)]"
                        : "bg-[var(--page-bg)] text-[var(--text-muted)] border-[var(--border-color)] hover:border-[var(--brand-primary)] hover:text-[var(--brand-primary)]"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </Reveal>

        {/* Results */}
        {loading ? (
          <Reveal>
            <div className="flex flex-col items-center justify-center py-24 gap-4">
              <Loader2 className="h-10 w-10 animate-spin text-[var(--brand-primary)]" />
              <p className="text-sm text-[var(--text-muted)]">Searching catalog...</p>
            </div>
          </Reveal>
        ) : error ? (
          <Reveal>
            <div className="flex flex-col items-center justify-center py-24 gap-4">
              <AlertCircle className="h-10 w-10 text-red-400" />
              <p className="text-sm text-red-600">{error}</p>
              <button
                onClick={fetchBooks}
                className="rounded-lg bg-[var(--brand-primary)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--brand-primary)]/90 transition-colors"
              >
                Retry
              </button>
            </div>
          </Reveal>
        ) : books.length === 0 ? (
          <Reveal>
            <div className="flex flex-col items-center justify-center py-24 gap-4">
              <BookOpen className="h-12 w-12 text-[var(--text-muted)]/40" />
              <div className="text-center">
                <p className="font-semibold text-[var(--brand-primary)]">No books found</p>
                <p className="text-sm text-[var(--text-muted)] mt-1">
                  Try adjusting your search or filters.
                </p>
              </div>
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="rounded-lg border border-[var(--border-color)] bg-white px-4 py-2 text-sm font-medium text-[var(--brand-primary)] hover:bg-[var(--page-bg)] transition-colors"
                >
                  Clear filters
                </button>
              )}
            </div>
          </Reveal>
        ) : (
          <>
            <Reveal>
              <p className="text-sm text-[var(--text-muted)] mb-5">
                Showing{" "}
                <span className="font-semibold text-[var(--brand-primary)]">{books.length}</span>
                {totalCount !== books.length && (
                  <> of <span className="font-semibold text-[var(--brand-primary)]">{totalCount}</span></>
                )}{" "}
                {totalCount === 1 ? "book" : "books"}
                {hasActiveFilters && " matching your search"}
              </p>
            </Reveal>

            <motion.div
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5"
            >
              {books.map((book, i) => (
                <motion.div key={book.id} variants={fadeInUp}>
                  <BookCard book={book} />
                </motion.div>
              ))}
            </motion.div>
          </>
        )}
      </div>
    </div>
  );
}