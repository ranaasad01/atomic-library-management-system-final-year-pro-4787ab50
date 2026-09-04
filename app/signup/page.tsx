"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Mail, Lock, Eye, EyeOff, BookOpen, Users, Shield, User, Phone, AlertCircle, CheckCircle, Loader2, ChevronDown, Sparkles } from 'lucide-react';
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { fadeInUp, scaleIn } from "@/lib/motion";
import { BRAND } from "@/lib/data";

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

interface FormFields {
  fullName: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
}

interface TouchedFields {
  fullName?: boolean;
  email?: boolean;
  password?: boolean;
  confirmPassword?: boolean;
}

export default function SignUpPage() {
  const router = useRouter();
  const supabase = createClient();

  const [role, setRole] = useState<UserRole>("member");
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [touched, setTouched] = useState<TouchedFields>({});

  const [fields, setFields] = useState<FormFields>({
    fullName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });

  const setField = (key: keyof FormFields, value: string) =>
    setFields((prev) => ({ ...prev, [key]: value }));

  const touch = (key: keyof TouchedFields) =>
    setTouched((prev) => ({ ...prev, [key]: true }));

  // Inline validation
  const nameError =
    touched.fullName && fields.fullName.trim().length < 2
      ? "Full name is required"
      : null;
  const emailError =
    touched.email && !fields.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)
      ? "Enter a valid email address"
      : null;
  const passwordError =
    touched.password && fields.password.length < 6
      ? "Password must be at least 6 characters"
      : null;
  const confirmError =
    touched.confirmPassword && fields.confirmPassword !== fields.password
      ? "Passwords do not match"
      : null;

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault();
    setTouched({
      fullName: true,
      email: true,
      password: true,
      confirmPassword: true,
    });

    if (
      nameError ||
      emailError ||
      passwordError ||
      confirmError ||
      !fields.fullName.trim() ||
      !fields.email ||
      !fields.password ||
      !fields.confirmPassword
    )
      return;

    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      // 1. Create auth user
      const { data, error: authError } = await supabase.auth.signUp({
        email: fields.email,
        password: fields.password,
        options: {
          data: {
            full_name: fields.fullName.trim(),
            role,
          },
        },
      });

      if (authError) {
        setError(authError.message);
        setLoading(false);
        return;
      }

      if (!data.user) {
        setError("Sign up failed. Please try again.");
        setLoading(false);
        return;
      }

      // 2. Insert profile row into users table
      const { error: insertError } = await supabase.from("users").insert({
        id: data.user.id,
        full_name: fields.fullName.trim(),
        email: fields.email,
        role,
        phone: fields.phone.trim() || null,
        is_active: true,
      });

      if (insertError) {
        // Non-fatal: auth user created but profile insert failed
        console.error("Profile insert error:", insertError.message);
      }

      setSuccessMsg(
        "Account created! Please check your email to confirm your account, then sign in."
      );
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const selectedRole = ROLE_OPTIONS.find((r) => r.value === role)!;

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
              "linear-gradient(rgba(200,169,110,1) 1px, transparent 1px), linear-gradient(90deg, rgba(200,169,110,1) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />

        {/* Glow orbs */}
        <div
          className="absolute top-1/4 -right-20 w-80 h-80 rounded-full opacity-10 blur-3xl"
          style={{ background: "radial-gradient(circle, #c8a96e, transparent)" }}
        />
        <div
          className="absolute bottom-1/4 -left-10 w-60 h-60 rounded-full opacity-8 blur-3xl"
          style={{ background: "radial-gradient(circle, #2a5080, transparent)" }}
        />

        {/* Brand header */}
        <motion.div
          variants={fadeInUp}
          initial="hidden"
          animate="visible"
          className="relative z-10"
        >
          <div className="flex items-center gap-3 mb-10">
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{
                background: "linear-gradient(135deg, #c8a96e 0%, #b8944f 100%)",
                boxShadow: "0 4px 16px rgba(200,169,110,0.4)",
              }}
            >
              <BookOpen className="w-5 h-5 text-white" aria-hidden="true" />
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

          <div
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-6"
            style={{
              background: "rgba(200,169,110,0.12)",
              border: "1px solid rgba(200,169,110,0.25)",
            }}
          >
            <Sparkles className="w-3.5 h-3.5 text-[#c8a96e]" />
            <span className="text-[#c8a96e] text-xs font-medium tracking-wide">
              Create your account
            </span>
          </div>

          <h1 className="text-4xl font-bold text-white leading-tight tracking-tight mb-4">
            Join the
            <br />
            <span
              style={{
                background: "linear-gradient(90deg, #c8a96e, #e8c98e)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Library Network
            </span>
          </h1>
          <p className="text-white/60 text-base leading-relaxed max-w-sm">
            Register to access the full library catalog, track your borrowed
            books, and manage your account.
          </p>
        </motion.div>

        {/* Feature list */}
        <motion.div
          variants={fadeInUp}
          initial="hidden"
          animate="visible"
          className="relative z-10 space-y-4"
          style={{ transitionDelay: "0.15s" }}
        >
          {FEATURES.map((f, i) => (
            <div key={i} className="flex items-center gap-3">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{
                  background: "rgba(200,169,110,0.15)",
                  border: "1px solid rgba(200,169,110,0.2)",
                }}
              >
                <f.icon className="w-4 h-4 text-[#c8a96e]" />
              </div>
              <span className="text-white/75 text-sm">{f.text}</span>
            </div>
          ))}

          {/* Institution badge */}
          <div
            className="mt-8 p-4 rounded-xl"
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            <p className="text-white/40 text-xs uppercase tracking-widest mb-1">
              Institution
            </p>
            <p className="text-white/80 text-sm font-medium">
              {BRAND.institution}
            </p>
            <p className="text-[#c8a96e]/70 text-xs mt-0.5">
              Department of Computer Science
            </p>
          </div>
        </motion.div>
      </div>

      {/* ── Right panel — sign-up form ────────────────────────────────── */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12 overflow-y-auto">
        <motion.div
          variants={scaleIn}
          initial="hidden"
          animate="visible"
          className="w-full max-w-md"
        >
          {/* Gold top border card */}
          <div
            className="rounded-2xl overflow-hidden"
            style={{
              background: "var(--card)",
              boxShadow:
                "0 4px 24px rgba(30,58,95,0.10), 0 1px 4px rgba(30,58,95,0.06)",
              border: "1px solid var(--border)",
            }}
          >
            {/* Gold gradient top border */}
            <div
              style={{
                height: "3px",
                background:
                  "linear-gradient(90deg, #c8a96e 0%, #e8c98e 50%, #c8a96e 100%)",
              }}
            />

            <div className="p-8">
              {/* Mobile brand header */}
              <div className="flex items-center gap-2 mb-6 lg:hidden">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{
                    background:
                      "linear-gradient(135deg, #c8a96e 0%, #b8944f 100%)",
                  }}
                >
                  <BookOpen className="w-4 h-4 text-white" />
                </div>
                <span className="text-[var(--primary)] font-bold text-sm">
                  {BRAND.shortName}
                </span>
              </div>

              <h2 className="text-2xl font-bold text-[var(--primary)] tracking-tight mb-1">
                Create Account
              </h2>
              <p className="text-sm text-[var(--muted-foreground)] mb-7">
                Fill in your details to register
              </p>

              {/* Success message */}
              {successMsg && (
                <motion.div
                  variants={fadeInUp}
                  initial="hidden"
                  animate="visible"
                  className="flex items-start gap-3 p-4 rounded-xl mb-6"
                  style={{
                    background: "#d4edda",
                    border: "1px solid #c3e6cb",
                  }}
                >
                  <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-emerald-800">
                      Registration Successful
                    </p>
                    <p className="text-xs text-emerald-700 mt-0.5">{successMsg}</p>
                    <Link
                      href="/login"
                      className="text-xs font-semibold text-emerald-800 underline mt-2 inline-block"
                    >
                      Go to Sign In
                    </Link>
                  </div>
                </motion.div>
              )}

              {/* Error message */}
              {error && (
                <motion.div
                  variants={fadeInUp}
                  initial="hidden"
                  animate="visible"
                  className="flex items-start gap-3 p-4 rounded-xl mb-6"
                  style={{
                    background: "#fdf0ef",
                    border: "1px solid #f5c6cb",
                  }}
                >
                  <AlertCircle className="w-5 h-5 text-[var(--destructive)] flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-[var(--destructive)]">{error}</p>
                </motion.div>
              )}

              {!successMsg && (
                <form onSubmit={handleSignUp} noValidate className="space-y-5">
                  {/* Full Name */}
                  <div>
                    <label
                      htmlFor="fullName"
                      className="block text-xs font-semibold text-[var(--foreground)] uppercase tracking-wider mb-1.5"
                    >
                      Full Name
                    </label>
                    <div className="relative">
                      <User
                        className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted-foreground)]"
                        aria-hidden="true"
                      />
                      <input
                        id="fullName"
                        type="text"
                        autoComplete="name"
                        value={fields.fullName}
                        onChange={(e) => setField("fullName", e.target.value)}
                        onBlur={() => touch("fullName")}
                        placeholder="Rao Muhammad Hamza"
                        className="w-full pl-10 pr-4 py-3 rounded-xl text-sm transition-all duration-200"
                        style={{
                          background: "var(--muted)",
                          border: nameError
                            ? "1.5px solid var(--destructive)"
                            : "1.5px solid var(--border)",
                          color: "var(--foreground)",
                          outline: "none",
                        }}
                        onFocus={(e) =>
                          (e.currentTarget.style.borderColor = "#c8a96e")
                        }
                        onBlurCapture={(e) =>
                          (e.currentTarget.style.borderColor = nameError
                            ? "var(--destructive)"
                            : "var(--border)")
                        }
                      />
                    </div>
                    {nameError && (
                      <p className="text-xs text-[var(--destructive)] mt-1.5 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {nameError}
                      </p>
                    )}
                  </div>

                  {/* Email */}
                  <div>
                    <label
                      htmlFor="email"
                      className="block text-xs font-semibold text-[var(--foreground)] uppercase tracking-wider mb-1.5"
                    >
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail
                        className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted-foreground)]"
                        aria-hidden="true"
                      />
                      <input
                        id="email"
                        type="email"
                        autoComplete="email"
                        value={fields.email}
                        onChange={(e) => setField("email", e.target.value)}
                        onBlur={() => touch("email")}
                        placeholder="you@example.com"
                        className="w-full pl-10 pr-4 py-3 rounded-xl text-sm transition-all duration-200"
                        style={{
                          background: "var(--muted)",
                          border: emailError
                            ? "1.5px solid var(--destructive)"
                            : "1.5px solid var(--border)",
                          color: "var(--foreground)",
                          outline: "none",
                        }}
                        onFocus={(e) =>
                          (e.currentTarget.style.borderColor = "#c8a96e")
                        }
                        onBlurCapture={(e) =>
                          (e.currentTarget.style.borderColor = emailError
                            ? "var(--destructive)"
                            : "var(--border)")
                        }
                      />
                    </div>
                    {emailError && (
                      <p className="text-xs text-[var(--destructive)] mt-1.5 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {emailError}
                      </p>
                    )}
                  </div>

                  {/* Phone (optional) */}
                  <div>
                    <label
                      htmlFor="phone"
                      className="block text-xs font-semibold text-[var(--foreground)] uppercase tracking-wider mb-1.5"
                    >
                      Phone{" "}
                      <span className="text-[var(--muted-foreground)] normal-case font-normal">
                        (optional)
                      </span>
                    </label>
                    <div className="relative">
                      <Phone
                        className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted-foreground)]"
                        aria-hidden="true"
                      />
                      <input
                        id="phone"
                        type="tel"
                        autoComplete="tel"
                        value={fields.phone}
                        onChange={(e) => setField("phone", e.target.value)}
                        placeholder="+92 300 0000000"
                        className="w-full pl-10 pr-4 py-3 rounded-xl text-sm transition-all duration-200"
                        style={{
                          background: "var(--muted)",
                          border: "1.5px solid var(--border)",
                          color: "var(--foreground)",
                          outline: "none",
                        }}
                        onFocus={(e) =>
                          (e.currentTarget.style.borderColor = "#c8a96e")
                        }
                        onBlurCapture={(e) =>
                          (e.currentTarget.style.borderColor = "var(--border)")
                        }
                      />
                    </div>
                  </div>

                  {/* Role selector */}
                  <div>
                    <label className="block text-xs font-semibold text-[var(--foreground)] uppercase tracking-wider mb-1.5">
                      Account Role
                    </label>
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setRoleDropdownOpen((o) => !o)}
                        className="w-full flex items-center justify-between pl-4 pr-3 py-3 rounded-xl text-sm transition-all duration-200"
                        style={{
                          background: "var(--muted)",
                          border: "1.5px solid var(--border)",
                          color: "var(--foreground)",
                        }}
                        aria-haspopup="listbox"
                        aria-expanded={roleDropdownOpen}
                      >
                        <span className="font-medium">{selectedRole.label}</span>
                        <ChevronDown
                          className={`w-4 h-4 text-[var(--muted-foreground)] transition-transform duration-200 ${
                            roleDropdownOpen ? "rotate-180" : ""
                          }`}
                        />
                      </button>

                      {roleDropdownOpen && (
                        <div
                          className="absolute top-full left-0 right-0 mt-1 rounded-xl overflow-hidden z-20"
                          style={{
                            background: "var(--card)",
                            border: "1.5px solid var(--border)",
                            boxShadow: "0 8px 24px rgba(30,58,95,0.12)",
                          }}
                          role="listbox"
                        >
                          {ROLE_OPTIONS.map((opt) => (
                            <button
                              key={opt.value}
                              type="button"
                              role="option"
                              aria-selected={role === opt.value}
                              onClick={() => {
                                setRole(opt.value);
                                setRoleDropdownOpen(false);
                              }}
                              className="w-full text-left px-4 py-3 transition-colors duration-150 hover:bg-[var(--muted)]"
                            >
                              <span
                                className="block text-sm font-semibold"
                                style={{
                                  color:
                                    role === opt.value
                                      ? "#c8a96e"
                                      : "var(--foreground)",
                                }}
                              >
                                {opt.label}
                              </span>
                              <span className="block text-xs text-[var(--muted-foreground)] mt-0.5">
                                {opt.description}
                              </span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Password */}
                  <div>
                    <label
                      htmlFor="password"
                      className="block text-xs font-semibold text-[var(--foreground)] uppercase tracking-wider mb-1.5"
                    >
                      Password
                    </label>
                    <div className="relative">
                      <Lock
                        className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted-foreground)]"
                        aria-hidden="true"
                      />
                      <input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        autoComplete="new-password"
                        value={fields.password}
                        onChange={(e) => setField("password", e.target.value)}
                        onBlur={() => touch("password")}
                        placeholder="Min. 6 characters"
                        className="w-full pl-10 pr-11 py-3 rounded-xl text-sm transition-all duration-200"
                        style={{
                          background: "var(--muted)",
                          border: passwordError
                            ? "1.5px solid var(--destructive)"
                            : "1.5px solid var(--border)",
                          color: "var(--foreground)",
                          outline: "none",
                        }}
                        onFocus={(e) =>
                          (e.currentTarget.style.borderColor = "#c8a96e")
                        }
                        onBlurCapture={(e) =>
                          (e.currentTarget.style.borderColor = passwordError
                            ? "var(--destructive)"
                            : "var(--border)")
                        }
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((v) => !v)}
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
                      <p className="text-xs text-[var(--destructive)] mt-1.5 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {passwordError}
                      </p>
                    )}
                  </div>

                  {/* Confirm Password */}
                  <div>
                    <label
                      htmlFor="confirmPassword"
                      className="block text-xs font-semibold text-[var(--foreground)] uppercase tracking-wider mb-1.5"
                    >
                      Confirm Password
                    </label>
                    <div className="relative">
                      <Lock
                        className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted-foreground)]"
                        aria-hidden="true"
                      />
                      <input
                        id="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        autoComplete="new-password"
                        value={fields.confirmPassword}
                        onChange={(e) =>
                          setField("confirmPassword", e.target.value)
                        }
                        onBlur={() => touch("confirmPassword")}
                        placeholder="Re-enter your password"
                        className="w-full pl-10 pr-11 py-3 rounded-xl text-sm transition-all duration-200"
                        style={{
                          background: "var(--muted)",
                          border: confirmError
                            ? "1.5px solid var(--destructive)"
                            : "1.5px solid var(--border)",
                          color: "var(--foreground)",
                          outline: "none",
                        }}
                        onFocus={(e) =>
                          (e.currentTarget.style.borderColor = "#c8a96e")
                        }
                        onBlurCapture={(e) =>
                          (e.currentTarget.style.borderColor = confirmError
                            ? "var(--destructive)"
                            : "var(--border)")
                        }
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword((v) => !v)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
                        aria-label={
                          showConfirmPassword
                            ? "Hide confirm password"
                            : "Show confirm password"
                        }
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                    {confirmError && (
                      <p className="text-xs text-[var(--destructive)] mt-1.5 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {confirmError}
                      </p>
                    )}
                  </div>

                  {/* Submit button */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-semibold text-sm transition-all duration-200 mt-2"
                    style={{
                      background: loading
                        ? "#b8944f"
                        : "linear-gradient(135deg, #c8a96e 0%, #b8944f 100%)",
                      color: "#1a2a3a",
                      boxShadow: loading
                        ? "none"
                        : "0 4px 16px rgba(200,169,110,0.35)",
                      cursor: loading ? "not-allowed" : "pointer",
                    }}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Creating account...
                      </>
                    ) : (
                      "Create Account"
                    )}
                  </button>
                </form>
              )}

              {/* Divider */}
              <div className="flex items-center gap-3 my-6">
                <div
                  className="flex-1 h-px"
                  style={{ background: "var(--border)" }}
                />
                <span className="text-xs text-[var(--muted-foreground)]">
                  Already have an account?
                </span>
                <div
                  className="flex-1 h-px"
                  style={{ background: "var(--border)" }}
                />
              </div>

              {/* Sign in link */}
              <Link
                href="/login"
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm transition-all duration-200"
                style={{
                  background: "var(--muted)",
                  border: "1.5px solid var(--border)",
                  color: "var(--primary)",
                }}
              >
                Sign In to your account
              </Link>

              {/* Footer note */}
              <p className="text-center text-xs text-[var(--muted-foreground)] mt-5">
                {BRAND.institution} &mdash; {BRAND.project}
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
