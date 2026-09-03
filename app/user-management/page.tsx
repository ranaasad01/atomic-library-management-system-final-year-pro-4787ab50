"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Users, Search, Plus, Edit2, Trash2, CheckCircle, XCircle, Shield, User, Phone, Mail, MapPin, Hash, ChevronDown, AlertCircle, X, Save, RefreshCw, UserCheck, UserX } from 'lucide-react';
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
    "bg-[#1e3a5f] text-white",
    "bg-[#c8a96e] text-white",
    "bg-emerald-600 text-white",
    "bg-violet-600 text-white",
    "bg-rose-600 text-white",
    "bg-sky-600 text-white",
  ];
  const idx = name.charCodeAt(0) % colors.length;
  return colors[idx];
}

function getRoleBadge(role: string) {
  return role === "admin"
    ? "bg-[#c8a96e]/15 text-[#b8944f] border border-[#c8a96e]/40"
    : "bg-[#1e3a5f]/10 text-[#1e3a5f] border border-[#1e3a5f]/20";
}

function getStatusBadge(active: boolean) {
  return active
    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
    : "bg-red-50 text-red-600 border border-red-200";
}

// ─── StatCard ────────────────────────────────────────────────────────────────

function StatCard({
  icon: Icon,
  label,
  value,
  accent,
  sub,
}: {
  icon: React.ElementType;
  label: string;
  value: number | string;
  accent?: boolean;
  sub?: string;
}) {
  return (
    <motion.div
      whileHover={{ y: -4, boxShadow: "0 12px 40px -8px rgba(30,58,95,0.22)" }}
      transition={{ duration: 0.22, ease: "easeOut" }}
      className={cn(
        "rounded-2xl border p-5 flex items-center gap-4 transition-all duration-200",
        "shadow-[0_1px_3px_rgba(0,0,0,0.05),0_6px_20px_-6px_rgba(30,58,95,0.12)]",
        accent
          ? "bg-[#1e3a5f] border-[#1e3a5f] text-white"
          : "bg-white border-[var(--border)] text-[var(--foreground)]"
      )}
    >
      <div
        className={cn(
          "w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0",
          accent ? "bg-white/15" : "bg-[#1e3a5f]/8"
        )}
      >
        <Icon
          className={cn(
            "w-5 h-5",
            accent ? "text-[#c8a96e]" : "text-[#1e3a5f]"
          )}
        />
      </div>
      <div className="min-w-0">
        <p className={cn("text-2xl font-bold leading-none", accent ? "text-white" : "text-[#1e3a5f]")}>
          {value}
        </p>
        <p className={cn("text-xs mt-1", accent ? "text-white/70" : "text-[#5a6a7a]")}>{label}</p>
        {sub && (
          <p className={cn("text-[11px] mt-0.5", accent ? "text-white/50" : "text-[#5a6a7a]/70")}>{sub}</p>
        )}
      </div>
    </motion.div>
  );
}

