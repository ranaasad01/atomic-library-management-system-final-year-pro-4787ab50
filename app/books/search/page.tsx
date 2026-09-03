"use client";

import { useState, useEffect, useMemo, useCallback, Fragment } from "react";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import { Search, Filter, X, ChevronLeft, ChevronRight, BookOpen, User, Calendar, MapPin, Hash, Building, Info, CheckCircle, AlertCircle, SlidersHorizontal, ChevronDown } from 'lucide-react';
import { Reveal } from "@/components/Reveal";
import { fadeInUp, staggerContainer, scaleIn } from "@/lib/motion";
import { createClient } from "@/lib/supabase/client";
import type from "@/lib/data";
type Book = any;
const Book: any = [];

// ─── Constants ────────────────────────────────────────────────────────────────

const BOOKS_PER_PAGE = 12;

const BOOK_CATEGORIES = [
  "Computer Science",
  "Mathematics",
  "Physics",
  "Chemistry",
  "Biology",
  "Economics",
  "Business Administration",
  "Accounting",
  "Finance",
  "Management",
  "Literature",
  "History",
  "Psychology",
  "Sociology",
  "Engineering",
  "Law",
  "Islamic Studies",
  "Urdu",
  "English",
  "General",
];

const YEAR_MIN = 1980;
const YEAR_MAX = 2024;

// ─── Types ────────────────────────────────────────────────────────────────────

interface Filters {
  categories: string[];
  availableOnly: boolean;
  authorQuery: string;
  yearFrom: number;
  yearTo: number;
}

// ─── Slide-over Detail Panel ──────────────────────────────────────────────────

const slideOver: Variants = {
  hidden: { opacity: 0, x: "100%" },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.35, ease: "easeOut" },
  },
  exit: {
    opacity: 0,
    x: "100%",
    transition: { duration: 0.25, ease: "easeIn" },
  },
};

const backdrop: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.25 } },
  exit: { opacity: 0, transition: { duration: 0.2 } },
};

