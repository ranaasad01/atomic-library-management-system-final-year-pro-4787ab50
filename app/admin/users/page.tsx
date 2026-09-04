"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Users, Search, Plus, Edit2, Trash2, CheckCircle, XCircle, Shield, User, Phone, Mail, MapPin, Hash, AlertCircle, X, Save, RefreshCw, Crown, ChevronDown, UserCheck, UserX, ToggleLeft, ToggleRight, ChevronRight, BookOpen } from 'lucide-react';
import { Reveal } from "@/components/Reveal";
import { fadeInUp, staggerContainer, scaleIn, modalVariants, overlayVariants } from "@/lib/motion";
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
      whileHover={{ y: -3, boxShadow: "0 12px 40px -8px rgba(30,58,95,0.18)" }}
      transition={{ duration: 0.22, ease: "easeOut" }}
      className="bg-white rounded-2xl border border-[#d6cfc2] p-5 flex items-center gap-4 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_4px_16px_-4px_rgba(0,0,0,0.08)] cursor-default"
    >
      <div
        className={cn(
          "w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0",
          iconBg
        )}
      >
        <Icon className={cn("w-5 h-5", iconColor)} />
      </div>
      <div>
        <p className="text-2xl font-bold text-[#1e3a5f] leading-none tracking-tight">
          {value}
        </p>
        <p className="text-xs text-slate-500 mt-1 font-medium">{label}</p>
      </div>
    </motion.div>
  );
}

// ─── Loading Skeleton ─────────────────────────────────────────────────────────

function TableSkeleton() {
  return (
    <>
      {Array.from({ length: 6 }).map((_, i) => (
        <tr key={i} className="border-b border-[#ede8df]">
          <td className="px-5 py-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-slate-200 animate-pulse" />
              <div className="space-y-1.5">
                <div className="h-3.5 w-32 bg-slate-200 rounded animate-pulse" />
                <div className="h-3 w-20 bg-slate-100 rounded animate-pulse" />
              </div>
            </div>
          </td>
          <td className="px-5 py-4">
            <div className="h-3.5 w-40 bg-slate-200 rounded animate-pulse" />
          </td>
          <td className="px-5 py-4">
            <div className="h-6 w-16 bg-slate-200 rounded-full animate-pulse" />
          </td>
          <td className="px-5 py-4">
            <div className="h-3.5 w-24 bg-slate-200 rounded animate-pulse" />
          </td>
          <td className="px-5 py-4">
            <div className="h-3.5 w-24 bg-slate-200 rounded animate-pulse" />
          </td>
          <td className="px-5 py-4">
            <div className="h-6 w-16 bg-slate-200 rounded-full animate-pulse" />
          </td>
          <td className="px-5 py-4">
            <div className="h-3.5 w-20 bg-slate-200 rounded animate-pulse" />
          </td>
          <td className="px-5 py-4">
            <div className="flex gap-2">
              <div className="h-8 w-8 bg-slate-200 rounded-lg animate-pulse" />
              <div className="h-8 w-8 bg-slate-200 rounded-lg animate-pulse" />
              <div className="h-8 w-8 bg-slate-200 rounded-lg animate-pulse" />
            </div>
          </td>
        </tr>
      ))}
    </>
  );
}

// ─── Form Field ──────────────────────────────────────────────────────────────

