"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Users, Search, Plus, Edit2, Trash2, CheckCircle, XCircle, Shield, User, Phone, Mail, MapPin, Hash, ChevronDown, X, AlertCircle, RefreshCw } from 'lucide-react';
import { Reveal } from "@/components/Reveal";
import { fadeInUp, staggerContainer, scaleIn } from "@/lib/motion";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

type UserRole = "member" | "admin";

interface LibraryUser {
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

interface UserFormData {
  full_name: string;
  email: string;
  role: UserRole;
  phone: string;
  address: string;
  membership_number: string;
  is_active: boolean;
}

const EMPTY_FORM: UserFormData = {
  full_name: "",
  email: "",
  role: "member",
  phone: "",
  address: "",
  membership_number: "",
  is_active: true,
};

type FilterRole = "all" | "member" | "admin";
type FilterStatus = "all" | "active" | "inactive";

function StatCard({
  label,
  value,
  icon: Icon,
  accent,
}: {
  label: string;
  value: number | string;
  icon: React.ElementType;
  accent?: boolean;
}) {
  return (
    <motion.div
      variants={scaleIn}
      className={cn(
        "rounded-2xl border p-5 flex items-center gap-4",
        accent
          ? "bg-[var(--brand-navy)] border-[var(--brand-navy)] text-white"
          : "bg-white border-[var(--brand-border)] text-[var(--brand-navy)]"
      )}
    >
      <div
        className={cn(
          "w-11 h-11 rounded-xl flex items-center justify-center shrink-0",
          accent ? "bg-white/15" : "bg-[var(--brand-cream)]"
        )}
      >
        <Icon className={cn("w-5 h-5", accent ? "text-white" : "text-[var(--brand-gold)]")} />
      </div>
      <div>
        <p className={cn("text-2xl font-bold leading-none", accent ? "text-white" : "text-[var(--brand-navy)]")}>
          {value}
        </p>
        <p className={cn("text-xs mt-1", accent ? "text-white/70" : "text-[var(--brand-muted)]")}>{label}</p>
      </div>
    </motion.div>
  );
}

function RoleBadge({ role }: { role: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium",
        role === "admin"
          ? "bg-[var(--brand-navy)] text-white"
          : "bg-[var(--brand-cream)] text-[var(--brand-navy)]"
      )}
    >
      {role === "admin" ? <Shield className="w-3 h-3" /> : <User className="w-3 h-3" />}
      {role === "admin" ? "Admin" : "Member"}
    </span>
  );
}

function StatusBadge({ active }: { active: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium",
        active
          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
          : "bg-red-50 text-red-600 border border-red-200"
      )}
    >
      {active ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
      {active ? "Active" : "Inactive"}
    </span>
  );
}

