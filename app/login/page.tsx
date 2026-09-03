"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Lock, Eye, EyeOff, BookOpen, Users, Shield, ArrowRight, AlertCircle, CheckCircle, ChevronDown } from 'lucide-react';
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
type APP_NAME = any;
const APP_NAME: any = [];
type APP_TAGLINE = any;
const APP_TAGLINE: any = [];
type APP_BRAND = any;
const APP_BRAND: any = [];
import { fadeInUp, scaleIn } from "@/lib/motion";
import { Reveal } from "@/components/Reveal";

type AuthMode = "login" | "forgot";
type UserRole = "member" | "admin";

const ROLE_OPTIONS: { value: UserRole; label: string; description: string }[] = [
  { value: "member", label: "Library Member", description: "Access your borrowed books and fines" },
  { value: "admin", label: "Administrator", description: "Full library management access" },
];

const FEATURES = [
  { icon: BookOpen, text: "Manage 10,000+ books across all departments" },
  { icon: Users, text: "Track members, issues, and returns in real time" },
  { icon: Shield, text: "Role-based access with JWT authentication" },
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

  // Inline validation
  const [touched, setTouched] = useState<{ email?: boolean; password?: boolean }>({});
  const emailError = touched.email && !email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/) ? "Enter a valid email address" : null;
  const passwordError = touched.password && mode === "login" && password.length < 6 ? "Password must be at least 6 characters" : null;

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setTouched({ email: true, password: true });
    if (emailError || passwordError || !email || !password) return;

    setLoading(true);
    setError(null);

    const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password });

    if (authError || !data.user) {
      setError(authError?.message ?? "Invalid credentials. Please try again.");
      setLoading(false);
      return;
    }

    // Fetch user role from users table
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
  }

  async function handleForgotPassword(e: React.FormEvent) {
    e.preventDefault();
    setTouched({ email: true });
    if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) return;

    setLoading(true);
    setError(null);

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback`,
    });

    setLoading(false);

    if (resetError) {
      setError(resetError.message);
    } else {
      setSuccessMsg("Password reset email sent. Please check your inbox.");
    }
  }

  function switchMode(newMode: AuthMode) {
    setMode(newMode);
    setError(null);
    setSuccessMsg(null);
    setTouched({});
  }

  const formVariants = {
    hidden: { opacity: 0, x: 20 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.35, ease: "easeOut" } },
    exit: { opacity: 0, x: -20, transition: { duration: 0.25, ease: "easeIn" } },
  };

  return (
    <div className="min-h-screen flex bg-[var(--color-cream)]">
      {/* ── Left Panel: Institutional Hero ─────────────────────────────── */}
      <div className="hidden lg:flex lg:w-[52%] xl:w-[55%] flex-col relative overflow-hidden bg-[var(--color-navy)]">
        {/* Decorative background pattern */}
        <div className="absolute inset-0 opacity-10">
          <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>

        {/* Radial glow */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-[var(--color-gold)]/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col h-full px-12 py-14">
          {/* Logo + Brand */}
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="flex items-center gap-3"
          >
            <div className="w-12 h-12 rounded-xl bg-[var(--color-gold)] flex items-center justify-center shadow-lg">
              <BookOpen className="w-6 h-6 text-[var(--color-navy)]" />
            </div>
            <div>
              <div className="text-white font-bold text-lg leading-tight">NCBA&amp;E</div>
              <div className="text-[var(--color-gold)]/80 text-xs font-medium tracking-wide">Library Management System</div>
            </div>
          </motion.div>

          {/* Main heading */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, ease: "easeOut", delay: 0.15 }}
            className="mt-16"
          >
            <h1 className="text-4xl xl:text-5xl font-bold text-white leading-tight tracking-tight text-balance">
              Your Gateway to<br />
              <span className="text-[var(--color-gold)]">Knowledge &amp; Learning</span>
            </h1>
            <p className="mt-4 text-white/60 text-base leading-relaxed max-w-sm text-pretty">
              National College of Business Administration &amp; Economics — a unified platform for managing library resources, members, and transactions.
            </p>
          </motion.div>

          {/* Book Stack SVG Illustration */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, ease: "easeOut", delay: 0.3 }}
            className="mt-12 flex justify-center"
          >
            <svg width="260" height="200" viewBox="0 0 260 200" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="Stack of library books illustration">
              {/* Book 1 - bottom, widest */}
              <rect x="20" y="155" width="220" height="32" rx="4" fill="#c8a96e" opacity="0.9" />
              <rect x="20" y="155" width="18" height="32" rx="4" fill="#a07840" />
              <text x="50" y="176" fill="white" fontSize="11" fontFamily="Inter, sans-serif" fontWeight="500" opacity="0.9">Introduction to Business Administration</text>

              {/* Book 2 */}
              <rect x="30" y="118" width="200" height="32" rx="4" fill="#1e3a5f" opacity="0.95" />
              <rect x="30" y="118" width="18" height="32" rx="4" fill="#152d4a" />
              <text x="60" y="139" fill="#c8a96e" fontSize="11" fontFamily="Inter, sans-serif" fontWeight="500">Principles of Economics</text>

              {/* Book 3 */}
              <rect x="40" y="81" width="180" height="32" rx="4" fill="#2a5298" opacity="0.9" />
              <rect x="40" y="81" width="18" height="32" rx="4" fill="#1e3a6e" />
              <text x="70" y="102" fill="white" fontSize="11" fontFamily="Inter, sans-serif" fontWeight="500">Financial Accounting</text>

              {/* Book 4 */}
              <rect x="50" y="44" width="160" height="32" rx="4" fill="#c8a96e" opacity="0.85" />
              <rect x="50" y="44" width="18" height="32" rx="4" fill="#a07840" />
              <text x="80" y="65" fill="white" fontSize="11" fontFamily="Inter, sans-serif" fontWeight="500">Marketing Management</text>

              {/* Book 5 - top, narrowest */}
              <rect x="65" y="10" width="130" height="30" rx="4" fill="#1e3a5f" opacity="0.8" />
              <rect x="65" y="10" width="18" height="30" rx="4" fill="#152d4a" />
              <text x="95" y="30" fill="#c8a96e" fontSize="10" fontFamily="Inter, sans-serif" fontWeight="500">Research Methods</text>

              {/* Bookmark ribbon on top book */}
              <rect x="155" y="0" width="10" height="22" rx="2" fill="#e74c3c" opacity="0.9" />
              <polygon points="155,22 165,22 160,28" fill="#e74c3c" opacity="0.9" />
            </svg>
          </motion.div>

          {/* Feature list */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut", delay: 0.45 }}
            className="mt-10 space-y-3"
          >
            {FEATURES.map((f) => (
              <div key={f.text} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
                  <f.icon className="w-4 h-4 text-[var(--color-gold)]" />
                </div>
                <span className="text-white/70 text-sm">{f.text}</span>
              </div>
            ))}
          </motion.div>

          {/* Footer tagline */}
          <div className="mt-auto pt-8 border-t border-white/10">
            <p className="text-white/40 text-xs">{APP_TAGLINE}</p>
          </div>
        </div>
      </div>

      {/* ── Right Panel: Auth Form ──────────────────────────────────────── */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 sm:px-10 lg:px-16">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="flex lg:hidden items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-[var(--color-navy)] flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-[var(--color-gold)]" />
            </div>
            <div>
              <div className="text-[var(--color-navy)] font-bold text-base leading-tight">NCBA&amp;E LMS</div>
              <div className="text-[var(--color-navy)]/50 text-xs">Library Management System</div>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {mode === "login" ? (
              <motion.div
                key="login"
                variants={formVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
              >
                {/* Heading */}
                <div className="mb-8">
                  <h2 className="text-2xl sm:text-3xl font-bold text-[var(--color-navy)] tracking-tight">
                    Sign in to your account
                  </h2>
                  <p className="mt-2 text-[var(--color-navy)]/55 text-sm leading-relaxed">
                    Enter your credentials to access the library portal.
                  </p>
                </div>

                {/* Role Selector */}
                <div className="mb-5">
                  <label className="block text-xs font-semibold text-[var(--color-navy)]/70 uppercase tracking-wider mb-2">
                    Sign in as
                  </label>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setRoleDropdownOpen((v) => !v)}
                      className="w-full flex items-center justify-between px-4 py-3 rounded-xl border border-[var(--color-navy)]/20 bg-white text-[var(--color-navy)] text-sm font-medium hover:border-[var(--color-navy)]/40 transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--color-gold)]/40"
                    >
                      <span>{ROLE_OPTIONS.find((r) => r.value === role)?.label}</span>
                      <ChevronDown className={`w-4 h-4 text-[var(--color-navy)]/50 transition-transform ${roleDropdownOpen ? "rotate-180" : ""}`} />
                    </button>
                    <AnimatePresence>
                      {roleDropdownOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: -6 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -6 }}
                          transition={{ duration: 0.18 }}
                          className="absolute z-20 top-full mt-1 w-full bg-white rounded-xl border border-[var(--color-navy)]/15 shadow-[0_8px_24px_-8px_rgba(30,58,95,0.18)] overflow-hidden"
                        >
                          {ROLE_OPTIONS.map((opt) => (
                            <button
                              key={opt.value}
                              type="button"
                              onClick={() => { setRole(opt.value); setRoleDropdownOpen(false); }}
                              className={`w-full text-left px-4 py-3 hover:bg-[var(--color-cream)] transition-colors ${role === opt.value ? "bg-[var(--color-cream)]" : ""}`}
                            >
                              <div className="text-sm font-semibold text-[var(--color-navy)]">{opt.label}</div>
                              <div className="text-xs text-[var(--color-navy)]/50 mt-0.5">{opt.description}</div>
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                {/* Login Form */}
                <form onSubmit={handleLogin} noValidate className="space-y-4">
                  {/* Email */}
                  <div>
                    <label htmlFor="email" className="block text-xs font-semibold text-[var(--color-navy)]/70 uppercase tracking-wider mb-1.5">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-navy)]/35 pointer-events-none" />
                      <input
                        id="email"
                        type="email"
                        autoComplete="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        onBlur={() => setTouched((t) => ({ ...t, email: true }))}
                        placeholder="you@ncbae.edu.pk"
                        className={`w-full pl-10 pr-4 py-3 rounded-xl border text-sm text-[var(--color-navy)] bg-white placeholder:text-[var(--color-navy)]/30 focus:outline-none focus:ring-2 transition-all ${
                          emailError
                            ? "border-[var(--color-red)] focus:ring-[var(--color-red)]/20"
                            : "border-[var(--color-navy)]/20 focus:ring-[var(--color-gold)]/30 focus:border-[var(--color-gold)]"
                        }`}
                      />
                    </div>
                    {emailError && (
                      <p className="mt-1.5 text-xs text-[var(--color-red)] flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" /> {emailError}
                      </p>
                    )}
                  </div>

                  {/* Password */}
                  <div>
                    <label htmlFor="password" className="block text-xs font-semibold text-[var(--color-navy)]/70 uppercase tracking-wider mb-1.5">
                      Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-navy)]/35 pointer-events-none" />
                      <input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        autoComplete="current-password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        onBlur={() => setTouched((t) => ({ ...t, password: true }))}
                        placeholder="••••••••"
                        className={`w-full pl-10 pr-11 py-3 rounded-xl border text-sm text-[var(--color-navy)] bg-white placeholder:text-[var(--color-navy)]/30 focus:outline-none focus:ring-2 transition-all ${
                          passwordError
                            ? "border-[var(--color-red)] focus:ring-[var(--color-red)]/20"
                            : "border-[var(--color-navy)]/20 focus:ring-[var(--color-gold)]/30 focus:border-[var(--color-gold)]"
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((v) => !v)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--color-navy)]/40 hover:text-[var(--color-navy)]/70 transition-colors"
                        aria-label={showPassword ? "Hide password" : "Show password"}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {passwordError && (
                      <p className="mt-1.5 text-xs text-[var(--color-red)] flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" /> {passwordError}
                      </p>
                    )}
                  </div>

                  {/* Error Alert */}
                  <AnimatePresence>
                    {error && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="flex items-start gap-2.5 px-4 py-3 rounded-xl bg-[var(--color-red)]/8 border border-[var(--color-red)]/20">
                          <AlertCircle className="w-4 h-4 text-[var(--color-red)] flex-shrink-0 mt-0.5" />
                          <p className="text-sm text-[var(--color-red)]">{error}</p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Forgot Password link */}
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => switchMode("forgot")}
                      className="text-xs text-[var(--color-gold)] hover:text-[var(--color-navy)] font-medium transition-colors"
                    >
                      Forgot your password?
                    </button>
                  </div>

                  {/* Submit */}
                  <motion.button
                    type="submit"
                    disabled={loading}
                    whileHover={{ scale: loading ? 1 : 1.01 }}
                    whileTap={{ scale: loading ? 1 : 0.98 }}
                    className="w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-[var(--color-navy)] text-white text-sm font-semibold hover:bg-[var(--color-navy)]/90 disabled:opacity-60 disabled:cursor-not-allowed transition-all shadow-[0_4px_16px_-4px_rgba(30,58,95,0.4)] focus:outline-none focus:ring-2 focus:ring-[var(--color-gold)]/50"
                  >
                    {loading ? (
                      <>
                        <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                        </svg>
                        Signing in...
                      </>
                    ) : (
                      <>
                        Sign In
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </motion.button>
                </form>

                {/* Role hint */}
                <div className="mt-6 p-4 rounded-xl bg-[var(--color-navy)]/5 border border-[var(--color-navy)]/10">
                  <p className="text-xs text-[var(--color-navy)]/60 text-center leading-relaxed">
                    Access is restricted to registered NCBA&amp;E library members and staff. Contact the library administrator for account setup.
                  </p>
                </div>
              </motion.div>
            ) : (
              /* ── Forgot Password Form ── */
              <motion.div
                key="forgot"
                variants={formVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
              >
                <div className="mb-8">
                  <h2 className="text-2xl sm:text-3xl font-bold text-[var(--color-navy)] tracking-tight">
                    Reset your password
                  </h2>
                  <p className="mt-2 text-[var(--color-navy)]/55 text-sm leading-relaxed">
                    Enter your registered email and we will send you a reset link.
                  </p>
                </div>

                <form onSubmit={handleForgotPassword} noValidate className="space-y-4">
                  <div>
                    <label htmlFor="reset-email" className="block text-xs font-semibold text-[var(--color-navy)]/70 uppercase tracking-wider mb-1.5">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-navy)]/35 pointer-events-none" />
                      <input
                        id="reset-email"
                        type="email"
                        autoComplete="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        onBlur={() => setTouched((t) => ({ ...t, email: true }))}
                        placeholder="you@ncbae.edu.pk"
                        className={`w-full pl-10 pr-4 py-3 rounded-xl border text-sm text-[var(--color-navy)] bg-white placeholder:text-[var(--color-navy)]/30 focus:outline-none focus:ring-2 transition-all ${
                          emailError
                            ? "border-[var(--color-red)] focus:ring-[var(--color-red)]/20"
                            : "border-[var(--color-navy)]/20 focus:ring-[var(--color-gold)]/30 focus:border-[var(--color-gold)]"
                        }`}
                      />
                    </div>
                    {emailError && (
                      <p className="mt-1.5 text-xs text-[var(--color-red)] flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" /> {emailError}
                      </p>
                    )}
                  </div>

                  <AnimatePresence>
                    {error && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="flex items-start gap-2.5 px-4 py-3 rounded-xl bg-[var(--color-red)]/8 border border-[var(--color-red)]/20">
                          <AlertCircle className="w-4 h-4 text-[var(--color-red)] flex-shrink-0 mt-0.5" />
                          <p className="text-sm text-[var(--color-red)]">{error}</p>
                        </div>
                      </motion.div>
                    )}
                    {successMsg && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="flex items-start gap-2.5 px-4 py-3 rounded-xl bg-green-50 border border-green-200">
                          <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                          <p className="text-sm text-green-700">{successMsg}</p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <motion.button
                    type="submit"
                    disabled={loading || !!successMsg}
                    whileHover={{ scale: loading ? 1 : 1.01 }}
                    whileTap={{ scale: loading ? 1 : 0.98 }}
                    className="w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-[var(--color-navy)] text-white text-sm font-semibold hover:bg-[var(--color-navy)]/90 disabled:opacity-60 disabled:cursor-not-allowed transition-all shadow-[0_4px_16px_-4px_rgba(30,58,95,0.4)] focus:outline-none focus:ring-2 focus:ring-[var(--color-gold)]/50"
                  >
                    {loading ? (
                      <>
                        <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                        </svg>
                        Sending...
                      </>
                    ) : (
                      <>
                        Send Reset Link
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </motion.button>

                  <button
                    type="button"
                    onClick={() => switchMode("login")}
                    className="w-full text-center text-sm text-[var(--color-navy)]/60 hover:text-[var(--color-navy)] transition-colors py-2"
                  >
                    Back to Sign In
                  </button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}