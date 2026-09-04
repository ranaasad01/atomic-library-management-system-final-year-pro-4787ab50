"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Lock, Eye, EyeOff, BookOpen, Users, Shield, ArrowRight, AlertCircle, CheckCircle, ChevronDown, Sparkles } from 'lucide-react';
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { fadeInUp, scaleIn } from "@/lib/motion";
import { BRAND } from "@/lib/data";

type AuthMode = "login" | "forgot";
type UserRole = "member" | "admin";

const ROLE_OPTIONS: { value: UserRole; label: string; description: string }[] =
  [
    {
      value: "member",
      label: "Library Member",
      description: "Access your borrowed books and fines",
    },
    {
      value: "admin",
      label: "Administrator",
      description: "Full library management access",
    },
  ];

const FEATURES = [
  {
    icon: BookOpen,
    text: "Manage 10,000+ books across all departments",
  },
  {
    icon: Users,
    text: "Track members, issues, and returns in real time",
  },
  {
    icon: Shield,
    text: "Role-based access with JWT authentication",
  },
];

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();

  const [mode, setMode] = useState<AuthMode>("login");
  const [role, setRole] = useState<UserRole>("member");
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [touched, setTouched] = useState<{
    email?: boolean;
    password?: boolean;
  }>({});

  const emailError =
    touched.email && !email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)
      ? "Enter a valid email address"
      : null;
  const passwordError =
    touched.password && mode === "login" && password.length < 6
      ? "Password must be at least 6 characters"
      : null;

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setTouched({ email: true, password: true });
    if (emailError || passwordError || !email || !password) return;
    setLoading(true);
    setError(null);
    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (authError || !data.user) {
      setError(authError?.message ?? "Invalid credentials. Please try again.");
      setLoading(false);
      return;
    }
    const { data: userRow } = await supabase
      .from("users")
      .select("role")
      .eq("id", data.user.id)
      .single();
    const userRole = userRow?.role ?? "member";
    if (userRole === "admin") {
      router.push("/admin/dashboard");
    } else {
      router.push("/dashboard");
    }
    setLoading(false);
  }

  async function handleForgotPassword(e: React.FormEvent) {
    e.preventDefault();
    setTouched({ email: true });
    if (emailError || !email) return;
    setLoading(true);
    setError(null);
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(
      email,
      { redirectTo: `${window.location.origin}/auth/callback` }
    );
    if (resetError) {
      setError(resetError.message);
    } else {
      setSuccessMsg("Password reset email sent! Check your inbox.");
    }
    setLoading(false);
  }

  return (
    <div
      className="min-h-screen flex"
      style={{ background: "var(--background)" }}
    >
      {/* ── Left panel — branding ─────────────────────────────────────── */}
      <div
        className="hidden lg:flex lg:w-[52%] relative overflow-hidden flex-col justify-between p-14"
        style={{
          background:
            "linear-gradient(145deg, #0a1628 0%, #1e3a5f 55%, #2a5080 100%)",
        }}
      >
        {/* Decorative grid */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(200,169,110,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(200,169,110,0.6) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />
        {/* Glow orbs */}
        <div
          className="absolute top-1/4 -right-20 w-80 h-80 rounded-full opacity-20 blur-3xl"
          style={{ background: "radial-gradient(circle, #c8a96e, transparent)" }}
        />
        <div
          className="absolute bottom-1/4 -left-10 w-60 h-60 rounded-full opacity-10 blur-3xl"
          style={{ background: "radial-gradient(circle, #2a5080, transparent)" }}
        />

        {/* Brand mark */}
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-12">
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center"
              style={{
                background: "linear-gradient(135deg, #c8a96e 0%, #b8944f 100%)",
                boxShadow: "0 4px 16px rgba(200,169,110,0.4)",
              }}
            >
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-white font-bold text-base block leading-tight tracking-tight">
                {BRAND.shortName}
              </span>
              <span className="text-[#c8a96e] text-[10px] uppercase tracking-widest font-medium">
                {BRAND.project}
              </span>
            </div>
          </div>

          <motion.div
            variants={fadeInUp}
            initial="hidden"
            animate="visible"
          >
            <div className="inline-flex items-center gap-2 bg-white/10 border border-white/15 rounded-full px-3 py-1.5 mb-6">
              <Sparkles className="w-3.5 h-3.5 text-[#c8a96e]" />
              <span className="text-white/80 text-xs font-medium">
                NCBA&amp;E Final Year Project 2026
              </span>
            </div>

            <h1 className="text-4xl font-bold text-white leading-tight tracking-tight mb-4">
              Your Library,
              <br />
              <span
                style={{
                  background: "linear-gradient(90deg, #c8a96e, #e8c98e)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                Digitally Organized
              </span>
            </h1>
            <p className="text-white/60 text-base leading-relaxed max-w-sm">
              A modern MERN-stack solution for seamless library management.
              Secure, fast, and built for institutional use.
            </p>
          </motion.div>
        </div>

        {/* Feature list */}
        <div className="relative z-10 space-y-4">
          {FEATURES.map((f, i) => (
            <motion.div
              key={i}
              variants={fadeInUp}
              initial="hidden"
              animate="visible"
              transition={{ delay: 0.15 + i * 0.1 }}
              className="flex items-center gap-3"
            >
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: "rgba(200,169,110,0.15)" }}
              >
                <f.icon className="w-4 h-4 text-[#c8a96e]" />
              </div>
              <span className="text-white/70 text-sm">{f.text}</span>
            </motion.div>
          ))}

          <div className="pt-6 border-t border-white/10">
            <p className="text-white/35 text-xs">
              &copy; 2026 {BRAND.institution}
            </p>
          </div>
        </div>
      </div>

      {/* ── Right panel — form ────────────────────────────────────────── */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <motion.div
          variants={scaleIn}
          initial="hidden"
          animate="visible"
          className="w-full max-w-md"
        >
          {/* Mobile brand */}
          <div className="flex lg:hidden items-center gap-2 mb-8">
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center"
              style={{
                background: "linear-gradient(135deg, #c8a96e 0%, #b8944f 100%)",
              }}
            >
              <BookOpen className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-[var(--primary)] text-base">
              {BRAND.shortName}
            </span>
          </div>

          {/* Card */}
          <div
            className="bg-white rounded-2xl p-8"
            style={{
              boxShadow:
                "0 2px 8px rgba(30,58,95,0.08), 0 16px 48px rgba(30,58,95,0.12)",
              border: "1px solid var(--border)",
            }}
          >
            <AnimatePresence mode="wait">
              {mode === "login" ? (
                <motion.div
                  key="login"
                  variants={fadeInUp}
                  initial="hidden"
                  animate="visible"
                  exit={{ opacity: 0, y: -8 }}
                >
                  {/* Header */}
                  <div className="mb-7">
                    <h2 className="text-2xl font-bold text-[var(--primary)] tracking-tight mb-1">
                      Welcome back
                    </h2>
                    <p className="text-sm text-[var(--muted-foreground)]">
                      Sign in to your library account
                    </p>
                  </div>

                  {/* Role selector */}
                  <div className="mb-5">
                    <label className="block text-xs font-semibold text-[var(--foreground)] uppercase tracking-wider mb-2">
                      Sign in as
                    </label>
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setRoleDropdownOpen((o) => !o)}
                        className="w-full flex items-center justify-between px-4 py-3 rounded-xl border text-sm font-medium transition-all duration-200"
                        style={{
                          borderColor: roleDropdownOpen
                            ? "var(--accent)"
                            : "var(--border)",
                          background: "var(--background)",
                          color: "var(--foreground)",
                        }}
                      >
                        <span>
                          {ROLE_OPTIONS.find((r) => r.value === role)?.label}
                        </span>
                        <ChevronDown
                          className={`w-4 h-4 text-[var(--muted-foreground)] transition-transform duration-200 ${
                            roleDropdownOpen ? "rotate-180" : ""
                          }`}
                        />
                      </button>
                      <AnimatePresence>
                        {roleDropdownOpen && (
                          <motion.div
                            initial={{ opacity: 0, y: -6, scale: 0.98 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -6, scale: 0.98 }}
                            transition={{ duration: 0.15 }}
                            className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl border border-[var(--border)] shadow-lg z-20 overflow-hidden"
                          >
                            {ROLE_OPTIONS.map((opt) => (
                              <button
                                key={opt.value}
                                type="button"
                                onClick={() => {
                                  setRole(opt.value);
                                  setRoleDropdownOpen(false);
                                }}
                                className="w-full flex flex-col items-start px-4 py-3 text-left hover:bg-[var(--muted)] transition-colors"
                              >
                                <span
                                  className="text-sm font-semibold"
                                  style={{
                                    color:
                                      role === opt.value
                                        ? "var(--accent)"
                                        : "var(--foreground)",
                                  }}
                                >
                                  {opt.label}
                                </span>
                                <span className="text-xs text-[var(--muted-foreground)]">
                                  {opt.description}
                                </span>
                              </button>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>

                  {/* Form */}
                  <form onSubmit={handleLogin} className="space-y-4" noValidate>
                    {/* Email */}
                    <div>
                      <label className="block text-xs font-semibold text-[var(--foreground)] uppercase tracking-wider mb-1.5">
                        Email Address
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted-foreground)]" />
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          onBlur={() =>
                            setTouched((t) => ({ ...t, email: true }))
                          }
                          placeholder="you@example.com"
                          className="w-full pl-10 pr-4 py-3 rounded-xl border text-sm transition-all duration-200 outline-none"
                          style={{
                            borderColor: emailError
                              ? "var(--destructive)"
                              : "var(--border)",
                            background: "var(--background)",
                            color: "var(--foreground)",
                          }}
                          autoComplete="email"
                        />
                      </div>
                      {emailError && (
                        <p className="mt-1 text-xs text-[var(--destructive)] flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          {emailError}
                        </p>
                      )}
                    </div>

                    {/* Password */}
                    <div>
                      <label className="block text-xs font-semibold text-[var(--foreground)] uppercase tracking-wider mb-1.5">
                        Password
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted-foreground)]" />
                        <input
                          type={showPassword ? "text" : "password"}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          onBlur={() =>
                            setTouched((t) => ({ ...t, password: true }))
                          }
                          placeholder="••••••••"
                          className="w-full pl-10 pr-11 py-3 rounded-xl border text-sm transition-all duration-200 outline-none"
                          style={{
                            borderColor: passwordError
                              ? "var(--destructive)"
                              : "var(--border)",
                            background: "var(--background)",
                            color: "var(--foreground)",
                          }}
                          autoComplete="current-password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword((s) => !s)}
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
                          aria-label={showPassword ? "Hide password" : "Show password"}
                        >
                          {showPassword ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                      {passwordError && (
                        <p className="mt-1 text-xs text-[var(--destructive)] flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          {passwordError}
                        </p>
                      )}
                    </div>

                    {/* Forgot password */}
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={() => {
                          setMode("forgot");
                          setError(null);
                          setSuccessMsg(null);
                        }}
                        className="text-xs text-[var(--accent)] hover:text-[var(--accent-hover)] font-medium transition-colors"
                      >
                        Forgot password?
                      </button>
                    </div>

                    {/* Error */}
                    <AnimatePresence>
                      {error && (
                        <motion.div
                          initial={{ opacity: 0, y: -4 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0 }}
                          className="flex items-start gap-2 p-3 rounded-xl text-sm"
                          style={{
                            background: "rgba(231,76,60,0.08)",
                            border: "1px solid rgba(231,76,60,0.2)",
                            color: "var(--destructive)",
                          }}
                        >
                          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                          <span>{error}</span>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Submit */}
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm text-white transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
                      style={{
                        background: loading
                          ? "var(--primary)"
                          : "linear-gradient(135deg, #1e3a5f 0%, #2a5080 100%)",
                        boxShadow: loading
                          ? "none"
                          : "0 4px 16px rgba(30,58,95,0.3)",
                      }}
                    >
                      {loading ? (
                        <>
                          <svg
                            className="animate-spin w-4 h-4"
                            fill="none"
                            viewBox="0 0 24 24"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            />
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8v8H4z"
                            />
                          </svg>
                          Signing in...
                        </>
                      ) : (
                        <>
                          Sign In
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </form>

                  {/* Sign up link */}
                  <div className="text-center mt-4 text-sm text-[var(--muted-foreground)]">
                    Don&apos;t have an account?{" "}
                    <Link
                      href="/signup"
                      className="text-[var(--accent)] hover:text-[var(--accent-hover)] font-medium underline-offset-2 hover:underline transition-colors"
                    >
                      Create Account
                    </Link>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="forgot"
                  variants={fadeInUp}
                  initial="hidden"
                  animate="visible"
                  exit={{ opacity: 0, y: -8 }}
                >
                  {/* Header */}
                  <div className="mb-7">
                    <button
                      type="button"
                      onClick={() => {
                        setMode("login");
                        setError(null);
                        setSuccessMsg(null);
                      }}
                      className="text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)] flex items-center gap-1 mb-4 transition-colors"
                    >
                      &larr; Back to sign in
                    </button>
                    <h2 className="text-2xl font-bold text-[var(--primary)] tracking-tight mb-1">
                      Reset Password
                    </h2>
                    <p className="text-sm text-[var(--muted-foreground)]">
                      Enter your email and we&apos;ll send a reset link.
                    </p>
                  </div>

                  <form
                    onSubmit={handleForgotPassword}
                    className="space-y-4"
                    noValidate
                  >
                    <div>
                      <label className="block text-xs font-semibold text-[var(--foreground)] uppercase tracking-wider mb-1.5">
                        Email Address
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted-foreground)]" />
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          onBlur={() =>
                            setTouched((t) => ({ ...t, email: true }))
                          }
                          placeholder="you@example.com"
                          className="w-full pl-10 pr-4 py-3 rounded-xl border text-sm transition-all duration-200 outline-none"
                          style={{
                            borderColor: emailError
                              ? "var(--destructive)"
                              : "var(--border)",
                            background: "var(--background)",
                            color: "var(--foreground)",
                          }}
                          autoComplete="email"
                        />
                      </div>
                      {emailError && (
                        <p className="mt-1 text-xs text-[var(--destructive)] flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          {emailError}
                        </p>
                      )}
                    </div>

                    <AnimatePresence>
                      {error && (
                        <motion.div
                          initial={{ opacity: 0, y: -4 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0 }}
                          className="flex items-start gap-2 p-3 rounded-xl text-sm"
                          style={{
                            background: "rgba(231,76,60,0.08)",
                            border: "1px solid rgba(231,76,60,0.2)",
                            color: "var(--destructive)",
                          }}
                        >
                          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                          <span>{error}</span>
                        </motion.div>
                      )}
                      {successMsg && (
                        <motion.div
                          initial={{ opacity: 0, y: -4 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0 }}
                          className="flex items-start gap-2 p-3 rounded-xl text-sm"
                          style={{
                            background: "rgba(39,174,96,0.08)",
                            border: "1px solid rgba(39,174,96,0.2)",
                            color: "var(--success)",
                          }}
                        >
                          <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                          <span>{successMsg}</span>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <button
                      type="submit"
                      disabled={loading || !!successMsg}
                      className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm text-white transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
                      style={{
                        background:
                          "linear-gradient(135deg, #1e3a5f 0%, #2a5080 100%)",
                        boxShadow: "0 4px 16px rgba(30,58,95,0.3)",
                      }}
                    >
                      {loading ? (
                        <>
                          <svg
                            className="animate-spin w-4 h-4"
                            fill="none"
                            viewBox="0 0 24 24"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            />
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8v8H4z"
                            />
                          </svg>
                          Sending...
                        </>
                      ) : (
                        "Send Reset Link"
                      )}
                    </button>
                  </form>

                  {/* Sign up link on forgot password screen too */}
                  <div className="text-center mt-4 text-sm text-[var(--muted-foreground)]">
                    Don&apos;t have an account?{" "}
                    <Link
                      href="/signup"
                      className="text-[var(--accent)] hover:text-[var(--accent-hover)] font-medium underline-offset-2 hover:underline transition-colors"
                    >
                      Create Account
                    </Link>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