function UserModal({
  open,
  onClose,
  onSave,
  initial,
  loading,
  error,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (data: UserFormData) => void;
  initial: UserFormData;
  loading: boolean;
  error: string | null;
}) {
  const [form, setForm] = useState<UserFormData>(initial);

  useEffect(() => {
    setForm(initial);
  }, [initial, open]);

  const set = (field: keyof UserFormData, value: string | boolean) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(form);
  };

  return (
    <AnimatePresence>
      {open && (
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
              className="bg-white rounded-2xl shadow-[0_8px_40px_rgba(30,58,95,0.18)] w-full max-w-lg overflow-hidden"
              initial={{ scale: 0.94, y: 16 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.94, y: 16 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--brand-border)] bg-[var(--brand-cream)]">
                <h2 className="text-base font-semibold text-[var(--brand-navy)]">
                  {initial.full_name ? "Edit User" : "Add New User"}
                </h2>
                <button
                  onClick={onClose}
                  className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-black/5 transition-colors"
                >
                  <X className="w-4 h-4 text-[var(--brand-muted)]" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                {error && (
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    {error}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-xs font-medium text-[var(--brand-muted)] mb-1">Full Name *</label>
                    <input
                      required
                      value={form.full_name}
                      onChange={(e) => set("full_name", e.target.value)}
                      placeholder="e.g. Ahmed Raza"
                      className="w-full rounded-lg border border-[var(--brand-border)] px-3 py-2 text-sm text-[var(--brand-navy)] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[var(--brand-navy)]/20 focus:border-[var(--brand-navy)] transition-all"
                    />
                  </div>

                  <div className="col-span-2">
                    <label className="block text-xs font-medium text-[var(--brand-muted)] mb-1">Email Address *</label>
                    <input
                      required
                      type="email"
                      value={form.email}
                      onChange={(e) => set("email", e.target.value)}
                      placeholder="user@ncbae.edu.pk"
                      className="w-full rounded-lg border border-[var(--brand-border)] px-3 py-2 text-sm text-[var(--brand-navy)] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[var(--brand-navy)]/20 focus:border-[var(--brand-navy)] transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-[var(--brand-muted)] mb-1">Role *</label>
                    <div className="relative">
                      <select
                        value={form.role}
                        onChange={(e) => set("role", e.target.value as UserRole)}
                        className="w-full appearance-none rounded-lg border border-[var(--brand-border)] px-3 py-2 text-sm text-[var(--brand-navy)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-navy)]/20 focus:border-[var(--brand-navy)] transition-all bg-white"
                      >
                        <option value="member">Member</option>
                        <option value="admin">Admin</option>
                      </select>
                      <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--brand-muted)] pointer-events-none" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-[var(--brand-muted)] mb-1">Membership No.</label>
                    <input
                      value={form.membership_number}
                      onChange={(e) => set("membership_number", e.target.value)}
                      placeholder="LIB-2024-001"
                      className="w-full rounded-lg border border-[var(--brand-border)] px-3 py-2 text-sm text-[var(--brand-navy)] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[var(--brand-navy)]/20 focus:border-[var(--brand-navy)] transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-[var(--brand-muted)] mb-1">Phone</label>
                    <input
                      value={form.phone}
                      onChange={(e) => set("phone", e.target.value)}
                      placeholder="+92 300 0000000"
                      className="w-full rounded-lg border border-[var(--brand-border)] px-3 py-2 text-sm text-[var(--brand-navy)] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[var(--brand-navy)]/20 focus:border-[var(--brand-navy)] transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-[var(--brand-muted)] mb-1">Status</label>
                    <div className="relative">
                      <select
                        value={form.is_active ? "active" : "inactive"}
                        onChange={(e) => set("is_active", e.target.value === "active")}
                        className="w-full appearance-none rounded-lg border border-[var(--brand-border)] px-3 py-2 text-sm text-[var(--brand-navy)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-navy)]/20 focus:border-[var(--brand-navy)] transition-all bg-white"
                      >
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                      </select>
                      <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--brand-muted)] pointer-events-none" />
                    </div>
                  </div>

                  <div className="col-span-2">
                    <label className="block text-xs font-medium text-[var(--brand-muted)] mb-1">Address</label>
                    <input
                      value={form.address}
                      onChange={(e) => set("address", e.target.value)}
                      placeholder="Street, City, Province"
                      className="w-full rounded-lg border border-[var(--brand-border)] px-3 py-2 text-sm text-[var(--brand-navy)] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[var(--brand-navy)]/20 focus:border-[var(--brand-navy)] transition-all"
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 rounded-lg border border-[var(--brand-border)] px-4 py-2 text-sm font-medium text-[var(--brand-muted)] hover:bg-[var(--brand-cream)] transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 rounded-lg bg-[var(--brand-navy)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--brand-navy)]/90 disabled:opacity-60 transition-colors flex items-center justify-center gap-2"
                  >
                    {loading && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                    {initial.full_name ? "Save Changes" : "Add User"}
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
  user,
  onClose,
  onConfirm,
  loading,
}: {
  open: boolean;
  user: LibraryUser | null;
  onClose: () => void;
  onConfirm: () => void;
  loading: boolean;
}) {
  return (
    <AnimatePresence>
      {open && user && (
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
              className="bg-white rounded-2xl shadow-[0_8px_40px_rgba(30,58,95,0.18)] w-full max-w-sm p-6"
              initial={{ scale: 0.94, y: 16 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.94, y: 16 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-5 h-5 text-red-500" />
              </div>
              <h3 className="text-base font-semibold text-[var(--brand-navy)] text-center">Remove User</h3>
              <p className="text-sm text-[var(--brand-muted)] text-center mt-1">
                Are you sure you want to remove{" "}
                <span className="font-medium text-[var(--brand-navy)]">{user.full_name}</span>? This action cannot be
                undone.
              </p>
              <div className="flex gap-3 mt-5">
                <button
                  onClick={onClose}
                  className="flex-1 rounded-lg border border-[var(--brand-border)] px-4 py-2 text-sm font-medium text-[var(--brand-muted)] hover:bg-[var(--brand-cream)] transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={onConfirm}
                  disabled={loading}
                  className="flex-1 rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white hover:bg-red-600 disabled:opacity-60 transition-colors flex items-center justify-center gap-2"
                >
                  {loading && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  Remove
                </button>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export default function AdminUsersPage() {
  const supabase = createClient();

  const [users, setUsers] = useState<LibraryUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState<FilterRole>("all");
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<LibraryUser | null>(null);
  const [formInitial, setFormInitial] = useState<UserFormData>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletingUser, setDeletingUser] = useState<LibraryUser | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchUsers = useCallback(async () => {
    setLoadingUsers(true);
    setFetchError(null);
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      setFetchError(error.message);
    } else {
      setUsers((data as LibraryUser[]) ?? []);
    }
    setLoadingUsers(false);
  }, [supabase]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const filtered = users.filter((u) => {
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      u.full_name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      (u.membership_number ?? "").toLowerCase().includes(q) ||
      (u.phone ?? "").toLowerCase().includes(q);
    const matchRole = filterRole === "all" || u.role === filterRole;
    const matchStatus =
      filterStatus === "all" ||
      (filterStatus === "active" && u.is_active) ||
      (filterStatus === "inactive" && !u.is_active);
    return matchSearch && matchRole && matchStatus;
  });

  const totalUsers = users.length;
  const activeUsers = users.filter((u) => u.is_active).length;
  const adminCount = users.filter((u) => u.role === "admin").length;
  const memberCount = users.filter((u) => u.role === "member").length;

  const openAdd = () => {
    setEditingUser(null);
    setFormInitial(EMPTY_FORM);
    setSaveError(null);
    setModalOpen(true);
  };

  const openEdit = (u: LibraryUser) => {
    setEditingUser(u);
    setFormInitial({
      full_name: u.full_name,
      email: u.email,
      role: u.role as UserRole,
      phone: u.phone ?? "",
      address: u.address ?? "",
      membership_number: u.membership_number ?? "",
      is_active: u.is_active,
    });
    setSaveError(null);
    setModalOpen(true);
  };

  const handleSave = async (data: UserFormData) => {
    setSaving(true);
    setSaveError(null);

    const payload = {
      full_name: data.full_name,
      email: data.email,
      role: data.role,
      phone: data.phone || null,
      address: data.address || null,
      membership_number: data.membership_number || null,
      is_active: data.is_active,
      updated_at: new Date().toISOString(),
    };

    if (editingUser) {
      const { error } = await supabase.from("users").update(payload).eq("id", editingUser.id);
      if (error) {
        setSaveError(error.message);
        setSaving(false);
        return;
      }
    } else {
      const { error } = await supabase
        .from("users")
        .insert({ ...payload, created_at: new Date().toISOString() });
      if (error) {
        setSaveError(error.message);
        setSaving(false);
        return;
      }
    }

    setSaving(false);
    setModalOpen(false);
    fetchUsers();
  };

  const openDelete = (u: LibraryUser) => {
    setDeletingUser(u);
    setDeleteOpen(true);
  };

  const handleDelete = async () => {
    if (!deletingUser) return;
    setDeleting(true);
    const { error } = await supabase.from("users").delete().eq("id", deletingUser.id);
    setDeleting(false);
    if (!error) {
      setDeleteOpen(false);
      setDeletingUser(null);
      fetchUsers();
    }
  };

  const toggleStatus = async (u: LibraryUser) => {
    await supabase
      .from("users")
      .update({ is_active: !u.is_active, updated_at: new Date().toISOString() })
      .eq("id", u.id);
    fetchUsers();
  };

  return (
    <div className="min-h-screen bg-[var(--brand-cream)] pb-16">
      {/* Page Header */}
      <Reveal>
        <div className="bg-[var(--brand-navy)] px-6 py-10 md:px-10">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">User Management</h1>
                <p className="text-white/60 text-sm mt-1">
                  Manage library members and administrators for NCBA&amp;E LMS
                </p>
              </div>
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={openAdd}
                className="inline-flex items-center gap-2 bg-[var(--brand-gold)] text-[var(--brand-navy)] px-5 py-2.5 rounded-xl text-sm font-semibold shadow-[0_2px_12px_rgba(200,169,110,0.35)] hover:brightness-105 transition-all"
              >
                <Plus className="w-4 h-4" />
                Add User
              </motion.button>
            </div>
          </div>
        </div>
      </Reveal>

      <div className="max-w-7xl mx-auto px-4 md:px-10 mt-8 space-y-8">
        {/* Stats */}
        <Reveal>
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-2 lg:grid-cols-4 gap-4"
          >
            <StatCard label="Total Users" value={totalUsers} icon={Users} accent />
            <StatCard label="Active Members" value={activeUsers} icon={CheckCircle} />
            <StatCard label="Administrators" value={adminCount} icon={Shield} />
            <StatCard label="Library Members" value={memberCount} icon={User} />
          </motion.div>
        </Reveal>

        {/* Filters */}
        <Reveal>
          <div className="bg-white rounded-2xl border border-[var(--brand-border)] p-4 shadow-[0_1px_4px_rgba(30,58,95,0.06)]">
            <div className="flex flex-col md:flex-row gap-3">
              {/* Search */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--brand-muted)]" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by name, email, or membership number..."
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-[var(--brand-border)] text-sm text-[var(--brand-navy)] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[var(--brand-navy)]/20 focus:border-[var(--brand-navy)] transition-all"
                />
                {search && (
                  <button
                    onClick={() => setSearch("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--brand-muted)] hover:text-[var(--brand-navy)]"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Role filter */}
              <div className="relative">
                <select
                  value={filterRole}
                  onChange={(e) => setFilterRole(e.target.value as FilterRole)}
                  className="appearance-none bg-[var(--brand-cream)] border border-[var(--brand-border)] rounded-xl px-4 py-2.5 pr-8 text-sm text-[var(--brand-navy)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-navy)]/20 focus:border-[var(--brand-navy)] transition-all"
                >
                  <option value="all">All Roles</option>
                  <option value="member">Members</option>
                  <option value="admin">Admins</option>
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--brand-muted)] pointer-events-none" />
              </div>

              {/* Status filter */}
              <div className="relative">
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value as FilterStatus)}
                  className="appearance-none bg-[var(--brand-cream)] border border-[var(--brand-border)] rounded-xl px-4 py-2.5 pr-8 text-sm text-[var(--brand-navy)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-navy)]/20 focus:border-[var(--brand-navy)] transition-all"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--brand-muted)] pointer-events-none" />
              </div>

              <button
                onClick={fetchUsers}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[var(--brand-border)] text-sm text-[var(--brand-muted)] hover:bg-[var(--brand-cream)] hover:text-[var(--brand-navy)] transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh
              </button>
            </div>

            {(search || filterRole !== "all" || filterStatus !== "all") && (
              <div className="mt-3 flex items-center gap-2 text-xs text-[var(--brand-muted)]">
                <span>
                  Showing <span className="font-semibold text-[var(--brand-navy)]">{filtered.length}</span> of{" "}
                  <span className="font-semibold text-[var(--brand-navy)]">{totalUsers}</span> users
                </span>
                <button
                  onClick={() => {
                    setSearch("");
                    setFilterRole("all");
                    setFilterStatus("all");
                  }}
                  className="ml-auto text-[var(--brand-gold)] hover:underline font-medium"
                >
                  Clear filters
                </button>
              </div>
            )}
          </div>
        </Reveal>

        {/* Table / Content */}
        <Reveal>
          <div className="bg-white rounded-2xl border border-[var(--brand-border)] shadow-[0_1px_4px_rgba(30,58,95,0.06)] overflow-hidden">
            {loadingUsers ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3">
                <RefreshCw className="w-7 h-7 text-[var(--brand-gold)] animate-spin" />
                <p className="text-sm text-[var(--brand-muted)]">Loading users...</p>
              </div>
            ) : fetchError ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3">
                <AlertCircle className="w-8 h-8 text-red-400" />
                <p className="text-sm text-red-500">{fetchError}</p>
                <button
                  onClick={fetchUsers}
                  className="text-sm text-[var(--brand-navy)] underline hover:no-underline"
                >
                  Try again
                </button>
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3">
                <Users className="w-10 h-10 text-[var(--brand-border)]" />
                <p className="text-sm text-[var(--brand-muted)]">No users found matching your filters.</p>
              </div>
            ) : (
              <>
                {/* Desktop table */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-[var(--brand-border)] bg-[var(--brand-cream)]">
                        <th className="text-left px-5 py-3 text-xs font-semibold text-[var(--brand-muted)] uppercase tracking-wide">
                          Member
                        </th>
                        <th className="text-left px-5 py-3 text-xs font-semibold text-[var(--brand-muted)] uppercase tracking-wide">
                          Contact
                        </th>
                        <th className="text-left px-5 py-3 text-xs font-semibold text-[var(--brand-muted)] uppercase tracking-wide">
                          Membership No.
                        </th>
                        <th className="text-left px-5 py-3 text-xs font-semibold text-[var(--brand-muted)] uppercase tracking-wide">
                          Role
                        </th>
                        <th className="text-left px-5 py-3 text-xs font-semibold text-[var(--brand-muted)] uppercase tracking-wide">
                          Status
                        </th>
                        <th className="text-left px-5 py-3 text-xs font-semibold text-[var(--brand-muted)] uppercase tracking-wide">
                          Joined
                        </th>
                        <th className="text-right px-5 py-3 text-xs font-semibold text-[var(--brand-muted)] uppercase tracking-wide">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--brand-border)]">
                      <AnimatePresence>
                        {filtered.map((u) => (
                          <motion.tr
                            key={u.id}
                            variants={fadeInUp}
                            initial="hidden"
                            animate="visible"
                            exit={{ opacity: 0, x: -10 }}
                            className="hover:bg-[var(--brand-cream)]/50 transition-colors"
                          >
                            <td className="px-5 py-3.5">
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-full bg-[var(--brand-navy)] flex items-center justify-center shrink-0">
                                  <span className="text-white text-xs font-bold">
                                    {u.full_name
                                      .split(" ")
                                      .map((n) => n[0])
                                      .slice(0, 2)
                                      .join("")
                                      .toUpperCase()}
                                  </span>
                                </div>
                                <div>
                                  <p className="font-medium text-[var(--brand-navy)]">{u.full_name}</p>
                                  <p className="text-xs text-[var(--brand-muted)]">{u.email}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-5 py-3.5">
                              {u.phone ? (
                                <span className="flex items-center gap-1 text-[var(--brand-muted)]">
                                  <Phone className="w-3 h-3" />
                                  {u.phone}
                                </span>
                              ) : (
                                <span className="text-gray-300 text-xs">—</span>
                              )}
                            </td>
                            <td className="px-5 py-3.5">
                              {u.membership_number ? (
                                <span className="flex items-center gap-1 font-mono text-xs text-[var(--brand-navy)] bg-[var(--brand-cream)] px-2 py-0.5 rounded-md border border-[var(--brand-border)]">
                                  <Hash className="w-3 h-3 text-[var(--brand-gold)]" />
                                  {u.membership_number}
                                </span>
                              ) : (
                                <span className="text-gray-300 text-xs">—</span>
                              )}
                            </td>
                            <td className="px-5 py-3.5">
                              <RoleBadge role={u.role} />
                            </td>
                            <td className="px-5 py-3.5">
                              <button onClick={() => toggleStatus(u)} className="hover:opacity-80 transition-opacity">
                                <StatusBadge active={u.is_active} />
                              </button>
                            </td>
                            <td className="px-5 py-3.5 text-xs text-[var(--brand-muted)]">
                              {new Date(u.created_at).toLocaleDateString("en-PK", {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                              })}
                            </td>
                            <td className="px-5 py-3.5">
                              <div className="flex items-center justify-end gap-2">
                                <motion.button
                                  whileHover={{ scale: 1.08 }}
                                  whileTap={{ scale: 0.94 }}
                                  onClick={() => openEdit(u)}
                                  className="w-8 h-8 rounded-lg border border-[var(--brand-border)] flex items-center justify-center text-[var(--brand-muted)] hover:text-[var(--brand-navy)] hover:bg-[var(--brand-cream)] transition-colors"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </motion.button>
                                <motion.button
                                  whileHover={{ scale: 1.08 }}
                                  whileTap={{ scale: 0.94 }}
                                  onClick={() => openDelete(u)}
                                  className="w-8 h-8 rounded-lg border border-red-100 flex items-center justify-center text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </motion.button>
                              </div>
                            </td>
                          </motion.tr>
                        ))}
                      </AnimatePresence>
                    </tbody>
                  </table>
                </div>

                {/* Mobile cards */}
                <div className="md:hidden divide-y divide-[var(--brand-border)]">
                  {filtered.map((u) => (
                    <div key={u.id} className="p-4 space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-[var(--brand-navy)] flex items-center justify-center shrink-0">
                            <span className="text-white text-xs font-bold">
                              {u.full_name
                                .split(" ")
                                .map((n) => n[0])
                                .slice(0, 2)
                                .join("")
                                .toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <p className="font-semibold text-[var(--brand-navy)] text-sm">{u.full_name}</p>
                            <p className="text-xs text-[var(--brand-muted)]">{u.email}</p>
                          </div>
                        </div>
                        <div className="flex gap-1.5">
                          <button
                            onClick={() => openEdit(u)}
                            className="w-8 h-8 rounded-lg border border-[var(--brand-border)] flex items-center justify-center text-[var(--brand-muted)] hover:bg-[var(--brand-cream)]"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => openDelete(u)}
                            className="w-8 h-8 rounded-lg border border-red-100 flex items-center justify-center text-red-400 hover:bg-red-50"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <RoleBadge role={u.role} />
                        <button onClick={() => toggleStatus(u)}>
                          <StatusBadge active={u.is_active} />
                        </button>
                        {u.membership_number && (
                          <span className="inline-flex items-center gap-1 font-mono text-xs text-[var(--brand-navy)] bg-[var(--brand-cream)] px-2 py-0.5 rounded-md border border-[var(--brand-border)]">
                            <Hash className="w-3 h-3 text-[var(--brand-gold)]" />
                            {u.membership_number}
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-[var(--brand-muted)]">
                        {u.phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="w-3 h-3" /> {u.phone}
                          </span>
                        )}
                        {u.address && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" /> {u.address}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          {new Date(u.created_at).toLocaleDateString("en-PK", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="px-5 py-3 border-t border-[var(--brand-border)] bg-[var(--brand-cream)] flex items-center justify-between">
                  <p className="text-xs text-[var(--brand-muted)]">
                    {filtered.length} user{filtered.length !== 1 ? "s" : ""} shown
                  </p>
                  <p className="text-xs text-[var(--brand-muted)]">
                    {activeUsers} active · {totalUsers - activeUsers} inactive
                  </p>
                </div>
              </>
            )}
          </div>
        </Reveal>
      </div>

      {/* Modals */}
      <UserModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
        initial={formInitial}
        loading={saving}
        error={saveError}
      />
      <DeleteConfirmModal
        open={deleteOpen}
        user={deletingUser}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
        loading={deleting}
      />
    </div>
  );
}