function FormField({
  label,
  icon: Icon,
  required,
  children,
}: {
  label: string;
  icon?: React.ElementType;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-[#1e3a5f]">
        {Icon && <Icon className="h-3.5 w-3.5 text-[#c8a96e]" />}
        {label}
        {required && <span className="text-red-500">*</span>}
      </label>
      {children}
    </div>
  );
}

const inputCls =
  "w-full rounded-xl border border-[#d6cfc2] bg-[#f5f0e8]/60 px-3.5 py-2.5 text-sm text-[#1a2a3a] placeholder:text-slate-400 transition-all duration-200 focus:border-[#1e3a5f] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/10 disabled:opacity-60 disabled:cursor-not-allowed";

// ─── User Form Modal ──────────────────────────────────────────────────────────

function UserModal({
  open,
  onClose,
  onSave,
  initial,
  mode,
  saving,
  error,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (form: FormState) => Promise<void>;
  initial: FormState | null;
  mode: "add" | "edit";
  saving: boolean;
  error: string | null;
}) {
  const [form, setForm] = useState<FormState>(initial ?? EMPTY_FORM);
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    setForm(initial ?? EMPTY_FORM);
    setLocalError(null);
  }, [initial, open]);

  function set<K extends keyof FormState>(key: K, val: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: val }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLocalError(null);
    if (!form.full_name.trim()) {
      setLocalError("Full name is required.");
      return;
    }
    if (!form.email.trim()) {
      setLocalError("Email is required.");
      return;
    }
    await onSave(form);
  }

  const displayError = localError ?? error;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-[#1a2a3a]/60 backdrop-blur-sm"
            variants={overlayVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            className="relative z-10 w-full max-w-lg bg-white rounded-2xl shadow-[0_8px_40px_-8px_rgba(30,58,95,0.28)] border border-[#d6cfc2] overflow-hidden"
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
          >
            {/* Header */}
            <div
              className="px-6 py-5 flex items-center justify-between"
              style={{
                background:
                  "linear-gradient(135deg, #1e3a5f 0%, #2a4f7c 100%)",
              }}
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center">
                  {mode === "add" ? (
                    <Plus className="w-5 h-5 text-white" />
                  ) : (
                    <Edit2 className="w-5 h-5 text-white" />
                  )}
                </div>
                <div>
                  <h2 className="text-base font-bold text-white leading-tight">
                    {mode === "add" ? "Add New Member" : "Edit Member"}
                  </h2>
                  <p className="text-white/60 text-xs mt-0.5">
                    User Collection — LMS Database Module
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4 text-white" />
              </button>
            </div>

            {/* Body */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              {displayError && (
                <div className="flex items-center gap-2.5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {displayError}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <FormField label="Full Name" icon={User} required>
                    <input
                      className={inputCls}
                      placeholder="e.g. Rao Muhammad Hamza"
                      value={form.full_name}
                      onChange={(e) => set("full_name", e.target.value)}
                    />
                  </FormField>
                </div>

                <div className="sm:col-span-2">
                  <FormField label="Email Address" icon={Mail} required>
                    <input
                      type="email"
                      className={inputCls}
                      placeholder="member@ncbae.edu.pk"
                      value={form.email}
                      onChange={(e) => set("email", e.target.value)}
                      disabled={mode === "edit"}
                    />
                    {mode === "edit" && (
                      <p className="text-xs text-slate-400 mt-1">
                        Email cannot be changed after registration.
                      </p>
                    )}
                  </FormField>
                </div>

                <FormField label="Role" icon={Shield}>
                  <div className="relative">
                    <select
                      className={cn(inputCls, "appearance-none pr-9")}
                      value={form.role}
                      onChange={(e) => set("role", e.target.value as UserRole)}
                    >
                      <option value="member">Member</option>
                      <option value="admin">Admin</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  </div>
                </FormField>

                <FormField label="Phone" icon={Phone}>
                  <input
                    className={inputCls}
                    placeholder="+92 300 0000000"
                    value={form.phone}
                    onChange={(e) => set("phone", e.target.value)}
                  />
                </FormField>

                <div className="sm:col-span-2">
                  <FormField label="Address" icon={MapPin}>
                    <input
                      className={inputCls}
                      placeholder="Street, City, Pakistan"
                      value={form.address}
                      onChange={(e) => set("address", e.target.value)}
                    />
                  </FormField>
                </div>

                <FormField label="Membership Number" icon={Hash}>
                  <input
                    className={inputCls}
                    placeholder="LIB-0001"
                    value={form.membership_number}
                    onChange={(e) => set("membership_number", e.target.value)}
                  />
                  <p className="text-xs text-slate-400 mt-1">Format: LIB-XXXX</p>
                </FormField>

                <FormField label="Account Status" icon={CheckCircle}>
                  <button
                    type="button"
                    onClick={() => set("is_active", !form.is_active)}
                    className={cn(
                      "flex items-center gap-2.5 rounded-xl border px-3.5 py-2.5 text-sm font-medium transition-all duration-200",
                      form.is_active
                        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                        : "border-red-200 bg-red-50 text-red-700"
                    )}
                  >
                    {form.is_active ? (
                      <ToggleRight className="w-5 h-5" />
                    ) : (
                      <ToggleLeft className="w-5 h-5" />
                    )}
                    {form.is_active ? "Active" : "Inactive"}
                  </button>
                </FormField>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-end gap-3 pt-2 border-t border-[#ede8df]">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl border border-[#d6cfc2] bg-white text-sm font-medium text-[#1a2a3a] hover:bg-[#f5f0e8] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all duration-200 disabled:opacity-60"
                  style={{
                    background: saving
                      ? "#9ca3af"
                      : "linear-gradient(135deg, #c8a96e 0%, #b8944f 100%)",
                  }}
                >
                  {saving ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  {saving ? "Saving..." : mode === "add" ? "Add Member" : "Save Changes"}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── Delete Confirmation Modal ────────────────────────────────────────────────

function DeleteModal({
  open,
  onClose,
  onConfirm,
  userName,
  deleting,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  userName: string;
  deleting: boolean;
}) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="absolute inset-0 bg-[#1a2a3a]/60 backdrop-blur-sm"
            variants={overlayVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            onClick={onClose}
          />
          <motion.div
            className="relative z-10 w-full max-w-sm bg-white rounded-2xl shadow-[0_8px_40px_-8px_rgba(30,58,95,0.28)] border border-[#d6cfc2] overflow-hidden"
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
          >
            <div className="p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-xl bg-red-50 border border-red-200 flex items-center justify-center flex-shrink-0">
                  <Trash2 className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#1e3a5f]">Delete Member</h3>
                  <p className="text-xs text-slate-500 mt-0.5">This action cannot be undone</p>
                </div>
              </div>

              <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 mb-5">
                <p className="text-sm text-amber-800">
                  You are about to permanently delete{" "}
                  <span className="font-semibold">{userName}</span>. All associated
                  records including transactions and fines may be affected.
                </p>
              </div>

              <div className="flex items-center justify-end gap-3">
                <button
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl border border-[#d6cfc2] bg-white text-sm font-medium text-[#1a2a3a] hover:bg-[#f5f0e8] transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={onConfirm}
                  disabled={deleting}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-sm font-semibold text-white transition-colors disabled:opacity-60"
                >
                  {deleting ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                  {deleting ? "Deleting..." : "Delete Member"}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
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
  const [modalError, setModalError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState<FilterRole>("all");
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletingUser, setDeletingUser] = useState<UserProfile | null>(null);

  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  // ── Fetch ──────────────────────────────────────────────────────────────────

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      setUsers(data ?? []);
    } catch (err) {
      console.error("Failed to fetch users:", err);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // ── Toast ──────────────────────────────────────────────────────────────────

  function showToast(msg: string, type: "success" | "error") {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  }

  // ── Derived stats ──────────────────────────────────────────────────────────

  const totalMembers = users.length;
  const activeMembers = users.filter((u) => u.is_active).length;
  const adminUsers = users.filter((u) => u.role === "admin").length;
  const inactiveMembers = users.filter((u) => !u.is_active).length;

  // ── Filtered list ──────────────────────────────────────────────────────────

  const filtered = users.filter((u) => {
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      u.full_name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      (u.membership_number ?? "").toLowerCase().includes(q);
    const matchRole = filterRole === "all" || u.role === filterRole;
    const matchStatus =
      filterStatus === "all" ||
      (filterStatus === "active" && u.is_active) ||
      (filterStatus === "inactive" && !u.is_active);
    return matchSearch && matchRole && matchStatus;
  });

  // ── CRUD ───────────────────────────────────────────────────────────────────

  async function handleSave(form: FormState) {
    setSaving(true);
    setModalError(null);
    try {
      if (modalMode === "add") {
        const { error } = await supabase.from("users").insert([
          {
            full_name: form.full_name.trim(),
            email: form.email.trim(),
            role: form.role,
            phone: form.phone.trim() || null,
            address: form.address.trim() || null,
            membership_number: form.membership_number.trim() || null,
            is_active: form.is_active,
          },
        ]);
        if (error) throw error;
        showToast("Member added successfully.", "success");
      } else if (editingUser) {
        const { error } = await supabase
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
        if (error) throw error;
        showToast("Member updated successfully.", "success");
      }
      setModalOpen(false);
      setEditingUser(null);
      await fetchUsers();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "An error occurred.";
      setModalError(msg);
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleActive(user: UserProfile) {
    try {
      const { error } = await supabase
        .from("users")
        .update({ is_active: !user.is_active, updated_at: new Date().toISOString() })
        .eq("id", user.id);
      if (error) throw error;
      showToast(
        `${user.full_name} marked as ${!user.is_active ? "active" : "inactive"}.`,
        "success"
      );
      await fetchUsers();
    } catch (err) {
      console.error(err);
      showToast("Failed to update status.", "error");
    }
  }

  async function handleDelete() {
    if (!deletingUser) return;
    setDeleting(true);
    try {
      const { error } = await supabase
        .from("users")
        .delete()
        .eq("id", deletingUser.id);
      if (error) throw error;
      showToast("Member deleted.", "success");
      setDeleteOpen(false);
      setDeletingUser(null);
      await fetchUsers();
    } catch (err) {
      console.error(err);
      showToast("Failed to delete member.", "error");
    } finally {
      setDeleting(false);
    }
  }

  function openAdd() {
    setModalMode("add");
    setEditingUser(null);
    setModalError(null);
    setModalOpen(true);
  }

  function openEdit(user: UserProfile) {
    setModalMode("edit");
    setEditingUser(user);
    setModalError(null);
    setModalOpen(true);
  }

  function openDelete(user: UserProfile) {
    setDeletingUser(user);
    setDeleteOpen(true);
  }

  const editForm: FormState | null = editingUser
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

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[#f5f0e8]">
      {/* ── Page Header ─────────────────────────────────────────────────── */}
      <div
        className="relative overflow-hidden"
        style={{
          background: "linear-gradient(135deg, #0f1f33 0%, #1e3a5f 50%, #2a4f7c 100%)",
        }}
      >
        {/* Decorative glow */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div
            className="absolute -top-32 -right-32 w-80 h-80 rounded-full opacity-10"
            style={{ background: "radial-gradient(circle, #c8a96e, transparent)" }}
          />
          <div
            className="absolute -bottom-16 -left-16 w-64 h-64 rounded-full opacity-5"
            style={{ background: "radial-gradient(circle, #ffffff, transparent)" }}
          />
        </div>

        <div className="container-lms relative py-10">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-white/50 text-xs font-medium mb-4">
            <BookOpen className="w-3.5 h-3.5" />
            <span>Admin Panel</span>
            <ChevronRight className="w-3 h-3" />
            <span className="text-[#c8a96e]">User Management</span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-5">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
                User Management
              </h1>
              <p className="text-white/60 text-sm mt-1.5 max-w-lg">
                Manage library members, roles, and access control —{" "}
                <span className="text-[#c8a96e]/80">
                  User Collection · LMS Database Module (Chapter 5)
                </span>
              </p>
            </div>
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={openAdd}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-[#1a2a3a] shadow-lg flex-shrink-0 transition-all duration-200"
              style={{
                background: "linear-gradient(135deg, #c8a96e 0%, #b8944f 100%)",
                boxShadow: "0 4px 20px rgba(200,169,110,0.4)",
              }}
            >
              <Plus className="w-4 h-4" />
              Add New Member
            </motion.button>
          </div>

          {/* Stats row */}
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8"
          >
            {[
              {
                icon: Users,
                label: "Total Members",
                value: totalMembers,
                iconBg: "bg-white/10",
                iconColor: "text-white",
                border: "border-white/10",
              },
              {
                icon: UserCheck,
                label: "Active Members",
                value: activeMembers,
                iconBg: "bg-emerald-500/20",
                iconColor: "text-emerald-300",
                border: "border-emerald-500/20",
              },
              {
                icon: Crown,
                label: "Admin Users",
                value: adminUsers,
                iconBg: "bg-[#c8a96e]/20",
                iconColor: "text-[#c8a96e]",
                border: "border-[#c8a96e]/20",
              },
              {
                icon: UserX,
                label: "Inactive Members",
                value: inactiveMembers,
                iconBg: "bg-red-500/20",
                iconColor: "text-red-300",
                border: "border-red-500/20",
              },
            ].map((s) => (
              <motion.div
                key={s.label}
                variants={fadeInUp}
                className={cn(
                  "flex items-center gap-3 rounded-xl border px-4 py-3 bg-white/5 backdrop-blur-sm",
                  s.border
                )}
              >
                <div
                  className={cn(
                    "w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0",
                    s.iconBg
                  )}
                >
                  <s.icon className={cn("w-4 h-4", s.iconColor)} />
                </div>
                <div>
                  <p className="text-xl font-bold text-white leading-none">{s.value}</p>
                  <p className="text-white/50 text-xs mt-0.5">{s.label}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* ── Main Content ─────────────────────────────────────────────────── */}
      <div className="container-lms py-8 space-y-6">
        {/* Search & Filter Bar */}
        <Reveal>
          <div className="bg-white rounded-2xl border border-[#d6cfc2] shadow-[0_1px_2px_rgba(0,0,0,0.04),0_4px_16px_-4px_rgba(0,0,0,0.08)] p-4">
            <div className="flex flex-col md:flex-row gap-3">
              {/* Search */}
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by name, email, or membership number..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#d6cfc2] bg-[#f5f0e8]/60 text-sm text-[#1a2a3a] placeholder:text-slate-400 focus:border-[#1e3a5f] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/10 transition-all duration-200"
                />
              </div>

              {/* Role filter */}
              <div className="relative">
                <Shield className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <select
                  value={filterRole}
                  onChange={(e) => setFilterRole(e.target.value as FilterRole)}
                  className="pl-9 pr-8 py-2.5 rounded-xl border border-[#d6cfc2] bg-[#f5f0e8]/60 text-sm text-[#1a2a3a] focus:border-[#1e3a5f] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/10 transition-all duration-200 appearance-none cursor-pointer"
                >
                  <option value="all">All Roles</option>
                  <option value="member">Member</option>
                  <option value="admin">Admin</option>
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
              </div>

              {/* Status filter */}
              <div className="relative">
                <CheckCircle className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value as FilterStatus)}
                  className="pl-9 pr-8 py-2.5 rounded-xl border border-[#d6cfc2] bg-[#f5f0e8]/60 text-sm text-[#1a2a3a] focus:border-[#1e3a5f] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/10 transition-all duration-200 appearance-none cursor-pointer"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
              </div>

              {/* Refresh */}
              <button
                onClick={fetchUsers}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[#d6cfc2] bg-white text-sm font-medium text-[#1e3a5f] hover:bg-[#f5f0e8] transition-colors"
              >
                <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
                Refresh
              </button>
            </div>

            {/* Results count */}
            <div className="mt-3 flex items-center gap-2">
              <span className="text-xs text-slate-500">
                Showing{" "}
                <span className="font-semibold text-[#1e3a5f]">{filtered.length}</span>{" "}
                of{" "}
                <span className="font-semibold text-[#1e3a5f]">{totalMembers}</span>{" "}
                members
              </span>
              {(search || filterRole !== "all" || filterStatus !== "all") && (
                <button
                  onClick={() => {
                    setSearch("");
                    setFilterRole("all");
                    setFilterStatus("all");
                  }}
                  className="text-xs text-[#c8a96e] hover:text-[#b8944f] font-medium transition-colors"
                >
                  Clear filters
                </button>
              )}
            </div>
          </div>
        </Reveal>

        {/* Users Table */}
        <Reveal>
          <div className="bg-white rounded-2xl border border-[#d6cfc2] shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_-8px_rgba(0,0,0,0.10)] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr
                    className="border-b border-[#ede8df]"
                    style={{ background: "linear-gradient(135deg, #f5f0e8 0%, #ede8df 100%)" }}
                  >
                    {[
                      "Member",
                      "Email",
                      "Role",
                      "Membership No.",
                      "Phone",
                      "Status",
                      "Joined",
                      "Actions",
                    ].map((col) => (
                      <th
                        key={col}
                        className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-[#1e3a5f]"
                      >
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <TableSkeleton />
                  ) : filtered.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-5 py-16 text-center">
                        <div className="flex flex-col items-center gap-3">
                          <div className="w-14 h-14 rounded-2xl bg-[#f5f0e8] border border-[#d6cfc2] flex items-center justify-center">
                            <Users className="w-6 h-6 text-slate-400" />
                          </div>
                          <p className="text-sm font-semibold text-[#1e3a5f]">
                            {search || filterRole !== "all" || filterStatus !== "all"
                              ? "No members match your filters"
                              : "No members found"}
                          </p>
                          <p className="text-xs text-slate-400">
                            {search || filterRole !== "all" || filterStatus !== "all"
                              ? "Try adjusting your search or filters."
                              : "Add your first library member to get started."}
                          </p>
                          {!(search || filterRole !== "all" || filterStatus !== "all") && (
                            <button
                              onClick={openAdd}
                              className="mt-1 flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white"
                              style={{
                                background:
                                  "linear-gradient(135deg, #c8a96e 0%, #b8944f 100%)",
                              }}
                            >
                              <Plus className="w-4 h-4" />
                              Add First Member
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filtered.map((user) => (
                      <motion.tr
                        key={user.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="border-b border-[#ede8df] hover:bg-[#faf8f4] transition-colors duration-150 group"
                      >
                        {/* Member */}
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div
                              className={cn(
                                "w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0",
                                getAvatarColor(user.full_name)
                              )}
                            >
                              {getInitials(user.full_name)}
                            </div>
                            <div>
                              <div className="flex items-center gap-1.5">
                                {user.role === "admin" ? (
                                  <Crown className="w-3.5 h-3.5 text-[#c8a96e]" />
                                ) : (
                                  <User className="w-3.5 h-3.5 text-slate-400" />
                                )}
                                <span className="text-sm font-semibold text-[#1e3a5f]">
                                  {user.full_name}
                                </span>
                              </div>
                              <p className="text-xs text-slate-400 mt-0.5">
                                ID: {user.id.slice(0, 8)}...
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Email */}
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-1.5">
                            <Mail className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                            <span className="text-sm text-[#1a2a3a]">{user.email}</span>
                          </div>
                        </td>

                        {/* Role */}
                        <td className="px-5 py-4">
                          {user.role === "admin" ? (
                            <span className="inline-flex items-center gap-1.5 rounded-full border border-[#c8a96e]/40 bg-[#1e3a5f] px-2.5 py-1 text-xs font-semibold text-[#c8a96e]">
                              <Crown className="w-3 h-3" />
                              Admin
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
                              <User className="w-3 h-3" />
                              Member
                            </span>
                          )}
                        </td>

                        {/* Membership No. */}
                        <td className="px-5 py-4">
                          {user.membership_number ? (
                            <div className="flex items-center gap-1.5">
                              <Hash className="w-3.5 h-3.5 text-slate-400" />
                              <span className="text-sm font-mono text-[#1a2a3a]">
                                {user.membership_number}
                              </span>
                            </div>
                          ) : (
                            <span className="text-xs text-slate-400 italic">Not assigned</span>
                          )}
                        </td>

                        {/* Phone */}
                        <td className="px-5 py-4">
                          {user.phone ? (
                            <div className="flex items-center gap-1.5">
                              <Phone className="w-3.5 h-3.5 text-slate-400" />
                              <span className="text-sm text-[#1a2a3a]">{user.phone}</span>
                            </div>
                          ) : (
                            <span className="text-xs text-slate-400 italic">N/A</span>
                          )}
                        </td>

                        {/* Status */}
                        <td className="px-5 py-4">
                          {user.is_active ? (
                            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                              Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 rounded-full border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700">
                              <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                              Inactive
                            </span>
                          )}
                        </td>

                        {/* Joined */}
                        <td className="px-5 py-4">
                          <span className="text-sm text-slate-500">
                            {formatDate(user.created_at)}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-1.5">
                            {/* Edit */}
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => openEdit(user)}
                              title="Edit member"
                              className="w-8 h-8 rounded-lg border border-[#d6cfc2] bg-white hover:bg-[#1e3a5f] hover:border-[#1e3a5f] hover:text-white text-[#1e3a5f] flex items-center justify-center transition-all duration-200"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </motion.button>

                            {/* Toggle active */}
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => handleToggleActive(user)}
                              title={user.is_active ? "Deactivate" : "Activate"}
                              className={cn(
                                "w-8 h-8 rounded-lg border flex items-center justify-center transition-all duration-200",
                                user.is_active
                                  ? "border-amber-200 bg-amber-50 text-amber-600 hover:bg-amber-500 hover:border-amber-500 hover:text-white"
                                  : "border-emerald-200 bg-emerald-50 text-emerald-600 hover:bg-emerald-500 hover:border-emerald-500 hover:text-white"
                              )}
                            >
                              {user.is_active ? (
                                <ToggleRight className="w-3.5 h-3.5" />
                              ) : (
                                <ToggleLeft className="w-3.5 h-3.5" />
                              )}
                            </motion.button>

                            {/* Delete */}
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => openDelete(user)}
                              title="Delete member"
                              className="w-8 h-8 rounded-lg border border-red-200 bg-red-50 text-red-600 hover:bg-red-600 hover:border-red-600 hover:text-white flex items-center justify-center transition-all duration-200"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </motion.button>
                          </div>
                        </td>
                      </motion.tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Table footer */}
            {!loading && filtered.length > 0 && (
              <div className="px-5 py-3 border-t border-[#ede8df] bg-[#faf8f4] flex items-center justify-between">
                <p className="text-xs text-slate-500">
                  {filtered.length} member{filtered.length !== 1 ? "s" : ""} displayed
                </p>
                <p className="text-xs text-slate-400">
                  Membership format: <span className="font-mono font-medium text-[#1e3a5f]">LIB-XXXX</span>
                </p>
              </div>
            )}
          </div>
        </Reveal>
      </div>

      {/* ── Modals ───────────────────────────────────────────────────────── */}
      <UserModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingUser(null);
          setModalError(null);
        }}
        onSave={handleSave}
        initial={editForm}
        mode={modalMode}
        saving={saving}
        error={modalError}
      />

      <DeleteModal
        open={deleteOpen}
        onClose={() => {
          setDeleteOpen(false);
          setDeletingUser(null);
        }}
        onConfirm={handleDelete}
        userName={deletingUser?.full_name ?? ""}
        deleting={deleting}
      />

      {/* ── Toast ────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {toast && (
          <motion.div
            key="toast"
            initial={{ opacity: 0, y: 24, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.95 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className={cn(
              "fixed bottom-6 right-6 z-[60] flex items-center gap-3 rounded-2xl border px-5 py-3.5 shadow-[0_8px_32px_-8px_rgba(0,0,0,0.25)] text-sm font-medium",
              toast.type === "success"
                ? "bg-white border-emerald-200 text-emerald-800"
                : "bg-white border-red-200 text-red-800"
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
