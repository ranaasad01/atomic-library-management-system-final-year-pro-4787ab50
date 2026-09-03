"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Users, Search, Plus, Edit2, Trash2, CheckCircle, XCircle, Shield, User, Phone, Mail, MapPin, Hash, ChevronDown, AlertCircle, X, Save, RefreshCw } from 'lucide-react';
import { Reveal } from "@/components/Reveal";
import { fadeInUp, staggerContainer, scaleIn } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

// ─── Types ──────────────────────────────────────────────────────────────────

type UserRole = "member" | "admin";

interface UserProfile {
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

type FilterStatus = "all" | "active" | "inactive";
type FilterRole = "all" | "member" | "admin";

interface FormState {
  full_name: string;
  email: string;
  role: UserRole;
  phone: string;
  address: string;
  membership_number: string;
  is_active: boolean;
}

const EMPTY_FORM: FormState = {
  full_name: "",
  email: "",
  role: "member",
  phone: "",
  address: "",
  membership_number: "",
  is_active: true,
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function getRoleBadge(role: string) {
  return role === "admin"
    ? "bg-[var(--brand-gold)]/15 text-[var(--brand-gold)] border border-[var(--brand-gold)]/30"
    : "bg-[var(--brand-navy)]/10 text-[var(--brand-navy)] border border-[var(--brand-navy)]/20";
}

function getStatusBadge(active: boolean) {
  return active
    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
    : "bg-red-50 text-red-600 border border-red-200";
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function StatCard({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: React.ElementType;
  label: string;
  value: number | string;
  accent?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border p-5 flex items-center gap-4",
        "bg-white border-[var(--brand-navy)]/10",
        "shadow-[0_1px_2px_rgba(0,0,0,0.04),0_4px_16px_-4px_rgba(0,0,0,0.08)]"
      )}
    >
      <div
        className={cn(
          "w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0",
          accent
            ? "bg-[var(--brand-gold)]/15"
            : "bg-[var(--brand-navy)]/8"
        )}
      >
        <Icon
          className={cn(
            "w-5 h-5",
            accent ? "text-[var(--brand-gold)]" : "text-[var(--brand-navy)]"
          )}
        />
      </div>
      <div>
        <p className="text-2xl font-bold text-[var(--brand-navy)] leading-none">
          {value}
        </p>
        <p className="text-xs text-slate-500 mt-1">{label}</p>
      </div>
    </div>
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
  onSave: (form: FormState) => void;
  initial: FormState | null;
  loading: boolean;
  error: string | null;
}) {
  const [form, setForm] = useState<FormState>(initial ?? EMPTY_FORM);

  useEffect(() => {
    setForm(initial ?? EMPTY_FORM);
  }, [initial, open]);

  function set<K extends keyof FormState>(key: K, val: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: val }));
  }

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <div
          className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          onClick={onClose}
        />
        <motion.div
          className="relative z-10 w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-[var(--brand-navy)]/10 overflow-hidden"
          initial={{ opacity: 0, scale: 0.95, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 16 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-[var(--brand-navy)]">
            <h2 className="text-base font-semibold text-white">
              {initial === EMPTY_FORM || !initial?.email
                ? "Add New Member"
                : "Edit Member"}
            </h2>
            <button
              onClick={onClose}
              className="text-white/70 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="px-6 py-5 space-y-4 max-h-[70vh] overflow-y-auto">
            {error && (
              <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Full Name *
                </label>
                <input
                  value={form.full_name}
                  onChange={(e) => set("full_name", e.target.value)}
                  placeholder="e.g. Ahmed Raza"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[var(--brand-navy)]/30 focus:border-[var(--brand-navy)]"
                />
              </div>

              <div className="col-span-2">
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => set("email", e.target.value)}
                  placeholder="member@ncbae.edu.pk"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[var(--brand-navy)]/30 focus:border-[var(--brand-navy)]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Role
                </label>
                <div className="relative">
                  <select
                    value={form.role}
                    onChange={(e) => set("role", e.target.value as UserRole)}
                    className="w-full appearance-none rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[var(--brand-navy)]/30 focus:border-[var(--brand-navy)] pr-8"
                  >
                    <option value="member">Member</option>
                    <option value="admin">Admin</option>
                  </select>
                  <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Status
                </label>
                <div className="relative">
                  <select
                    value={form.is_active ? "active" : "inactive"}
                    onChange={(e) =>
                      set("is_active", e.target.value === "active")
                    }
                    className="w-full appearance-none rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[var(--brand-navy)]/30 focus:border-[var(--brand-navy)] pr-8"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                  <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Phone
                </label>
                <input
                  value={form.phone}
                  onChange={(e) => set("phone", e.target.value)}
                  placeholder="+92 300 0000000"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[var(--brand-navy)]/30 focus:border-[var(--brand-navy)]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Membership No.
                </label>
                <input
                  value={form.membership_number}
                  onChange={(e) => set("membership_number", e.target.value)}
                  placeholder="LIB-2024-001"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[var(--brand-navy)]/30 focus:border-[var(--brand-navy)]"
                />
              </div>

              <div className="col-span-2">
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Address
                </label>
                <input
                  value={form.address}
                  onChange={(e) => set("address", e.target.value)}
                  placeholder="Street, City"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[var(--brand-navy)]/30 focus:border-[var(--brand-navy)]"
                />
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => onSave(form)}
              disabled={loading}
              className="flex items-center gap-2 px-5 py-2 rounded-lg bg-[var(--brand-navy)] text-white text-sm font-medium hover:bg-[var(--brand-navy)]/90 transition-colors disabled:opacity-60"
            >
              {loading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              Save Member
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function DeleteConfirmModal({
  user,
  onClose,
  onConfirm,
  loading,
}: {
  user: UserProfile | null;
  onClose: () => void;
  onConfirm: () => void;
  loading: boolean;
}) {
  if (!user) return null;
  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <div
          className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          onClick={onClose}
        />
        <motion.div
          className="relative z-10 w-full max-w-sm bg-white rounded-2xl shadow-2xl border border-red-100 overflow-hidden"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.2 }}
        >
          <div className="p-6 text-center">
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6 text-red-600" />
            </div>
            <h3 className="text-base font-semibold text-slate-800 mb-1">
              Remove Member
            </h3>
            <p className="text-sm text-slate-500">
              Are you sure you want to remove{" "}
              <span className="font-medium text-slate-700">
                {user.full_name}
              </span>
              ? This action cannot be undone.
            </p>
          </div>
          <div className="flex border-t border-slate-100">
            <button
              onClick={onClose}
              className="flex-1 py-3 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={loading}
              className="flex-1 py-3 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors border-l border-slate-100 flex items-center justify-center gap-2"
            >
              {loading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                "Remove"
              )}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function UserManagementPage() {
  const supabase = createClient();

  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");
  const [filterRole, setFilterRole] = useState<FilterRole>("all");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<UserProfile | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  // ── Fetch ──────────────────────────────────────────────────────────────────

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setFetchError(null);
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      setFetchError(error.message);
    } else {
      setUsers((data as UserProfile[]) ?? []);
    }
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // ── Toast helper ───────────────────────────────────────────────────────────

  function showToast(msg: string, type: "success" | "error") {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  }

  // ── Filtered list ──────────────────────────────────────────────────────────

  const filtered = users.filter((u) => {
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      u.full_name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      (u.membership_number ?? "").toLowerCase().includes(q);
    const matchStatus =
      filterStatus === "all" ||
      (filterStatus === "active" && u.is_active) ||
      (filterStatus === "inactive" && !u.is_active);
    const matchRole =
      filterRole === "all" || u.role === filterRole;
    return matchSearch && matchStatus && matchRole;
  });

  // ── Stats ──────────────────────────────────────────────────────────────────

  const totalMembers = users.length;
  const activeMembers = users.filter((u) => u.is_active).length;
  const adminCount = users.filter((u) => u.role === "admin").length;
  const inactiveCount = users.filter((u) => !u.is_active).length;

  // ── Save (add / edit) ──────────────────────────────────────────────────────

  async function handleSave(form: FormState) {
    if (!form.full_name.trim() || !form.email.trim()) {
      setModalError("Full name and email are required.");
      return;
    }
    setModalLoading(true);
    setModalError(null);

    const payload = {
      full_name: form.full_name.trim(),
      email: form.email.trim(),
      role: form.role,
      phone: form.phone.trim() || null,
      address: form.address.trim() || null,
      membership_number: form.membership_number.trim() || null,
      is_active: form.is_active,
      updated_at: new Date().toISOString(),
    };

    if (editingUser) {
      const { error } = await supabase
        .from("users")
        .update(payload)
        .eq("id", editingUser.id);
      if (error) {
        setModalError(error.message);
        setModalLoading(false);
        return;
      }
      showToast("Member updated successfully.", "success");
    } else {
      const { error } = await supabase.from("users").insert({
        ...payload,
        created_at: new Date().toISOString(),
      });
      if (error) {
        setModalError(error.message);
        setModalLoading(false);
        return;
      }
      showToast("Member added successfully.", "success");
    }

    setModalLoading(false);
    setModalOpen(false);
    setEditingUser(null);
    fetchUsers();
  }

  // ── Delete ─────────────────────────────────────────────────────────────────

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    const { error } = await supabase
      .from("users")
      .delete()
      .eq("id", deleteTarget.id);
    if (error) {
      showToast(error.message, "error");
    } else {
      showToast("Member removed.", "success");
      fetchUsers();
    }
    setDeleteLoading(false);
    setDeleteTarget(null);
  }

  // ── Toggle active ──────────────────────────────────────────────────────────

  async function toggleActive(user: UserProfile) {
    const { error } = await supabase
      .from("users")
      .update({ is_active: !user.is_active, updated_at: new Date().toISOString() })
      .eq("id", user.id);
    if (error) {
      showToast(error.message, "error");
    } else {
      showToast(
        user.is_active ? "Member deactivated." : "Member activated.",
        "success"
      );
      fetchUsers();
    }
  }

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div
      className="min-h-screen"
      style={{ background: "var(--brand-cream, #f5f0e8)" }}
    >
      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            className={cn(
              "fixed top-5 right-5 z-[100] flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-sm font-medium",
              toast.type === "success"
                ? "bg-emerald-600 text-white"
                : "bg-red-600 text-white"
            )}
            initial={{ opacity: 0, y: -12, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.95 }}
            transition={{ duration: 0.25 }}
          >
            {toast.type === "success" ? (
              <CheckCircle className="w-4 h-4" />
            ) : (
              <AlertCircle className="w-4 h-4" />
            )}
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modals */}
      <UserModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingUser(null);
          setModalError(null);
        }}
        onSave={handleSave}
        initial={
          editingUser
            ? {
                full_name: editingUser.full_name,
                email: editingUser.email,
                role: editingUser.role as UserRole,
                phone: editingUser.phone ?? "",
                address: editingUser.address ?? "",
                membership_number: editingUser.membership_number ?? "",
                is_active: editingUser.is_active,
              }
            : null
        }
        loading={modalLoading}
        error={modalError}
      />

      <DeleteConfirmModal
        user={deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleteLoading}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        {/* ── Page Header ── */}
        <Reveal>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-[var(--brand-navy)] tracking-tight">
                User Management
              </h1>
              <p className="text-sm text-slate-500 mt-0.5">
                Manage library members, roles, and account status.
              </p>
            </div>
            <button
              onClick={() => {
                setEditingUser(null);
                setModalError(null);
                setModalOpen(true);
              }}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[var(--brand-navy)] text-white text-sm font-medium hover:bg-[var(--brand-navy)]/90 transition-all duration-200 shadow-[0_2px_8px_rgba(30,58,95,0.25)] hover:shadow-[0_4px_16px_rgba(30,58,95,0.35)] self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" />
              Add Member
            </button>
          </div>
        </Reveal>

        {/* ── Stat Cards ── */}
        <Reveal>
          <motion.div
            className="grid grid-cols-2 lg:grid-cols-4 gap-4"
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
          >
            {[
              { icon: Users, label: "Total Members", value: totalMembers },
              { icon: CheckCircle, label: "Active Members", value: activeMembers },
              { icon: Shield, label: "Administrators", value: adminCount, accent: true },
              { icon: XCircle, label: "Inactive Accounts", value: inactiveCount },
            ].map((s, i) => (
              <motion.div key={s.label} variants={fadeInUp}>
                <StatCard
                  icon={s.icon}
                  label={s.label}
                  value={s.value}
                  accent={s.accent}
                />
              </motion.div>
            ))}
          </motion.div>
        </Reveal>

        {/* ── Filters ── */}
        <Reveal>
          <div className="bg-white rounded-2xl border border-[var(--brand-navy)]/10 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_4px_16px_-4px_rgba(0,0,0,0.08)] p-4 flex flex-col sm:flex-row gap-3">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name, email, or membership no."
                className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-200 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[var(--brand-navy)]/25 focus:border-[var(--brand-navy)]"
              />
            </div>

            {/* Status filter */}
            <div className="relative">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as FilterStatus)}
                className="appearance-none pl-3 pr-8 py-2 rounded-lg border border-slate-200 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-[var(--brand-navy)]/25 focus:border-[var(--brand-navy)] bg-white"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>

            {/* Role filter */}
            <div className="relative">
              <select
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value as FilterRole)}
                className="appearance-none pl-3 pr-8 py-2 rounded-lg border border-slate-200 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-[var(--brand-navy)]/25 focus:border-[var(--brand-navy)] bg-white"
              >
                <option value="all">All Roles</option>
                <option value="member">Member</option>
                <option value="admin">Admin</option>
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>

            <button
              onClick={fetchUsers}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-200 text-sm text-slate-600 hover:bg-slate-50 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
          </div>
        </Reveal>

        {/* ── Table ── */}
        <Reveal>
          <div className="bg-white rounded-2xl border border-[var(--brand-navy)]/10 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_4px_16px_-4px_rgba(0,0,0,0.08)] overflow-hidden">
            {/* Table header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <p className="text-sm font-medium text-slate-700">
                {filtered.length} member{filtered.length !== 1 ? "s" : ""} found
              </p>
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3">
                <RefreshCw className="w-8 h-8 text-[var(--brand-navy)]/40 animate-spin" />
                <p className="text-sm text-slate-400">Loading members...</p>
              </div>
            ) : fetchError ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3">
                <AlertCircle className="w-8 h-8 text-red-400" />
                <p className="text-sm text-red-500">{fetchError}</p>
                <button
                  onClick={fetchUsers}
                  className="text-sm text-[var(--brand-navy)] underline"
                >
                  Try again
                </button>
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3">
                <Users className="w-10 h-10 text-slate-200" />
                <p className="text-sm text-slate-400">No members match your filters.</p>
              </div>
            ) : (
              <>
                {/* Desktop table */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100">
                        <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                          Member
                        </th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                          Membership No.
                        </th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                          Role
                        </th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                          Status
                        </th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                          Joined
                        </th>
                        <th className="text-right px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {filtered.map((user, i) => (
                        <motion.tr
                          key={user.id}
                          className="hover:bg-slate-50/60 transition-colors"
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.03, duration: 0.25 }}
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-full bg-[var(--brand-navy)]/10 flex items-center justify-center flex-shrink-0">
                                <span className="text-xs font-bold text-[var(--brand-navy)]">
                                  {user.full_name
                                    .split(" ")
                                    .map((n) => n[0])
                                    .slice(0, 2)
                                    .join("")
                                    .toUpperCase()}
                                </span>
                              </div>
                              <div>
                                <p className="font-medium text-slate-800">
                                  {user.full_name}
                                </p>
                                <p className="text-xs text-slate-400">
                                  {user.email}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <span className="font-mono text-xs text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                              {user.membership_number ?? "—"}
                            </span>
                          </td>
                          <td className="px-4 py-4">
                            <span
                              className={cn(
                                "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium",
                                getRoleBadge(user.role)
                              )}
                            >
                              {user.role === "admin" ? (
                                <Shield className="w-3 h-3" />
                              ) : (
                                <User className="w-3 h-3" />
                              )}
                              {user.role === "admin" ? "Admin" : "Member"}
                            </span>
                          </td>
                          <td className="px-4 py-4">
                            <span
                              className={cn(
                                "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium",
                                getStatusBadge(user.is_active)
                              )}
                            >
                              {user.is_active ? (
                                <CheckCircle className="w-3 h-3" />
                              ) : (
                                <XCircle className="w-3 h-3" />
                              )}
                              {user.is_active ? "Active" : "Inactive"}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-xs text-slate-500">
                            {formatDate(user.created_at)}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => toggleActive(user)}
                                title={
                                  user.is_active ? "Deactivate" : "Activate"
                                }
                                className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
                              >
                                {user.is_active ? (
                                  <XCircle className="w-4 h-4" />
                                ) : (
                                  <CheckCircle className="w-4 h-4" />
                                )}
                              </button>
                              <button
                                onClick={() => {
                                  setEditingUser(user);
                                  setModalError(null);
                                  setModalOpen(true);
                                }}
                                title="Edit"
                                className="p-1.5 rounded-lg text-slate-400 hover:text-[var(--brand-navy)] hover:bg-[var(--brand-navy)]/8 transition-colors"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => setDeleteTarget(user)}
                                title="Remove"
                                className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile cards */}
                <div className="md:hidden divide-y divide-slate-100">
                  {filtered.map((user, i) => (
                    <motion.div
                      key={user.id}
                      className="p-4 space-y-3"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.04, duration: 0.25 }}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-[var(--brand-navy)]/10 flex items-center justify-center flex-shrink-0">
                            <span className="text-xs font-bold text-[var(--brand-navy)]">
                              {user.full_name
                                .split(" ")
                                .map((n) => n[0])
                                .slice(0, 2)
                                .join("")
                                .toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <p className="font-semibold text-slate-800 text-sm">
                              {user.full_name}
                            </p>
                            <p className="text-xs text-slate-400">{user.email}</p>
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <button
                            onClick={() => {
                              setEditingUser(user);
                              setModalError(null);
                              setModalOpen(true);
                            }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-[var(--brand-navy)] hover:bg-[var(--brand-navy)]/8 transition-colors"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleteTarget(user)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2 text-xs">
                        <span
                          className={cn(
                            "inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-medium",
                            getRoleBadge(user.role)
                          )}
                        >
                          {user.role === "admin" ? (
                            <Shield className="w-3 h-3" />
                          ) : (
                            <User className="w-3 h-3" />
                          )}
                          {user.role === "admin" ? "Admin" : "Member"}
                        </span>
                        <span
                          className={cn(
                            "inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-medium",
                            getStatusBadge(user.is_active)
                          )}
                        >
                          {user.is_active ? (
                            <CheckCircle className="w-3 h-3" />
                          ) : (
                            <XCircle className="w-3 h-3" />
                          )}
                          {user.is_active ? "Active" : "Inactive"}
                        </span>
                        {user.membership_number && (
                          <span className="font-mono bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                            {user.membership_number}
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs text-slate-500">
                        {user.phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="w-3 h-3" /> {user.phone}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Hash className="w-3 h-3" /> Joined{" "}
                          {formatDate(user.created_at)}
                        </span>
                      </div>

                      <button
                        onClick={() => toggleActive(user)}
                        className={cn(
                          "w-full py-1.5 rounded-lg text-xs font-medium border transition-colors",
                          user.is_active
                            ? "border-red-200 text-red-600 hover:bg-red-50"
                            : "border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                        )}
                      >
                        {user.is_active ? "Deactivate Account" : "Activate Account"}
                      </button>
                    </motion.div>
                  ))}
                </div>
              </>
            )}
          </div>
        </Reveal>
      </div>
    </div>
  );
}