function AvailabilityPill({ available, total }: { available: number; total: number }) {
  const isAvailable = available > 0;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
        isAvailable
          ? "bg-emerald-100 text-emerald-700"
          : "bg-red-100 text-red-700"
      }`}
    >
      {isAvailable ? (
        <CheckCircle className="h-3 w-3" />
      ) : (
        <AlertCircle className="h-3 w-3" />
      )}
      {isAvailable ? `${available} Available` : "Issued Out"}
    </span>
  );
}

function CategoryBadge({ category }: { category: string | null }) {
  if (!category) return null;
  return (
    <span className="inline-block rounded-md bg-[var(--brand-navy)]/10 px-2 py-0.5 text-xs font-medium text-[var(--brand-navy)]">
      {category}
    </span>
  );
}

function BookCoverPlaceholder({ title, author }: { title: string; author: string }) {
  const initials = title
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
  const hues = [
    "from-[var(--brand-navy)] to-[var(--brand-navy)]/70",
    "from-[var(--brand-gold)] to-[var(--brand-gold)]/70",
    "from-slate-600 to-slate-800",
    "from-teal-600 to-teal-800",
    "from-indigo-600 to-indigo-800",
  ];
  const idx = (title.charCodeAt(0) + author.charCodeAt(0)) % hues.length;
  return (
    <div
      className={`flex h-full w-full flex-col items-center justify-center bg-gradient-to-br ${hues[idx]} rounded-t-xl`}
    >
      <span className="text-3xl font-bold text-white/90">{initials}</span>
      <BookOpen className="mt-2 h-6 w-6 text-white/50" />
    </div>
  );
}

function BookCard({ book, onClick }: { book: Book; onClick: () => void }) {
  return (
    <motion.div
      whileHover={{ y: -4, boxShadow: "0 12px 32px -8px rgba(30,58,95,0.18)" }}
      transition={{ duration: 0.22, ease: "easeOut" }}
      onClick={onClick}
      className="group flex cursor-pointer flex-col overflow-hidden rounded-xl border border-black/8 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.06),0_4px_16px_-4px_rgba(0,0,0,0.08)] transition-all duration-300"
    >
      {/* Cover */}
      <div className="relative h-44 w-full overflow-hidden bg-[var(--brand-cream)]">
        <BookCoverPlaceholder title={book.title} author={book.author} />
        <div className="absolute right-2 top-2">
          <AvailabilityPill available={book.available_copies} total={book.total_copies} />
        </div>
      </div>

      {/* Info */}
      <div className="flex flex-1 flex-col gap-2 p-4">
        <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-[var(--brand-navy)] group-hover:text-[var(--brand-gold)] transition-colors duration-200">
          {book.title}
        </h3>
        <p className="flex items-center gap-1 text-xs text-slate-500">
          <User className="h-3 w-3 shrink-0" />
          <span className="line-clamp-1">{book.author}</span>
        </p>
        {book.publication_year && (
          <p className="flex items-center gap-1 text-xs text-slate-400">
            <Calendar className="h-3 w-3 shrink-0" />
            {book.publication_year}
          </p>
        )}
        <div className="mt-auto pt-2">
          <CategoryBadge category={book.category ?? null} />
        </div>
      </div>
    </motion.div>
  );
}

function DetailPanel({ book, onClose }: { book: Book; onClose: () => void }) {
  return (
    <AnimatePresence>
      <motion.div
        key="backdrop"
        variants={backdrop}
        initial="hidden"
        animate="visible"
        exit="exit"
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.aside
        key="panel"
        variants={slideOver}
        initial="hidden"
        animate="visible"
        exit="exit"
        className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col overflow-y-auto bg-white shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-black/8 bg-[var(--brand-navy)] px-6 py-4">
          <h2 className="text-base font-semibold text-white">Book Details</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-white/70 hover:bg-white/10 hover:text-white transition-colors"
            aria-label="Close panel"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Cover */}
        <div className="relative h-52 w-full shrink-0 bg-[var(--brand-cream)]">
          <BookCoverPlaceholder title={book.title} author={book.author} />
          <div className="absolute bottom-3 right-3">
            <AvailabilityPill available={book.available_copies} total={book.total_copies} />
          </div>
        </div>

        {/* Content */}
        <div className="flex flex-1 flex-col gap-6 p-6">
          <div>
            <h3 className="text-xl font-bold leading-snug text-[var(--brand-navy)]">{book.title}</h3>
            <p className="mt-1 text-sm text-slate-500">{book.author}</p>
            {book.category && (
              <div className="mt-3">
                <CategoryBadge category={book.category} />
              </div>
            )}
          </div>

          {/* Meta grid */}
          <div className="grid grid-cols-2 gap-4">
            {book.isbn && (
              <MetaItem icon={<Hash className="h-4 w-4" />} label="ISBN" value={book.isbn} />
            )}
            {book.publisher && (
              <MetaItem icon={<Building className="h-4 w-4" />} label="Publisher" value={book.publisher} />
            )}
            {book.publication_year && (
              <MetaItem icon={<Calendar className="h-4 w-4" />} label="Year" value={String(book.publication_year)} />
            )}
            {book.shelf_location && (
              <MetaItem icon={<MapPin className="h-4 w-4" />} label="Shelf" value={book.shelf_location} />
            )}
            <MetaItem
              icon={<BookOpen className="h-4 w-4" />}
              label="Total Copies"
              value={String(book.total_copies)}
            />
            <MetaItem
              icon={<CheckCircle className="h-4 w-4" />}
              label="Available"
              value={String(book.available_copies)}
            />
          </div>

          {/* Description */}
          {book.description && (
            <div className="rounded-lg bg-[var(--brand-cream)] p-4">
              <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-[var(--brand-navy)]/60">
                <Info className="h-3.5 w-3.5" />
                Description
              </div>
              <p className="text-sm leading-relaxed text-slate-600">{book.description}</p>
            </div>
          )}

          {/* Copies bar */}
          <div>
            <div className="mb-1.5 flex items-center justify-between text-xs text-slate-500">
              <span>Availability</span>
              <span>
                {book.available_copies} / {book.total_copies} copies
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-[var(--brand-gold)] transition-all duration-500"
                style={{
                  width: `${book.total_copies > 0 ? (book.available_copies / book.total_copies) * 100 : 0}%`,
                }}
              />
            </div>
          </div>

          {/* Issue button */}
          <div className="mt-auto pt-2">
            <button
              disabled={book.available_copies === 0}
              className="w-full rounded-lg bg-[var(--brand-navy)] px-4 py-3 text-sm font-semibold text-white shadow-md transition-all duration-200 hover:bg-[var(--brand-navy)]/90 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50"
            >
              {book.available_copies > 0 ? "Issue This Book" : "Not Available"}
            </button>
            <p className="mt-2 text-center text-xs text-slate-400">
              Visit the Issue &amp; Return desk to complete the transaction.
            </p>
          </div>
        </div>
      </motion.aside>
    </AnimatePresence>
  );
}

function MetaItem({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1 rounded-lg border border-black/6 bg-slate-50 p-3">
      <div className="flex items-center gap-1.5 text-xs font-medium text-slate-400">
        {icon}
        {label}
      </div>
      <p className="text-sm font-semibold text-[var(--brand-navy)]">{value}</p>
    </div>
  );
}

// ─── Filter Panel ─────────────────────────────────────────────────────────────

function FilterPanel({
  filters,
  onChange,
  allAuthors,
}: {
  filters: Filters;
  onChange: (f: Filters) => void;
  allAuthors: string[];
}) {
  const [catExpanded, setCatExpanded] = useState(true);
  const [authorExpanded, setAuthorExpanded] = useState(false);

  function toggleCategory(cat: string) {
    const next = filters.categories.includes(cat)
      ? filters.categories.filter((c) => c !== cat)
      : [...filters.categories, cat];
    onChange({ ...filters, categories: next });
  }

  return (
    <aside className="flex flex-col gap-5 rounded-xl border border-black/8 bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold uppercase tracking-wide text-[var(--brand-navy)]">Filters</h2>
        <button
          onClick={() =>
            onChange({
              categories: [],
              availableOnly: false,
              authorQuery: "",
              yearFrom: YEAR_MIN,
              yearTo: YEAR_MAX,
            })
          }
          className="text-xs text-[var(--brand-gold)] hover:underline"
        >
          Clear all
        </button>
      </div>

      {/* Availability */}
      <div>
        <label className="flex cursor-pointer items-center gap-3">
          <div
            onClick={() => onChange({ ...filters, availableOnly: !filters.availableOnly })}
            className={`relative h-5 w-9 rounded-full transition-colors duration-200 ${
              filters.availableOnly ? "bg-[var(--brand-navy)]" : "bg-slate-200"
            }`}
          >
            <span
              className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform duration-200 ${
                filters.availableOnly ? "translate-x-4" : "translate-x-0.5"
              }`}
            />
          </div>
          <span className="text-sm font-medium text-slate-700">Available only</span>
        </label>
      </div>

      {/* Category */}
      <div>
        <button
          onClick={() => setCatExpanded((v) => !v)}
          className="flex w-full items-center justify-between text-sm font-semibold text-slate-700"
        >
          Category
          <ChevronDown
            className={`h-4 w-4 text-slate-400 transition-transform duration-200 ${catExpanded ? "rotate-180" : ""}`}
          />
        </button>
        {catExpanded && (
          <div className="mt-3 flex max-h-52 flex-col gap-1.5 overflow-y-auto pr-1">
            {BOOK_CATEGORIES.map((cat) => (
              <label key={cat} className="flex cursor-pointer items-center gap-2.5">
                <input
                  type="checkbox"
                  checked={filters.categories.includes(cat)}
                  onChange={() => toggleCategory(cat)}
                  className="h-3.5 w-3.5 rounded border-slate-300 accent-[var(--brand-navy)]"
                />
                <span className="text-xs text-slate-600">{cat}</span>
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Author */}
      <div>
        <button
          onClick={() => setAuthorExpanded((v) => !v)}
          className="flex w-full items-center justify-between text-sm font-semibold text-slate-700"
        >
          Author
          <ChevronDown
            className={`h-4 w-4 text-slate-400 transition-transform duration-200 ${authorExpanded ? "rotate-180" : ""}`}
          />
        </button>
        {authorExpanded && (
          <div className="mt-3">
            <input
              type="text"
              value={filters.authorQuery}
              onChange={(e) => onChange({ ...filters, authorQuery: e.target.value })}
              placeholder="Search author..."
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700 placeholder-slate-400 focus:border-[var(--brand-navy)] focus:outline-none focus:ring-1 focus:ring-[var(--brand-navy)]/30"
            />
            {filters.authorQuery && (
              <div className="mt-2 flex max-h-36 flex-col gap-1 overflow-y-auto">
                {allAuthors
                  .filter((a) => a.toLowerCase().includes(filters.authorQuery.toLowerCase()))
                  .slice(0, 10)
                  .map((a) => (
                    <button
                      key={a}
                      onClick={() => onChange({ ...filters, authorQuery: a })}
                      className="rounded px-2 py-1 text-left text-xs text-slate-600 hover:bg-slate-100"
                    >
                      {a}
                    </button>
                  ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Year range */}
      <div>
        <p className="mb-3 text-sm font-semibold text-slate-700">Publication Year</p>
        <div className="flex items-center gap-2">
          <input
            type="number"
            min={YEAR_MIN}
            max={filters.yearTo}
            value={filters.yearFrom}
            onChange={(e) => onChange({ ...filters, yearFrom: Number(e.target.value) })}
            className="w-full rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5 text-xs text-slate-700 focus:border-[var(--brand-navy)] focus:outline-none"
          />
          <span className="text-xs text-slate-400">to</span>
          <input
            type="number"
            min={filters.yearFrom}
            max={YEAR_MAX}
            value={filters.yearTo}
            onChange={(e) => onChange({ ...filters, yearTo: Number(e.target.value) })}
            className="w-full rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5 text-xs text-slate-700 focus:border-[var(--brand-navy)] focus:outline-none"
          />
        </div>
      </div>
    </aside>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function BookCardSkeleton() {
  return (
    <div className="animate-pulse overflow-hidden rounded-xl border border-black/6 bg-white">
      <div className="h-44 bg-slate-100" />
      <div className="p-4 space-y-2">
        <div className="h-4 w-3/4 rounded bg-slate-100" />
        <div className="h-3 w-1/2 rounded bg-slate-100" />
        <div className="h-3 w-1/4 rounded bg-slate-100" />
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function BookSearchPage() {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<Filters>({
    categories: [],
    availableOnly: false,
    authorQuery: "",
    yearFrom: YEAR_MIN,
    yearTo: YEAR_MAX,
  });
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  // Fetch books from Supabase
  useEffect(() => {
    async function fetchBooks() {
      setLoading(true);
      const supabase = createClient();
      const { data, error } = await supabase
        .from("books")
        .select("*")
        .order("title", { ascending: true });
      if (!error && data) {
        setBooks(data as Book[]);
      }
      setLoading(false);
    }
    fetchBooks();
  }, []);

  // Derived: all unique authors
  const allAuthors = useMemo(
    () => [...new Set(books.map((b) => b.author))].sort(),
    [books]
  );

  // Filtered books
  const filtered = useMemo(() => {
    return books.filter((book) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        !q ||
        book.title.toLowerCase().includes(q) ||
        book.author.toLowerCase().includes(q) ||
        (book.isbn ?? "").toLowerCase().includes(q) ||
        (book.category ?? "").toLowerCase().includes(q);

      const matchesCategory =
        filters.categories.length === 0 ||
        filters.categories.includes(book.category ?? "");

      const matchesAvailability = !filters.availableOnly || book.available_copies > 0;

      const matchesAuthor =
        !filters.authorQuery ||
        book.author.toLowerCase().includes(filters.authorQuery.toLowerCase());

      const year = book.publication_year ?? 0;
      const matchesYear =
        year === 0 || (year >= filters.yearFrom && year <= filters.yearTo);

      return (
        matchesSearch &&
        matchesCategory &&
        matchesAvailability &&
        matchesAuthor &&
        matchesYear
      );
    });
  }, [books, searchQuery, filters]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filtered.length / BOOKS_PER_PAGE));
  const paginated = useMemo(() => {
    const start = (currentPage - 1) * BOOKS_PER_PAGE;
    return filtered.slice(start, start + BOOKS_PER_PAGE);
  }, [filtered, currentPage]);

  // Reset page on filter/search change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filters]);

  const handleFilterChange = useCallback((f: Filters) => {
    setFilters(f);
  }, []);

  const activeFilterCount =
    filters.categories.length +
    (filters.availableOnly ? 1 : 0) +
    (filters.authorQuery ? 1 : 0) +
    (filters.yearFrom !== YEAR_MIN || filters.yearTo !== YEAR_MAX ? 1 : 0);

  return (
    <>
      {/* CSS variables */}
      <style>{`
        :root {
          --brand-navy: #1e3a5f;
          --brand-cream: #f5f0e8;
          --brand-gold: #c8a96e;
          --brand-red: #e74c3c;
        }
      `}</style>

      <div className="min-h-screen bg-[var(--brand-cream)]">
        {/* ── Page Header ── */}
        <Reveal>
          <div className="border-b border-black/8 bg-[var(--brand-navy)] px-4 py-10 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-7xl">
              <div className="flex items-center gap-3 mb-3">
                <BookOpen className="h-7 w-7 text-[var(--brand-gold)]" />
                <span className="text-xs font-semibold uppercase tracking-widest text-[var(--brand-gold)]">
                  NCBA&amp;E Library
                </span>
              </div>
              <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
                Book Search
              </h1>
              <p className="mt-2 text-sm text-white/60">
                Browse and search the complete library catalog. Filter by category, author, or availability.
              </p>

              {/* Search bar */}
              <div className="mt-6 relative max-w-2xl">
                <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by title, author, ISBN, or category..."
                  className="w-full rounded-xl border border-white/10 bg-white/10 py-3.5 pl-12 pr-4 text-sm text-white placeholder-white/40 backdrop-blur-sm focus:border-[var(--brand-gold)] focus:bg-white/15 focus:outline-none focus:ring-2 focus:ring-[var(--brand-gold)]/30 transition-all duration-200"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-white/50 hover:text-white transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </Reveal>

        {/* ── Body ── */}
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          {/* Mobile filter toggle */}
          <div className="mb-4 flex items-center justify-between lg:hidden">
            <p className="text-sm text-slate-500">
              {loading ? "Loading..." : `${filtered.length} book${filtered.length !== 1 ? "s" : ""} found`}
            </p>
            <button
              onClick={() => setMobileFilterOpen((v) => !v)}
              className="flex items-center gap-2 rounded-lg border border-black/10 bg-white px-3 py-2 text-sm font-medium text-[var(--brand-navy)] shadow-sm"
            >
              <SlidersHorizontal className="h-4 w-4" />
              Filters
              {activeFilterCount > 0 && (
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[var(--brand-navy)] text-xs text-white">
                  {activeFilterCount}
                </span>
              )}
            </button>
          </div>

          {/* Mobile filter drawer */}
          <AnimatePresence>
            {mobileFilterOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="mb-6 overflow-hidden lg:hidden"
              >
                <FilterPanel
                  filters={filters}
                  onChange={handleFilterChange}
                  allAuthors={allAuthors}
                />
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex gap-6">
            {/* ── Left Filter Panel (desktop) ── */}
            <div className="hidden w-64 shrink-0 lg:block">
              <div className="sticky top-6">
                <FilterPanel
                  filters={filters}
                  onChange={handleFilterChange}
                  allAuthors={allAuthors}
                />
              </div>
            </div>

            {/* ── Book Grid ── */}
            <div className="flex-1 min-w-0">
              {/* Result count */}
              <div className="mb-5 hidden items-center justify-between lg:flex">
                <p className="text-sm text-slate-500">
                  {loading
                    ? "Loading catalog..."
                    : `${filtered.length} book${filtered.length !== 1 ? "s" : ""} found`}
                </p>
                {activeFilterCount > 0 && (
                  <button
                    onClick={() =>
                      setFilters({
                        categories: [],
                        availableOnly: false,
                        authorQuery: "",
                        yearFrom: YEAR_MIN,
                        yearTo: YEAR_MAX,
                      })
                    }
                    className="flex items-center gap-1.5 text-xs text-[var(--brand-red)] hover:underline"
                  >
                    <X className="h-3.5 w-3.5" />
                    Clear {activeFilterCount} filter{activeFilterCount !== 1 ? "s" : ""}
                  </button>
                )}
              </div>

              {/* Grid */}
              {loading ? (
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
                  {Array.from({ length: 9 }).map((_, i) => (
                    <BookCardSkeleton key={i} />
                  ))}
                </div>
              ) : paginated.length === 0 ? (
                <Reveal>
                  <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white py-20 text-center">
                    <BookOpen className="h-12 w-12 text-slate-300" />
                    <h3 className="mt-4 text-base font-semibold text-slate-600">No books found</h3>
                    <p className="mt-1 text-sm text-slate-400">
                      Try adjusting your search or filters.
                    </p>
                    <button
                      onClick={() => {
                        setSearchQuery("");
                        setFilters({
                          categories: [],
                          availableOnly: false,
                          authorQuery: "",
                          yearFrom: YEAR_MIN,
                          yearTo: YEAR_MAX,
                        });
                      }}
                      className="mt-4 rounded-lg bg-[var(--brand-navy)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--brand-navy)]/90 transition-colors"
                    >
                      Reset all filters
                    </button>
                  </div>
                </Reveal>
              ) : (
                <motion.div
                  variants={staggerContainer}
                  initial="hidden"
                  animate="visible"
                  className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3"
                >
                  {paginated.map((book, i) => (
                    <motion.div key={book.id} variants={fadeInUp}>
                      <BookCard book={book} onClick={() => setSelectedBook(book)} />
                    </motion.div>
                  ))}
                </motion.div>
              )}

              {/* Pagination */}
              {!loading && totalPages > 1 && (
                <Reveal className="mt-8">
                  <div className="flex items-center justify-center gap-2">
                    <button
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="flex h-9 w-9 items-center justify-center rounded-lg border border-black/10 bg-white text-slate-600 shadow-sm transition-all hover:border-[var(--brand-navy)] hover:text-[var(--brand-navy)] disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>

                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter(
                        (p) =>
                          p === 1 ||
                          p === totalPages ||
                          Math.abs(p - currentPage) <= 1
                      )
                      .reduce<(number | "...")[]>((acc, p, idx, arr) => {
                        if (idx > 0 && p - (arr[idx - 1] as number) > 1) {
                          acc.push("...");
                        }
                        acc.push(p);
                        return acc;
                      }, [])
                      .map((item, idx) =>
                        item === "..." ? (
                          <span key={`ellipsis-${idx}`} className="px-1 text-slate-400">
                            ...
                          </span>
                        ) : (
                          <button
                            key={item}
                            onClick={() => setCurrentPage(item as number)}
                            className={`flex h-9 w-9 items-center justify-center rounded-lg border text-sm font-medium shadow-sm transition-all ${
                              currentPage === item
                                ? "border-[var(--brand-navy)] bg-[var(--brand-navy)] text-white"
                                : "border-black/10 bg-white text-slate-600 hover:border-[var(--brand-navy)] hover:text-[var(--brand-navy)]"
                            }`}
                          >
                            {item}
                          </button>
                        )
                      )}

                    <button
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="flex h-9 w-9 items-center justify-center rounded-lg border border-black/10 bg-white text-slate-600 shadow-sm transition-all hover:border-[var(--brand-navy)] hover:text-[var(--brand-navy)] disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                  <p className="mt-3 text-center text-xs text-slate-400">
                    Page {currentPage} of {totalPages} — {filtered.length} total results
                  </p>
                </Reveal>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Detail Slide-over ── */}
      <AnimatePresence>
        {selectedBook && (
          <DetailPanel book={selectedBook} onClose={() => setSelectedBook(null)} />
        )}
      </AnimatePresence>
    </>
  );
}