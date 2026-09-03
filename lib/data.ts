export const BRAND = {
  name: "NCBA&E Library Management System",
  shortName: "NCBA&E LMS",
  tagline: "Your institutional gateway to library resources",
  institution: "National College of Business Administration & Economics",
  year: "2024",
  project: "Final Year Project",
} as const;

export interface NavLink {
  label: string;
  href: string;
  key: string;
  adminOnly?: boolean;
  icon?: string;
}

export const navLinks: NavLink[] = [
  { label: "Dashboard", href: "/dashboard", key: "dashboard" },
  { label: "Book Search", href: "/books/search", key: "book-search" },
  { label: "Issue & Return", href: "/transactions/issue-return", key: "issue-return" },
  { label: "My Fines", href: "/fines", key: "fines" },
  { label: "Admin Panel", href: "/admin/dashboard", key: "admin", adminOnly: true },
];

export const adminNavLinks: NavLink[] = [
  { label: "Admin Dashboard", href: "/admin/dashboard", key: "admin-dashboard" },
  { label: "Book Management", href: "/admin/books", key: "admin-books" },
  { label: "User Management", href: "/admin/users", key: "admin-users" },
  { label: "Transactions", href: "/transactions/issue-return", key: "admin-transactions" },
  { label: "Fine Management", href: "/fines", key: "admin-fines" },
];

export interface BookRow {
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

export interface UserRow {
  id: string;
  full_name: string;
  email: string;
  role: string;
  phone: string | null;
  address: string | null;
  membership_number: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface BookIssueRow {
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

export interface FineRow {
  id: string;
  issue_id: string;
  user_id: string;
  overdue_days: number;
  fine_per_day: number;
  total_amount: number;
  status: string;
  paid_at: string | null;
  waived_by: string | null;
  waive_reason: string | null;
  created_at: string;
  updated_at: string;
}

export interface ActivityLogRow {
  id: string;
  actor_id: string;
  action_type: string;
  entity_type: string;
  entity_id: string | null;
  description: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export const FINE_RATE_PER_DAY = 5;
export const DEFAULT_ISSUE_DAYS = 14;

export const BOOK_CATEGORIES = [
  "Computer Science",
  "Engineering",
  "Mathematics",
  "Business",
  "Literature",
  "Social Sciences",
  "Natural Sciences",
  "Law",
  "Medicine",
  "General",
] as const;

export const BOOK_STATUSES = {
  AVAILABLE: "available",
  ISSUED: "issued",
  RESERVED: "reserved",
} as const;

export const ISSUE_STATUSES = {
  ISSUED: "issued",
  RETURNED: "returned",
  OVERDUE: "overdue",
} as const;

export const FINE_STATUSES = {
  PENDING: "pending",
  PAID: "paid",
  WAIVED: "waived",
} as const;

export const USER_ROLES = {
  ADMIN: "admin",
  MEMBER: "member",
} as const;