// ─── UserModal ───────────────────────────────────────────────────────────────

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
  const isEdit = initial !== null && initial.email !== "";

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
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        />

        {/* Modal */}
        <motion.div
          className="relative z-10 w-full max-w-lg bg-white rounded-2xl shadow-[0_8px_60px_-12px_rgba(0,0,0,0.35)] overflow-hidden"
          initial={{ opacity: 0, scale: 0.95, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 16 }}
          transition={{ duration: 0.28, ease: "easeOut" }}
        >
          {/* Gradient Header */}
          <div className="bg-gradient-to-r from-[#1e3a5f] to-[#2a4f7c] px-6 py-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center">
                <User className="w-4 h-4 text-[#c8a96e]" />
              </div>
              <div>
                <h2 className="text-white font-semibold text-base leading-tight">
                  {isEdit ? "Edit Member" : "Add New Member"}
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
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5a6a7a]" />
                  <input
                    type="text"
                    value={form.full_name}
                    onChange={(e) => set("full_name", e.target.value)}
                    placeholder="e.g. Rao Muhammad Hamza"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--muted)]/40 text-sm text-[var(--foreground)] placeholder:text-[#5a6a7a]/60 focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/30 focus:border-[#1e3a5f] transition-all"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-semibold text-[#1e3a5f] mb-1.5 uppercase tracking-wide">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5a6a7a]" />
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => set("email", e.target.value)}
                    placeholder="member@ncbae.edu.pk"
                    disabled={isEdit}
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--muted)]/40 text-sm text-[var(--foreground)] placeholder:text-[#5a6a7a]/60 focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/30 focus:border-[#1e3a5f] transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                  />
                </div>
                {isEdit && (
                  <p className="text-[11px] text-[#5a6a7a] mt-1">Email cannot be changed after registration.</p>
                )}
              </div>

              {/* Role + Membership Number */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#1e3a5f] mb-1.5 uppercase tracking-wide">
                    Role
                  </label>
                  <div className="relative">
                    <Shield className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5a6a7a]" />
                    <select
                      value={form.role}
                      onChange={(e) => set("role", e.target.value as UserRole)}
                      className="w-full pl-9 pr-8 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--muted)]/40 text-sm text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/30 focus:border-[#1e3a5f] transition-all appearance-none"
                    >
                      <option value="member">Member</option>
                      <option value="admin">Admin</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#5a6a7a] pointer-events-none" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#1e3a5f] mb-1.5 uppercase tracking-wide">
                    Membership No.
                  </label>
                  <div className="relative">
                    <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5a6a7a]" />
                    <input
                      type="text"
                      value={form.membership_number}
                      onChange={(e) => set("membership_number", e.target.value)}
                      placeholder="LIB-2024-001"
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--muted)]/40 text-sm text-[var(--foreground)] placeholder:text-[#5a6a7a]/60 focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/30 focus:border-[#1e3a5f] transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Phone */}
              <div>
                <label className="block text-xs font-semibold text-[#1e3a5f] mb-1.5 uppercase tracking-wide">
                  Phone
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5a6a7a]" />
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => set("phone", e.target.value)}
                    placeholder="+92-300-0000000"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--muted)]/40 text-sm text-[var(--foreground)] placeholder:text-[#5a6a7a]/60 focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/30 focus:border-[#1e3a5f] transition-all"
                  />
                </div>
              </div>

              {/* Address */}
              <div>
                <label className="block text-xs font-semibold text-[#1e3a5f] mb-1.5 uppercase tracking-wide">
                  Address
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 w-4 h-4 text-[#5a6a7a]" />
                  <textarea
                    value={form.address}
                    onChange={(e) => set("address", e.target.value)}
                    placeholder="Street, City, Province"
                    rows={2}
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--muted)]/40 text-sm text-[var(--foreground)] placeholder:text-[#5a6a7a]/60 focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/30 focus:border-[#1e3a5f] transition-all resize-none"
                  />
                </div>
              </div>

              {/* Active Toggle */}
              <div className="flex items-center justify-between rounded-xl border border-[var(--border)] bg-[var(--muted)]/30 px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-[var(--foreground)]">Account Status</p>
                  <p className="text-xs text-[#5a6a7a] mt-0.5">
                    {form.is_active ? "Member can access the library system" : "Member access is suspended"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => set("is_active", !form.is_active)}
                  className={cn(
                    "relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/30 focus:ring-offset-1",
                    form.is_active ? "bg-[#1e3a5f]" : "bg-gray-300"
                  )}
                  aria-label="Toggle active status"
                >
                  <span
                    className={cn(
                      "inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform duration-200",
                      form.is_active ? "translate-x-6" : "translate-x-1"
                    )}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="px-6 py-4 bg-[var(--muted)]/40 border-t border-[var(--border)] flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-[var(--border)] bg-white text-sm font-medium text-[var(--foreground)] hover:bg-[var(--muted)] transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => onSave(form)}
              disabled={loading}
              className="px-5 py-2 rounded-xl bg-[#1e3a5f] hover:bg-[#162d4a] text-white text-sm font-semibold flex items-center gap-2 transition-colors disabled:opacity-60 shadow-[0_2px_8px_rgba(30,58,95,0.3)]"
            >
              {loading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              {loading ? "Saving..." : isEdit ? "Save Changes" : "Add Member"}
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
  name,
  onClose,
  onConfirm,
  loading,
}: {
  open: boolean;
  name: string;
  onClose: () => void;
  onConfirm: () => void;
  loading: boolean;
}) {
  if (!open) return null;
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
          className="relative z-10 w-full max-w-sm bg-white rounded-2xl shadow-[0_8px_60px_-12px_rgba(0,0,0,0.35)] overflow-hidden"
          initial={{ opacity: 0, scale: 0.95, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 12 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
        >
          <div className="bg-gradient-to-r from-red-600 to-red-500 px-6 py-5 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
              <Trash2 className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-white font-semibold text-base">Remove Member</h2>
              <p className="text-white/70 text-xs mt-0.5">This action cannot be undone</p>
            </div>
          </div>
          <div className="p-6">
            <p className="text-sm text-[var(--foreground)]">
              Are you sure you want to remove{" "}
              <span className="font-semibold text-[#1e3a5f]">{name}</span> from the library system? All associated records will be affected.
            </p>
          </div>
          <div className="px-6 py-4 bg-[var(--muted)]/40 border-t border-[var(--border)] flex items-center justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-[var(--border)] bg-white text-sm font-medium text-[var(--foreground)] hover:bg-[var(--muted)] transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={loading}
              className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-semibold flex items-center gap-2 transition-colors disabled:opacity-60"
            >
              {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              {loading ? "Removing..." : "Remove Member"}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function UserManagementPage() {
  const supabase = createClient();

  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [modalError, setModalError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");
  const [filterRole, setFilterRole] = useState<FilterRole>("all");

  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<UserProfile | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<UserProfile | null>(null);

  // ─── Data Fetching ──────────────────────────────────────────────────────────

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: fetchErr } = await supabase
        .from("users")
        .select("*")
        .order("created_at", { ascending: false });
      if (fetchErr) throw fetchErr;
      setUsers((data as UserProfile[]) ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load users.");
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // ─── Toast Helper ───────────────────────────────────────────────────────────

  function showToast(msg: string, type: "success" | "error") {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  }

  // ─── CRUD Handlers ──────────────────────────────────────────────────────────

  async function handleSave(form: FormState) {
    setSaving(true);
    setModalError(null);
    try {
      if (editTarget) {
        const { error: updateErr } = await supabase
          .from("users")
          .update({
            full_name: form.full_name,
            role: form.role,
            phone: form.phone || null,
            address: form.address || null,
            membership_number: form.membership_number || null,
            is_active: form.is_active,
            updated_at: new Date().toISOString(),
          })
          .eq("id", editTarget.id);
        if (updateErr) throw updateErr;
        showToast("Member updated successfully.", "success");
      } else {
        const { error: insertErr } = await supabase.from("users").insert({
          full_name: form.full_name,
          email: form.email,
          role: form.role,
          phone: form.phone || null,
          address: form.address || null,
          membership_number: form.membership_number || null,
          is_active: form.is_active,
        });
        if (insertErr) throw insertErr;
        showToast("Member added successfully.", "success");
      }
      setModalOpen(false);
      setEditTarget(null);
      await fetchUsers();
    } catch (err) {
      setModalError(err instanceof Error ? err.message : "Failed to save member.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const { error: deleteErr } = await supabase
        .from("users")
        .delete()
        .eq("id", deleteTarget.id);
      if (deleteErr) throw deleteErr;
      showToast("Member removed successfully.", "success");
      setDeleteTarget(null);
      await fetchUsers();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to remove member.", "error");
    } finally {
      setDeleting(false);
    }
  }

  function openAdd() {
    setEditTarget(null);
    setModalError(null);
    setModalOpen(true);
  }

  function openEdit(user: UserProfile) {
    setEditTarget(user);
    setModalError(null);
    setModalOpen(true);
  }

  // ─── Filtered Users ─────────────────────────────────────────────────────────

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

  // ─── Stats ──────────────────────────────────────────────────────────────────

  const totalMembers = users.length;
  const activeMembers = users.filter((u) => u.is_active).length;
  const adminCount = users.filter((u) => u.role === "admin").length;
  const inactiveCount = users.filter((u) => !u.is_active).length;

  // ─── Modal initial form ─────────────────────────────────────────────────────

  const modalInitial: FormState | null = editTarget
    ? {
        full_name: editTarget.full_name,
        email: editTarget.email,
        role: editTarget.role as UserRole,
        phone: editTarget.phone ?? "",
        address: editTarget.address ?? "",
        membership_number: editTarget.membership_number ?? "",
        is_active: editTarget.is_active,
      }
    : null;

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* ── Page Header ── */}
      <div className="bg-gradient-to-r from-[#1e3a5f] via-[#1e3a5f] to-[#2a4f7c] border-b border-[#1e3a5f]/20">
        <div className="container-lms py-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center flex-shrink-0">
                <Users className="w-6 h-6 text-[#c8a96e]" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white tracking-tight">User Management</h1>
                <p className="text-white/60 text-sm mt-0.5">
                  {totalMembers} member{totalMembers !== 1 ? "s" : ""} registered
                  {activeMembers !== totalMembers && (
                    <span className="ml-2 text-white/40">&bull; {activeMembers} active</span>
                  )}
                </p>
              </div>
            </div>
            <button
              onClick={openAdd}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#c8a96e] hover:bg-[#b8944f] text-white font-semibold text-sm transition-all duration-200 shadow-[0_2px_12px_rgba(200,169,110,0.4)] hover:shadow-[0_4px_20px_rgba(200,169,110,0.5)] hover:-translate-y-0.5"
            >
              <Plus className="w-4 h-4" />
              Add Member
            </button>
          </div>
        </div>
      </div>

      <div className="container-lms py-8 space-y-6">
        {/* ── Stats ── */}
        <Reveal>
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-2 lg:grid-cols-4 gap-4"
          >
            <motion.div variants={fadeInUp}>
              <StatCard icon={Users} label="Total Members" value={totalMembers} accent />
            </motion.div>
            <motion.div variants={fadeInUp}>
              <StatCard icon={UserCheck} label="Active Members" value={activeMembers} />
            </motion.div>
            <motion.div variants={fadeInUp}>
              <StatCard icon={Shield} label="Administrators" value={adminCount} />
            </motion.div>
            <motion.div variants={fadeInUp}>
              <StatCard icon={UserX} label="Inactive Accounts" value={inactiveCount} />
            </motion.div>
          </motion.div>
        </Reveal>

        {/* ── Filters ── */}
        <Reveal>
          <div className="bg-white rounded-2xl border border-[var(--border)] shadow-[0_1px_3px_rgba(0,0,0,0.05),0_4px_16px_-4px_rgba(30,58,95,0.08)] p-4">
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Search */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5a6a7a]" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by name, email, or membership number..."
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--muted)]/50 text-sm text-[var(--foreground)] placeholder:text-[#5a6a7a]/60 focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/25 focus:border-[#1e3a5f] transition-all"
                />
              </div>

              {/* Status Filter */}
              <div className="relative">
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value as FilterStatus)}
                  className="pl-3 pr-8 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--muted)]/50 text-sm text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/25 focus:border-[#1e3a5f] transition-all appearance-none cursor-pointer"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#5a6a7a] pointer-events-none" />
              </div>

              {/* Role Filter */}
              <div className="relative">
                <select
                  value={filterRole}
                  onChange={(e) => setFilterRole(e.target.value as FilterRole)}
                  className="pl-3 pr-8 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--muted)]/50 text-sm text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/25 focus:border-[#1e3a5f] transition-all appearance-none cursor-pointer"
                >
                  <option value="all">All Roles</option>
                  <option value="member">Member</option>
                  <option value="admin">Admin</option>
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#5a6a7a] pointer-events-none" />
              </div>

              {/* Refresh */}
              <button
                onClick={fetchUsers}
                disabled={loading}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[var(--border)] bg-white hover:bg-[var(--muted)] text-sm font-medium text-[var(--foreground)] transition-colors disabled:opacity-50"
                title="Refresh"
              >
                <RefreshCw className={cn("w-4 h-4 text-[#5a6a7a]", loading && "animate-spin")} />
                <span className="hidden sm:inline">Refresh</span>
              </button>
            </div>
          </div>
        </Reveal>

        {/* ── Error Banner ── */}
        {error && (
          <div className="flex items-center gap-3 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}

        {/* ── Users Table ── */}
        <Reveal>
          <div className="bg-white rounded-2xl border border-[var(--border)] shadow-[0_1px_3px_rgba(0,0,0,0.05),0_8px_32px_-8px_rgba(30,58,95,0.10)] overflow-hidden">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3">
                <RefreshCw className="w-8 h-8 text-[#1e3a5f]/30 animate-spin" />
                <p className="text-sm text-[#5a6a7a]">Loading members...</p>
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3">
                <div className="w-14 h-14 rounded-2xl bg-[var(--muted)] flex items-center justify-center">
                  <Users className="w-7 h-7 text-[#5a6a7a]/50" />
                </div>
                <p className="text-sm font-medium text-[var(--foreground)]">No members found</p>
                <p className="text-xs text-[#5a6a7a]">
                  {search || filterStatus !== "all" || filterRole !== "all"
                    ? "Try adjusting your filters"
                    : "Add your first library member to get started"}
                </p>
                {!search && filterStatus === "all" && filterRole === "all" && (
                  <button
                    onClick={openAdd}
                    className="mt-2 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#1e3a5f] text-white text-sm font-medium hover:bg-[#162d4a] transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Add First Member
                  </button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[var(--border)] bg-[var(--muted)]/50">
                      <th className="text-left px-5 py-3.5 text-xs font-semibold text-[#5a6a7a] uppercase tracking-wide">Member</th>
                      <th className="text-left px-4 py-3.5 text-xs font-semibold text-[#5a6a7a] uppercase tracking-wide hidden md:table-cell">Membership No.</th>
                      <th className="text-left px-4 py-3.5 text-xs font-semibold text-[#5a6a7a] uppercase tracking-wide">Role</th>
                      <th className="text-left px-4 py-3.5 text-xs font-semibold text-[#5a6a7a] uppercase tracking-wide">Status</th>
                      <th className="text-left px-4 py-3.5 text-xs font-semibold text-[#5a6a7a] uppercase tracking-wide hidden lg:table-cell">Joined</th>
                      <th className="text-right px-5 py-3.5 text-xs font-semibold text-[#5a6a7a] uppercase tracking-wide">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border)]">
                    {filtered.map((user) => (
                      <motion.tr
                        key={user.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="group hover:bg-[var(--muted)]/30 transition-colors duration-150"
                      >
                        {/* Member Info */}
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div
                              className={cn(
                                "w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold flex-shrink-0",
                                getAvatarColor(user.full_name)
                              )}
                            >
                              {getInitials(user.full_name)}
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-[var(--foreground)] truncate">{user.full_name}</p>
                              <p className="text-xs text-[#5a6a7a] truncate">{user.email}</p>
                            </div>
                          </div>
                        </td>

                        {/* Membership No */}
                        <td className="px-4 py-4 hidden md:table-cell">
                          <span className="text-sm text-[var(--foreground)] font-mono">
                            {user.membership_number ?? (
                              <span className="text-[#5a6a7a]/50 italic text-xs">Not assigned</span>
                            )}
                          </span>
                        </td>

                        {/* Role */}
                        <td className="px-4 py-4">
                          <span
                            className={cn(
                              "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold",
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

                        {/* Status */}
                        <td className="px-4 py-4">
                          <span
                            className={cn(
                              "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold",
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

                        {/* Joined */}
                        <td className="px-4 py-4 hidden lg:table-cell">
                          <span className="text-sm text-[#5a6a7a]">{formatDate(user.created_at)}</span>
                        </td>

                        {/* Actions */}
                        <td className="px-5 py-4">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => openEdit(user)}
                              title="Edit member"
                              className="w-8 h-8 rounded-lg border border-[var(--border)] bg-white hover:bg-[#1e3a5f] hover:border-[#1e3a5f] hover:text-white text-[#5a6a7a] flex items-center justify-center transition-all duration-150 group/btn"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setDeleteTarget(user)}
                              title="Remove member"
                              className="w-8 h-8 rounded-lg border border-[var(--border)] bg-white hover:bg-red-600 hover:border-red-600 hover:text-white text-[#5a6a7a] flex items-center justify-center transition-all duration-150"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>

                {/* Table Footer */}
                <div className="px-5 py-3 border-t border-[var(--border)] bg-[var(--muted)]/30 flex items-center justify-between">
                  <p className="text-xs text-[#5a6a7a]">
                    Showing <span className="font-semibold text-[var(--foreground)]">{filtered.length}</span> of{" "}
                    <span className="font-semibold text-[var(--foreground)]">{users.length}</span> members
                  </p>
                  {(search || filterStatus !== "all" || filterRole !== "all") && (
                    <button
                      onClick={() => {
                        setSearch("");
                        setFilterStatus("all");
                        setFilterRole("all");
                      }}
                      className="text-xs text-[#1e3a5f] hover:underline font-medium"
                    >
                      Clear filters
                    </button>
                  )}
                </div>
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
          setEditTarget(null);
          setModalError(null);
        }}
        onSave={handleSave}
        initial={modalInitial}
        loading={saving}
        error={modalError}
      />

      <DeleteConfirmModal
        open={deleteTarget !== null}
        name={deleteTarget?.full_name ?? ""}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleting}
      />

      {/* ── Toast ── */}
      <AnimatePresence>
        {toast && (
          <motion.div
            key="toast"
            initial={{ opacity: 0, y: 24, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.95 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className={cn(
              "fixed bottom-6 right-6 z-[60] flex items-center gap-3 rounded-2xl px-5 py-3.5 text-sm font-medium shadow-[0_8px_32px_-8px_rgba(0,0,0,0.25)] border",
              toast.type === "success"
                ? "bg-white border-emerald-200 text-emerald-700"
                : "bg-white border-red-200 text-red-700"
            )}
          >
            {toast.type === "success" ? (
              <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
            )}
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
