"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Lock, Eye, EyeOff, BookOpen, Users, Shield, ArrowRight, AlertCircle, CheckCircle, ChevronDown, Sparkles } from 'lucide-react';
import { useRouter } from "next/navigation";
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
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />
        {/* Gold glow top-right */}
        <div
          className="absolute -top-40 -right-40 w-[480px] h-[480px] rounded-full pointer-events-none"
          style={{
            background:
              "radial-gradient(circle, rgba(200,169,110,0.18) 0%, transparent 70%)",
          }}
        />
        {/* Gold glow bottom-left */}
        <div
          className="absolute -bottom-40 -left-40 w-[400px] h-[400px] rounded-full pointer-events-none"
          style={{
            background:
              "radial-gradient(circle, rgba(200,169,110,0.12) 0%, transparent 70%)",
          }}
        />
        {/* Subtle horizontal rule accent */}
        <div
          className="absolute left-0 top-1/2 w-full h-px pointer-events-none"
          style={{
            background:
              "linear-gradient(90deg, transparent, rgba(200,169,110,0.15), transparent)",
          }}
        />

        {/* Logo */}
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div
              className="w-11 h-11 rounded-2xl flex items-center justify-center shadow-lg"
              style={{
                background: "linear-gradient(135deg, #c8a96e, #b8944f)",
                boxShadow: "0 4px 20px rgba(200,169,110,0.35)",
              }}
            >
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="text-white font-bold text-base leading-tight tracking-tight">
                {BRAND.shortName}
              </div>
              <div className="text-white/40 text-[11px] tracking-widest uppercase">
                {BRAND.project}
              </div>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 32 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, ease: "easeOut" }}
          >
            {/* Badge */}
            <span
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold mb-8"
              style={{
                background: "rgba(200,169,110,0.18)",
                border: "1px solid rgba(200,169,110,0.35)",
                color: "#e8c98e",
              }}
            >
              <Sparkles className="w-3.5 h-3.5" />
              NCBA&amp;E — Final Year Project 2026
            </span>

            <h1 className="text-5xl font-bold text-white mb-5 leading-[1.1] tracking-tight">
              Welcome to{" "}
              <br />
              <span
                style={{
                  background:
                    "linear-gradient(135deg, #c8a96e 0%, #e8d4a0 50%, #c8a96e 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                the Library
              </span>
            </h1>

            <p className="text-white/55 text-lg leading-relaxed mb-12 max-w-sm">
              Your institutional gateway to library resources. Books, members,
              transactions, and more — all in one place.
            </p>

            {/* Feature list */}
            <div className="space-y-4">
              {FEATURES.map((f, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -24 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.25 + i * 0.12, duration: 0.45, ease: "easeOut" }}
                  className="flex items-center gap-3.5"
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{
                      background: "rgba(200,169,110,0.14)",
                      border: "1px solid rgba(200,169,110,0.28)",
                    }}
                  >
                    <f.icon className="w-4 h-4" style={{ color: "#c8a96e" }} />
                  </div>
                  <span className="text-white/65 text-sm leading-snug">
                    {f.text}
                  </span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Bottom info */}
        <div className="relative z-10 flex items-center gap-3">
          <div
            className="h-px flex-1"
            style={{
              background:
                "linear-gradient(90deg, rgba(200,169,110,0.3), transparent)",
            }}
          />
          <p className="text-white/30 text-xs whitespace-nowrap">
            {BRAND.institution} &middot; {BRAND.year}
          </p>
        </div>
      </div>

      {/* ── Right panel — form ────────────────────────────────────────── */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-14 relative overflow-hidden">
        {/* Subtle background texture */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage:
              "radial-gradient(circle at 70% 20%, rgba(200,169,110,0.07) 0%, transparent 55%), radial-gradient(circle at 20% 80%, rgba(30,58,95,0.06) 0%, transparent 50%)",
          }}
        />

        <motion.div
          variants={scaleIn}
          initial="hidden"
          animate="visible"
          className="w-full max-w-[420px] relative z-10"
        >
          {/* Mobile logo */}
          <div className="flex lg:hidden items-center gap-2.5 mb-10">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{
                background: "linear-gradient(135deg, #1e3a5f, #2a5080)",
                boxShadow: "0 4px 16px rgba(30,58,95,0.25)",
              }}
            >
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <div>
              <div
                className="font-bold text-sm"
                style={{ color: "#1e3a5f" }}
              >
                {BRAND.shortName}
              </div>
              <div className="text-xs" style={{ color: "#5a6a7a" }}>
                {BRAND.project}
              </div>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {mode === "login" ? (
              <motion.div
                key="login"
                variants={fadeInUp}
                initial="hidden"
                animate="visible"
                exit={{ opacity: 0, y: -12, transition: { duration: 0.2 } }}
              >
                {/* Heading */}
                <div className="mb-8">
                  <h2
                    className="text-3xl font-bold mb-2 tracking-tight"
                    style={{ color: "#1e3a5f" }}
                  >
                    Sign In
                  </h2>
                  <p className="text-sm leading-relaxed" style={{ color: "#5a6a7a" }}>
                    Access your library account to manage books and transactions.
                  </p>
                </div>

                {/* Role selector */}
                <div className="mb-6">
                  <label
                    className="block text-xs font-semibold uppercase tracking-wider mb-2"
                    style={{ color: "#1e3a5f" }}
                  >
                    Sign in as
                  </label>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setRoleDropdownOpen(!roleDropdownOpen)}
                      className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 focus-visible:outline-none"
                      style={{
                        background: "white",
                        border: "1.5px solid var(--border)",
                        color: "#1e3a5f",
                        boxShadow: roleDropdownOpen
                          ? "0 0 0 3px rgba(200,169,110,0.18)"
                          : "0 1px 3px rgba(30,58,95,0.06)",
                      }}
                    >
                      <span>
                        {ROLE_OPTIONS.find((r) => r.value === role)?.label}
                      </span>
                      <ChevronDown
                        className={`w-4 h-4 transition-transform duration-200 ${
                          roleDropdownOpen ? "rotate-180" : ""
                        }`}
                        style={{ color: "#5a6a7a" }}
                      />
                    </button>

                    <AnimatePresence>
                      {roleDropdownOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: -6, scale: 0.98 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: -6, scale: 0.98 }}
                          transition={{ duration: 0.15 }}
                          className="absolute top-full left-0 right-0 mt-1.5 rounded-xl overflow-hidden z-20"
                          style={{
                            background: "white",
                            border: "1px solid var(--border)",
                            boxShadow:
                              "0 8px 32px -8px rgba(30,58,95,0.18), 0 2px 8px rgba(30,58,95,0.08)",
                          }}
                        >
                          {ROLE_OPTIONS.map((opt) => (
                            <button
                              key={opt.value}
                              type="button"
                              onClick={() => {
                                setRole(opt.value);
                                setRoleDropdownOpen(false);
                              }}
                              className="w-full flex flex-col items-start px-4 py-3.5 text-left transition-colors duration-150"
                              style={{
                                background:
                                  role === opt.value
                                    ? "rgba(200,169,110,0.08)"
                                    : "transparent",
                              }}
                              onMouseEnter={(e) =>
                                (e.currentTarget.style.background =
                                  "rgba(200,169,110,0.08)")
                              }
                              onMouseLeave={(e) =>
                                (e.currentTarget.style.background =
                                  role === opt.value
                                    ? "rgba(200,169,110,0.08)"
                                    : "transparent")
                              }
                            >
                              <span
                                className="text-sm font-semibold"
                                style={{ color: "#1e3a5f" }}
                              >
                                {opt.label}
                              </span>
                              <span
                                className="text-xs mt-0.5"
                                style={{ color: "#5a6a7a" }}
                              >
                                {opt.description}
                              </span>
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                <form onSubmit={handleLogin} className="space-y-5">
                  {/* Email */}
                  <div>
                    <label
                      className="block text-xs font-semibold uppercase tracking-wider mb-2"
                      style={{ color: "#1e3a5f" }}
                    >
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail
                        className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
                        style={{ color: "#5a6a7a" }}
                      />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        onBlur={() =>
                          setTouched((t) => ({ ...t, email: true }))
                        }
                        placeholder="you@ncbae.edu.pk"
                        className="w-full pl-10 pr-4 py-3 rounded-xl text-sm transition-all duration-200 outline-none"
                        style={{
                          background: "white",
                          border: emailError
                            ? "1.5px solid #e74c3c"
                            : "1.5px solid var(--border)",
                          color: "#1a2a3a",
                          boxShadow: emailError
                            ? "0 0 0 3px rgba(231,76,60,0.1)"
                            : "0 1px 3px rgba(30,58,95,0.06)",
                        }}
                        onFocus={(e) => {
                          if (!emailError)
                            e.currentTarget.style.boxShadow =
                              "0 0 0 3px rgba(200,169,110,0.18)";
                          e.currentTarget.style.borderColor = emailError
                            ? "#e74c3c"
                            : "#c8a96e";
                        }}
                        onBlurCapture={(e) => {
                          e.currentTarget.style.boxShadow = emailError
                            ? "0 0 0 3px rgba(231,76,60,0.1)"
                            : "0 1px 3px rgba(30,58,95,0.06)";
                          e.currentTarget.style.borderColor = emailError
                            ? "#e74c3c"
                            : "var(--border)";
                        }}
                      />
                    </div>
                    {emailError && (
                      <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                        {emailError}
                      </p>
                    )}
                  </div>

                  {/* Password */}
                  <div>
                    <label
                      className="block text-xs font-semibold uppercase tracking-wider mb-2"
                      style={{ color: "#1e3a5f" }}
                    >
                      Password
                    </label>
                    <div className="relative">
                      <Lock
                        className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
                        style={{ color: "#5a6a7a" }}
                      />
                      <input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        onBlur={() =>
                          setTouched((t) => ({ ...t, password: true }))
                        }
                        placeholder="••••••••"
                        className="w-full pl-10 pr-12 py-3 rounded-xl text-sm transition-all duration-200 outline-none"
                        style={{
                          background: "white",
                          border: passwordError
                            ? "1.5px solid #e74c3c"
                            : "1.5px solid var(--border)",
                          color: "#1a2a3a",
                          boxShadow: passwordError
                            ? "0 0 0 3px rgba(231,76,60,0.1)"
                            : "0 1px 3px rgba(30,58,95,0.06)",
                        }}
                        onFocus={(e) => {
                          if (!passwordError)
                            e.currentTarget.style.boxShadow =
                              "0 0 0 3px rgba(200,169,110,0.18)";
                          e.currentTarget.style.borderColor = passwordError
                            ? "#e74c3c"
                            : "#c8a96e";
                        }}
                        onBlurCapture={(e) => {
                          e.currentTarget.style.boxShadow = passwordError
                            ? "0 0 0 3px rgba(231,76,60,0.1)"
                            : "0 1px 3px rgba(30,58,95,0.06)";
                          e.currentTarget.style.borderColor = passwordError
                            ? "#e74c3c"
                            : "var(--border)";
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 p-0.5 rounded transition-colors duration-150"
                        style={{ color: "#5a6a7a" }}
                      >
                        {showPassword ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                    {passwordError && (
                      <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
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
                      className="text-xs font-semibold uppercase tracking-wider hover:underline transition-all duration-150"
                      style={{ color: "#c8a96e" }}
                    >
                      Forgot password?
                    </button>
                  </div>

                  {/* Error */}
                  <AnimatePresence>
                    {error && (
                      <motion.div
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="flex items-start gap-2.5 px-4 py-3 rounded-xl text-sm"
                        style={{
                          background: "rgba(231,76,60,0.07)",
                          border: "1px solid rgba(231,76,60,0.2)",
                          color: "#c0392b",
                        }}
                      >
                        <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                        <span>{error}</span>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Submit */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-2.5 py-3.5 rounded-xl font-semibold text-sm transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
                    style={{
                      background:
                        "linear-gradient(135deg, #1e3a5f 0%, #2a5080 100%)",
                      color: "white",
                      boxShadow:
                        "0 4px 20px rgba(30,58,95,0.35), 0 1px 3px rgba(30,58,95,0.2)",
                    }}
                    onMouseEnter={(e) => {
                      if (!loading) {
                        e.currentTarget.style.transform = "translateY(-1px)";
                        e.currentTarget.style.boxShadow =
                          "0 8px 28px rgba(30,58,95,0.4), 0 2px 6px rgba(30,58,95,0.2)";
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = "";
                      e.currentTarget.style.boxShadow =
                        "0 4px 20px rgba(30,58,95,0.35), 0 1px 3px rgba(30,58,95,0.2)";
                    }}
                  >
                    {loading ? (
                      <>
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
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

                {/* Divider */}
                <div className="flex items-center gap-3 my-6">
                  <div
                    className="flex-1 h-px"
                    style={{ background: "var(--border)" }}
                  />
                  <span className="text-xs" style={{ color: "#8a9aaa" }}>
                    secured by JWT
                  </span>
                  <div
                    className="flex-1 h-px"
                    style={{ background: "var(--border)" }}
                  />
                </div>

                {/* Trust badges */}
                <div className="flex items-center justify-center gap-6">
                  {[
                    { icon: Shield, label: "JWT Auth" },
                    { icon: BookOpen, label: "NCBA&E" },
                    { icon: Users, label: "Role-Based" },
                  ].map((b) => (
                    <div
                      key={b.label}
                      className="flex flex-col items-center gap-1"
                    >
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center"
                        style={{
                          background: "rgba(30,58,95,0.07)",
                          border: "1px solid rgba(30,58,95,0.1)",
                        }}
                      >
                        <b.icon
                          className="w-3.5 h-3.5"
                          style={{ color: "#1e3a5f" }}
                        />
                      </div>
                      <span
                        className="text-[10px] font-medium"
                        style={{ color: "#8a9aaa" }}
                      >
                        {b.label}
                      </span>
                    </div>
                  ))}
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="forgot"
                variants={fadeInUp}
                initial="hidden"
                animate="visible"
                exit={{ opacity: 0, y: -12, transition: { duration: 0.2 } }}
              >
                {/* Heading */}
                <div className="mb-8">
                  <h2
                    className="text-3xl font-bold mb-2 tracking-tight"
                    style={{ color: "#1e3a5f" }}
                  >
                    Reset Password
                  </h2>
                  <p className="text-sm leading-relaxed" style={{ color: "#5a6a7a" }}>
                    Enter your registered email to receive a password reset link.
                  </p>
                </div>

                <form onSubmit={handleForgotPassword} className="space-y-5">
                  <div>
                    <label
                      className="block text-xs font-semibold uppercase tracking-wider mb-2"
                      style={{ color: "#1e3a5f" }}
                    >
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail
                        className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
                        style={{ color: "#5a6a7a" }}
                      />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        onBlur={() =>
                          setTouched((t) => ({ ...t, email: true }))
                        }
                        placeholder="you@ncbae.edu.pk"
                        className="w-full pl-10 pr-4 py-3 rounded-xl text-sm transition-all duration-200 outline-none"
                        style={{
                          background: "white",
                          border: emailError
                            ? "1.5px solid #e74c3c"
                            : "1.5px solid var(--border)",
                          color: "#1a2a3a",
                          boxShadow: emailError
                            ? "0 0 0 3px rgba(231,76,60,0.1)"
                            : "0 1px 3px rgba(30,58,95,0.06)",
                        }}
                        onFocus={(e) => {
                          if (!emailError)
                            e.currentTarget.style.boxShadow =
                              "0 0 0 3px rgba(200,169,110,0.18)";
                          e.currentTarget.style.borderColor = emailError
                            ? "#e74c3c"
                            : "#c8a96e";
                        }}
                        onBlurCapture={(e) => {
                          e.currentTarget.style.boxShadow = emailError
                            ? "0 0 0 3px rgba(231,76,60,0.1)"
                            : "0 1px 3px rgba(30,58,95,0.06)";
                          e.currentTarget.style.borderColor = emailError
                            ? "#e74c3c"
                            : "var(--border)";
                        }}
                      />
                    </div>
                    {emailError && (
                      <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                        {emailError}
                      </p>
                    )}
                  </div>

                  <AnimatePresence>
                    {error && (
                      <motion.div
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="flex items-start gap-2.5 px-4 py-3 rounded-xl text-sm"
                        style={{
                          background: "rgba(231,76,60,0.07)",
                          border: "1px solid rgba(231,76,60,0.2)",
                          color: "#c0392b",
                        }}
                      >
                        <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                        <span>{error}</span>
                      </motion.div>
                    )}
                    {successMsg && (
                      <motion.div
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="flex items-start gap-2.5 px-4 py-3 rounded-xl text-sm"
                        style={{
                          background: "rgba(39,174,96,0.07)",
                          border: "1px solid rgba(39,174,96,0.2)",
                          color: "#1e8449",
                        }}
                      >
                        <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                        <span>{successMsg}</span>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-2.5 py-3.5 rounded-xl font-semibold text-sm transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
                    style={{
                      background:
                        "linear-gradient(135deg, #c8a96e 0%, #b8944f 100%)",
                      color: "#1a2a3a",
                      boxShadow:
                        "0 4px 20px rgba(200,169,110,0.35), 0 1px 3px rgba(200,169,110,0.2)",
                    }}
                    onMouseEnter={(e) => {
                      if (!loading) {
                        e.currentTarget.style.transform = "translateY(-1px)";
                        e.currentTarget.style.boxShadow =
                          "0 8px 28px rgba(200,169,110,0.45), 0 2px 6px rgba(200,169,110,0.2)";
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = "";
                      e.currentTarget.style.boxShadow =
                        "0 4px 20px rgba(200,169,110,0.35), 0 1px 3px rgba(200,169,110,0.2)";
                    }}
                  >
                    {loading ? (
                      <>
                        <span
                          className="w-4 h-4 border-2 rounded-full animate-spin"
                          style={{
                            borderColor: "rgba(26,42,58,0.3)",
                            borderTopColor: "#1a2a3a",
                          }}
                        />
                        Sending...
                      </>
                    ) : (
                      <>
                        Send Reset Link
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setMode("login");
                      setError(null);
                      setSuccessMsg(null);
                    }}
                    className="w-full text-sm font-medium py-2.5 rounded-xl transition-all duration-150"
                    style={{ color: "#5a6a7a" }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.color = "#1e3a5f")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.color = "#5a6a7a")
                    }
                  >
                    &larr; Back to Sign In
                  </button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}
