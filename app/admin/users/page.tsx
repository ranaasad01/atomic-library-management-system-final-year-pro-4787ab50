"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Users, Search, Plus, Edit2, Trash2, CheckCircle, XCircle, Shield, User, Phone, Mail, MapPin, Hash, AlertCircle, X, Save, RefreshCw, UserCheck, UserX, Crown } from 'lucide-react';
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

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function getAvatarColor(name: string): string {
  const colors = [
    "bg-blue-500",
    "bg-emerald-500",
    "bg-violet-500",
    "bg-amber-500",
    "bg-rose-500",
    "bg-cyan-500",
    "bg-indigo-500",
    "bg-teal-500",
  ];
  const idx = name.charCodeAt(0) % colors.length;
  return colors[idx];
}

// ─── Stat Card ───────────────────────────────────────────────────────────────

function StatCard({
  icon: Icon,
  label,
  value,
  iconBg,
  iconColor,
}: {
  icon: React.ElementType;
  label: string;
  value: number | string;
  iconBg: string;
  iconColor: string;
}) {
  return (
    <motion.div
      whileHover={{ y: -4, boxShadow: "0 12px 40px -8px rgba(30,58,95,0.18)" }}
      transition={{ duration: 0.22, ease: "easeOut" }}
      className="bg-white rounded-2xl border border-[#d6cfc2] p-5 flex items-center gap-4 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_4px_16px_-4px_rgba(0,0,0,0.08)] cursor-default"
    >
      <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0", iconBg)}>
        <Icon className={cn("w-5 h-5", iconColor)} />
      </div>
      <div>
        <p className="text-2xl font-bold text-[#1e3a5f] leading-none tracking-tight">{value}</p>
        <p className="text-xs text-slate-500 mt-1 font-medium">{label}</p>
      </div>
    </motion.div>
  );
}

// ─── User Modal ───────────────────────────────────────────────────────────────

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

  const isEdit = !!initial?.email;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        {/* Backdrop */}
        <motion.div
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          onClick={onClose}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        />

        {/* Modal */}
        <motion.div
          className="relative z-10 w-full max-w-lg bg-white rounded-2xl shadow-[0_24px_80px_-12px_rgba(0,0,0,0.3)] overflow-hidden"
          variants={scaleIn}
          initial="hidden"
          animate="visible"
          exit="hidden"
        >
          {/* Gradient Header */}
          <div className="bg-gradient-to-br from-[#1e3a5f] to-[#2d5a8e] px-6 py-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center">
                <User className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-white font-semibold text-base leading-tight">
                  {isEdit ? "Edit User" : "Add New User"}
                </h2>
                <p className="text-white/60 text-xs mt-0.5">
                  {isEdit ? "Update member information" : "Register a new library member"}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
              aria-label="Close modal"
            >
              <X className="w-4 h-4 text-white" />
            </button>
          </div>

          {/* Form Body */}
          <div className="p-6 max-h-[70vh] overflow-y-auto">
            {error && (
              <div className="mb-4 flex items-center gap-2 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}

            <div className="space-y-4">
              {/* Full Name */}
              <div>
                <label className="block text-xs font-semibold text-[#1e3a5f] mb-1.5 uppercase tracking-wide">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={form.full_name}
                    onChange={(e) => set("full_name", e.target.value)}
                    placeholder="e.g. Rao Muhammad Hamza"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-[#d6cfc2] bg-[#f5f0e8]/50 text-[#1a2a3a] text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/30 focus:border-[#1e3a5f] transition-all"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-semibold text-[#1e3a5f] mb-1.5 uppercase tracking-wide">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => set("email", e.target.value)}
                    placeholder="user@ncbae.edu.pk"
                    disabled={isEdit}
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-[#d6cfc2] bg-[#f5f0e8]/50 text-[#1a2a3a] text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/30 focus:border-[#1e3a5f] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>
              </div>

              {/* Role */}
              <div>
                <label className="block text-xs font-semibold text-[#1e3a5f] mb-1.5 uppercase tracking-wide">
                  Role
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {(["member", "admin"] as UserRole[]).map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => set("role", r)}
                      className={cn(
                        "flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-medium transition-all",
                        form.role === r
                          ? "bg-[#1e3a5f] border-[#1e3a5f] text-white"
                          : "bg-white border-[#d6cfc2] text-slate-600 hover:border-[#1e3a5f]/40"
                      )}
                    >
                      {r === "admin" ? (
                        <Crown className="w-3.5 h-3.5" />
                      ) : (
                        <User className="w-3.5 h-3.5" />
                      )}
                      {r.charAt(0).toUpperCase() + r.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Phone */}
              <div>
                <label className="block text-xs font-semibold text-[#1e3a5f] mb-1.5 uppercase tracking-wide">
                  Phone
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => set("phone", e.target.value)}
                    placeholder="+92-300-0000000"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-[#d6cfc2] bg-[#f5f0e8]/50 text-[#1a2a3a] text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/30 focus:border-[#1e3a5f] transition-all"
                  />
                </div>
              </div>

              {/* Membership Number */}
              <div>
                <label className="block text-xs font-semibold text-[#1e3a5f] mb-1.5 uppercase tracking-wide">
                  Membership Number
                </label>
                <div className="relative">
                  <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={form.membership_number}
                    onChange={(e) => set("membership_number", e.target.value)}
                    placeholder="LIB-2024-0001"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-[#d6cfc2] bg-[#f5f0e8]/50 text-[#1a2a3a] text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/30 focus:border-[#1e3a5f] transition-all"
                  />
                </div>
              </div>

              {/* Address */}
              <div>
                <label className="block text-xs font-semibold text-[#1e3a5f] mb-1.5 uppercase tracking-wide">
                  Address
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                  <textarea
                    value={form.address}
                    onChange={(e) => set("address", e.target.value)}
                    placeholder="Street, City, Province"
                    rows={2}
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-[#d6cfc2] bg-[#f5f0e8]/50 text-[#1a2a3a] text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/30 focus:border-[#1e3a5f] transition-all resize-none"
                  />
                </div>
              </div>

              {/* Active Toggle */}
              <div className="flex items-center justify-between p-4 rounded-xl bg-[#f5f0e8] border border-[#d6cfc2]">
                <div>
                  <p className="text-sm font-semibold text-[#1e3a5f]">Account Status</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {form.is_active ? "Member can access the library system" : "Member access is suspended"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => set("is_active", !form.is_active)}
                  className={cn(
                    "relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/30 focus:ring-offset-2",
                    form.is_active ? "bg-[#1e3a5f]" : "bg-slate-300"
                  )}
                  aria-label="Toggle active status"
                >
                  <span
                    className={cn(
                      "inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform",
                      form.is_active ? "translate-x-6" : "translate-x-1"
                    )}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="px-6 py-4 bg-[#f5f0e8]/60 border-t border-[#d6cfc2] flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-[#d6cfc2] bg-white text-[#1a2a3a] text-sm font-medium hover:bg-[#f5f0e8] transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => onSave(form)}
              disabled={loading}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-[#1e3a5f] hover:bg-[#162d4a] text-white text-sm font-semibold transition-colors disabled:opacity-60 shadow-[0_2px_8px_rgba(30,58,95,0.3)]"
            >
              {loading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              {loading ? "Saving..." : isEdit ? "Save Changes" : "Add User"}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// ─── Delete Confirm Modal ─────────────────────────────────────────────────────

function DeleteConfirmModal({
  open,
  user,
  onClose,
  onConfirm,
  loading,
}: {
  open: boolean;
  user: UserProfile | null;
  onClose: () => void;
  onConfirm: () => void;
  loading: boolean;
}) {
  if (!open || !user) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
        <motion.div
          className="relative z-10 w-full max-w-sm bg-white rounded-2xl shadow-[0_24px_80px_-12px_rgba(0,0,0,0.3)] overflow-hidden"
          variants={scaleIn}
          initial="hidden"
          animate="visible"
          exit="hidden"
        >
          <div className="p-6 text-center">
            <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6 text-red-600" />
            </div>
            <h3 className="text-lg font-bold text-[#1a2a3a] mb-1">Delete User</h3>
            <p className="text-sm text-slate-500 mb-6">
              Are you sure you want to delete{" "}
              <span className="font-semibold text-[#1a2a3a]">{user.full_name}</span>? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2.5 rounded-xl border border-[#d6cfc2] bg-white text-[#1a2a3a] text-sm font-medium hover:bg-[#f5f0e8] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={onConfirm}
                disabled={loading}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-semibold transition-colors disabled:opacity-60"
              >
                {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                {loading ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AdminUsersPage() {
  const supabase = createClient();

  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [modalError, setModalError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");
  const [filterRole, setFilterRole] = useState<FilterRole>("all");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [deleteModal, setDeleteModal] = useState<UserProfile | null>(null);

  // ─── Fetch ──────────────────────────────────────────────────────────────

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: fetchError } = await supabase
        .from("users")
        .select("*")
        .order("created_at", { ascending: false });
      if (fetchError) throw fetchError;
      setUsers(data ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load users.");
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // ─── Derived stats ───────────────────────────────────────────────────────

  const totalUsers = users.length;
  const activeUsers = users.filter((u) => u.is_active).length;
  const adminUsers = users.filter((u) => u.role === "admin").length;
  const memberUsers = users.filter((u) => u.role === "member").length;

  // ─── Filtered list ───────────────────────────────────────────────────────

  const filtered = users.filter((u) => {
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      u.full_name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      (u.membership_number ?? "").toLowerCase().includes(q);
    const matchStatus =
      filterStatus === "all"
        ? true
        : filterStatus === "active"
        ? u.is_active
        : !u.is_active;
    const matchRole =
      filterRole === "all" ? true : u.role === filterRole;
    return matchSearch && matchStatus && matchRole;
  });

  // ─── Save (add / edit) ───────────────────────────────────────────────────

  const handleSave = async (form: FormState) => {
    if (!form.full_name.trim() || !form.email.trim()) {
      setModalError("Full name and email are required.");
      return;
    }
    setSaving(true);
    setModalError(null);
    try {
      if (editingUser) {
        const { error: updateError } = await supabase
          .from("users")
          .update({
            full_name: form.full_name.trim(),
            role: form.role,
            phone: form.phone.trim() || null,
            address: form.address.trim() || null,
            membership_number: form.membership_number.trim() || null,
            is_active: form.is_active,
            updated_at: new Date().toISOString(),
          })
          .eq("id", editingUser.id);
        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase.from("users").insert({
          full_name: form.full_name.trim(),
          email: form.email.trim(),
          role: form.role,
          phone: form.phone.trim() || null,
          address: form.address.trim() || null,
          membership_number: form.membership_number.trim() || null,
          is_active: form.is_active,
        });
        if (insertError) throw insertError;
      }
      setModalOpen(false);
      setEditingUser(null);
      await fetchUsers();
    } catch (err) {
      setModalError(err instanceof Error ? err.message : "Failed to save user.");
    } finally {
      setSaving(false);
    }
  };

  // ─── Delete ──────────────────────────────────────────────────────────────

  const handleDelete = async () => {
    if (!deleteModal) return;
    setDeleting(true);
    try {
      const { error: deleteError } = await supabase
        .from("users")
        .delete()
        .eq("id", deleteModal.id);
      if (deleteError) throw deleteError;
      setDeleteModal(null);
      await fetchUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete user.");
      setDeleteModal(null);
    } finally {
      setDeleting(false);
    }
  };

  // ─── Open modal helpers ──────────────────────────────────────────────────

  function openAdd() {
    setEditingUser(null);
    setModalError(null);
    setModalOpen(true);
  }

  function openEdit(u: UserProfile) {
    setEditingUser(u);
    setModalError(null);
    setModalOpen(true);
  }

  const modalInitial: FormState | null = editingUser
    ? {
        full_name: editingUser.full_name,
        email: editingUser.email,
        role: editingUser.role as UserRole,
        phone: editingUser.phone ?? "",
        address: editingUser.address ?? "",
        membership_number: editingUser.membership_number ?? "",
        is_active: editingUser.is_active,
      }
    : null;

  // ─── Render ──────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[#f5f0e8]">
      {/* ── Page Header ── */}
      <div className="bg-gradient-to-br from-[#1e3a5f] via-[#1e3a5f] to-[#2d5a8e] px-6 py-10 md:py-14">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-[#c8a96e]/20 flex items-center justify-center">
                  <Users className="w-4 h-4 text-[#c8a96e]" />
                </div>
                <span className="text-[#c8a96e] text-xs font-semibold uppercase tracking-widest">
                  Admin Panel
                </span>
              </div>
              <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
                User Management
              </h1>
              <p className="text-white/60 text-sm mt-1">
                Manage library members, roles, and account status
              </p>
            </div>
            <button
              onClick={openAdd}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#c8a96e] hover:bg-[#b8944f] text-[#1a2a3a] text-sm font-bold transition-all shadow-[0_4px_16px_rgba(200,169,110,0.35)] hover:shadow-[0_6px_24px_rgba(200,169,110,0.45)] hover:-translate-y-0.5"
            >
              <Plus className="w-4 h-4" />
              Add User
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* ── Error Banner ── */}
        {error && (
          <div className="flex items-center gap-3 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
            <button onClick={() => setError(null)} className="ml-auto">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* ── Stats ── */}
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-2 lg:grid-cols-4 gap-4"
        >
          <motion.div variants={fadeInUp}>
            <StatCard
              icon={Users}
              label="Total Users"
              value={totalUsers}
              iconBg="bg-[#1e3a5f]/10"
              iconColor="text-[#1e3a5f]"
            />
          </motion.div>
          <motion.div variants={fadeInUp}>
            <StatCard
              icon={UserCheck}
              label="Active Members"
              value={activeUsers}
              iconBg="bg-emerald-100"
              iconColor="text-emerald-600"
            />
          </motion.div>
          <motion.div variants={fadeInUp}>
            <StatCard
              icon={Crown}
              label="Administrators"
              value={adminUsers}
              iconBg="bg-[#c8a96e]/15"
              iconColor="text-[#c8a96e]"
            />
          </motion.div>
          <motion.div variants={fadeInUp}>
            <StatCard
              icon={UserX}
              label="Inactive Accounts"
              value={totalUsers - activeUsers}
              iconBg="bg-red-100"
              iconColor="text-red-500"
            />
          </motion.div>
        </motion.div>

        {/* ── Filters ── */}
        <Reveal>
          <div className="bg-white rounded-2xl border border-[#d6cfc2] shadow-[0_1px_2px_rgba(0,0,0,0.04),0_4px_16px_-4px_rgba(0,0,0,0.08)] p-4">
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Search */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by name, email, or membership number..."
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-[#d6cfc2] bg-[#f5f0e8]/50 text-[#1a2a3a] text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/20 focus:border-[#1e3a5f] transition-all"
                />
              </div>

              {/* Status filter */}
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as FilterStatus)}
                className="px-3 py-2.5 rounded-xl border border-[#d6cfc2] bg-white text-[#1a2a3a] text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/20 focus:border-[#1e3a5f] transition-all cursor-pointer"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>

              {/* Role filter */}
              <select
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value as FilterRole)}
                className="px-3 py-2.5 rounded-xl border border-[#d6cfc2] bg-white text-[#1a2a3a] text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/20 focus:border-[#1e3a5f] transition-all cursor-pointer"
              >
                <option value="all">All Roles</option>
                <option value="member">Members</option>
                <option value="admin">Admins</option>
              </select>

              {/* Refresh */}
              <button
                onClick={fetchUsers}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[#d6cfc2] bg-white text-[#1e3a5f] text-sm font-medium hover:bg-[#f5f0e8] transition-colors disabled:opacity-50"
              >
                <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
                <span className="hidden sm:inline">Refresh</span>
              </button>
            </div>
          </div>
        </Reveal>

        {/* ── Table ── */}
        <Reveal>
          <div className="bg-white rounded-2xl border border-[#d6cfc2] shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_-8px_rgba(0,0,0,0.10)] overflow-hidden">
            {/* Table header bar */}
            <div className="px-5 py-4 border-b border-[#d6cfc2] flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-[#1e3a5f]">Library Members</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  {filtered.length} of {totalUsers} users
                </p>
              </div>
              <button
                onClick={openAdd}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1e3a5f] hover:bg-[#162d4a] text-white text-xs font-semibold transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Add User
              </button>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="flex flex-col items-center gap-3">
                  <RefreshCw className="w-8 h-8 text-[#1e3a5f] animate-spin" />
                  <p className="text-sm text-slate-500">Loading users...</p>
                </div>
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-16 h-16 rounded-full bg-[#f5f0e8] flex items-center justify-center mb-4">
                  <Users className="w-7 h-7 text-slate-400" />
                </div>
                <p className="text-sm font-semibold text-[#1a2a3a]">No users found</p>
                <p className="text-xs text-slate-500 mt-1">
                  {search ? "Try adjusting your search or filters" : "Add your first user to get started"}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-[#1e3a5f]/5 border-b border-[#d6cfc2]">
                      <th className="text-left px-5 py-3 text-xs font-bold text-[#1e3a5f] uppercase tracking-wider">
                        Member
                      </th>
                      <th className="text-left px-4 py-3 text-xs font-bold text-[#1e3a5f] uppercase tracking-wider hidden md:table-cell">
                        Membership No.
                      </th>
                      <th className="text-left px-4 py-3 text-xs font-bold text-[#1e3a5f] uppercase tracking-wider">
                        Role
                      </th>
                      <th className="text-left px-4 py-3 text-xs font-bold text-[#1e3a5f] uppercase tracking-wider">
                        Status
                      </th>
                      <th className="text-left px-4 py-3 text-xs font-bold text-[#1e3a5f] uppercase tracking-wider hidden lg:table-cell">
                        Joined
                      </th>
                      <th className="text-right px-5 py-3 text-xs font-bold text-[#1e3a5f] uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#d6cfc2]/60">
                    <AnimatePresence>
                      {filtered.map((u, idx) => (
                        <motion.tr
                          key={u.id}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.2, delay: idx * 0.03 }}
                          className="hover:bg-[#f5f0e8]/60 transition-colors group"
                        >
                          {/* Member cell */}
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-3">
                              <div
                                className={cn(
                                  "w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 shadow-sm",
                                  getAvatarColor(u.full_name)
                                )}
                              >
                                {getInitials(u.full_name)}
                              </div>
                              <div className="min-w-0">
                                <p className="text-sm font-semibold text-[#1a2a3a] truncate">
                                  {u.full_name}
                                </p>
                                <p className="text-xs text-slate-500 truncate">{u.email}</p>
                              </div>
                            </div>
                          </td>

                          {/* Membership number */}
                          <td className="px-4 py-3.5 hidden md:table-cell">
                            <span className="text-xs font-mono text-slate-600 bg-[#f5f0e8] px-2 py-1 rounded-lg">
                              {u.membership_number ?? "—"}
                            </span>
                          </td>

                          {/* Role badge */}
                          <td className="px-4 py-3.5">
                            {u.role === "admin" ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#c8a96e]/15 text-[#8a6a2e] border border-[#c8a96e]/30">
                                <Crown className="w-3 h-3" />
                                Admin
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#1e3a5f]/8 text-[#1e3a5f] border border-[#1e3a5f]/15">
                                <User className="w-3 h-3" />
                                Member
                              </span>
                            )}
                          </td>

                          {/* Status badge */}
                          <td className="px-4 py-3.5">
                            {u.is_active ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                <CheckCircle className="w-3 h-3" />
                                Active
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-600 border border-red-200">
                                <XCircle className="w-3 h-3" />
                                Inactive
                              </span>
                            )}
                          </td>

                          {/* Joined date */}
                          <td className="px-4 py-3.5 hidden lg:table-cell">
                            <span className="text-xs text-slate-500">
                              {formatDate(u.created_at)}
                            </span>
                          </td>

                          {/* Actions */}
                          <td className="px-5 py-3.5">
                            <div className="flex items-center justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => openEdit(u)}
                                className="w-8 h-8 rounded-lg bg-[#1e3a5f]/8 hover:bg-[#1e3a5f] text-[#1e3a5f] hover:text-white flex items-center justify-center transition-all"
                                title="Edit user"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => setDeleteModal(u)}
                                className="w-8 h-8 rounded-lg bg-red-50 hover:bg-red-600 text-red-500 hover:text-white flex items-center justify-center transition-all"
                                title="Delete user"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </motion.tr>
                      ))}
                    </AnimatePresence>
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </Reveal>
      </div>

      {/* ── Modals ── */}
      <UserModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingUser(null);
          setModalError(null);
        }}
        onSave={handleSave}
        initial={modalInitial}
        loading={saving}
        error={modalError}
      />

      <DeleteConfirmModal
        open={!!deleteModal}
        user={deleteModal}
        onClose={() => setDeleteModal(null)}
        onConfirm={handleDelete}
        loading={deleting}
      />
    </div>
  );
}
