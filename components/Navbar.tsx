"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslations } from "next-intl";
import { navLinks, BRAND } from "@/lib/data";
import { createBrowserClient } from "@supabase/ssr";
import { Menu, X, BookOpen, User, LogOut, ChevronDown, Bell, Settings } from 'lucide-react';

const navbarVariants = {
  hidden: { opacity: 0, y: -12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
};

const mobileMenuVariants = {
  hidden: { opacity: 0, height: 0 },
  visible: {
    opacity: 1,
    height: "auto",
    transition: { duration: 0.3, ease: "easeOut" },
  },
  exit: {
    opacity: 0,
    height: 0,
    transition: { duration: 0.2, ease: "easeIn" },
  },
};

const dropdownVariants = {
  hidden: { opacity: 0, y: -8, scale: 0.97 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.2, ease: "easeOut" },
  },
  exit: {
    opacity: 0,
    y: -8,
    scale: 0.97,
    transition: { duration: 0.15, ease: "easeIn" },
  },
};

export default function Navbar() {
  const t = useTranslations();
  const navT = (t.raw("nav") as Record<string, string>) ?? {};
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [userSession, setUserSession] = useState<{
    name: string;
    email: string;
    role: string;
  } | null>(null);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const getSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session?.user) {
        const { data: profile } = await supabase
          .from("users")
          .select("full_name, role")
          .eq("id", session.user.id)
          .single();
        setUserSession({
          name: profile?.full_name ?? session.user.email ?? "User",
          email: session.user.email ?? "",
          role: profile?.role ?? "member",
        });
      } else {
        setUserSession(null);
      }
    };
    getSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        supabase
          .from("users")
          .select("full_name, role")
          .eq("id", session.user.id)
          .single()
          .then(({ data: profile }) => {
            setUserSession({
              name: profile?.full_name ?? session.user.email ?? "User",
              email: session.user.email ?? "",
              role: profile?.role ?? "member",
            });
          });
      } else {
        setUserSession(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUserSession(null);
    setUserMenuOpen(false);
    router.push("/login");
  };

  const handleNavClick = (
    e: React.MouseEvent<HTMLAnchorElement>,
    href: string
  ) => {
    if (href.startsWith("#")) {
      if (pathname === "/") {
        e.preventDefault();
        document.querySelector(href)?.scrollIntoView({ behavior: "smooth" });
      }
    }
    setMobileOpen(false);
  };

  const getNavHref = (href: string) => {
    if (href.startsWith("#")) {
      return pathname === "/" ? href : "/" + href;
    }
    return href;
  };

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  const visibleLinks = navLinks.filter(
    (link) => !link.adminOnly || userSession?.role === "admin"
  );

  const isAdminRoute = pathname.startsWith("/admin");

  return (
    <motion.header
      variants={navbarVariants}
      initial="hidden"
      animate="visible"
      className={`sticky top-0 z-50 w-full transition-all duration-300 ${
        scrolled
          ? "bg-[var(--primary)] shadow-[0_2px_16px_rgba(30,58,95,0.18)]"
          : "bg-[var(--primary)]"
      }`}
    >
      <div className="container-lms">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link
            href={userSession ? "/dashboard" : "/"}
            className="flex items-center gap-2.5 group flex-shrink-0"
          >
            <div className="w-8 h-8 rounded-[var(--radius)] bg-[var(--accent)] flex items-center justify-center flex-shrink-0 group-hover:bg-[var(--accent-hover)] transition-colors duration-200">
              <BookOpen className="w-4 h-4 text-[var(--foreground)]" aria-hidden="true" />
            </div>
            <div className="hidden sm:block">
              <span className="text-white font-semibold text-sm leading-tight block">
                {BRAND.shortName}
              </span>
              <span className="text-white/60 text-[10px] leading-tight block tracking-wide uppercase">
                {isAdminRoute ? "Admin Panel" : "Library Portal"}
              </span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1" aria-label="Main navigation">
            {visibleLinks.map((link) => {
              const label = navT[link.key] ?? link.label;
              const active = isActive(link.href);
              return (
                <Link
                  key={link.key}
                  href={getNavHref(link.href)}
                  onClick={(e) => handleNavClick(e, link.href)}
                  className={`px-3 py-1.5 rounded-[var(--radius)] text-sm font-medium transition-all duration-200 whitespace-nowrap ${
                    active
                      ? "bg-white/15 text-white"
                      : "text-white/80 hover:text-white hover:bg-white/10"
                  } ${link.adminOnly ? "border border-[var(--accent)]/40" : ""}`}
                  aria-current={active ? "page" : undefined}
                >
                  {label}
                </Link>
              );
            })}
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-2">
            {userSession ? (
              <>
                {/* Notification bell */}
                <button
                  className="hidden sm:flex w-8 h-8 items-center justify-center rounded-[var(--radius)] text-white/70 hover:text-white hover:bg-white/10 transition-all duration-200"
                  aria-label="Notifications"
                >
                  <Bell className="w-4 h-4" aria-hidden="true" />
                </button>

                {/* User menu */}
                <div className="relative">
                  <button
                    onClick={() => setUserMenuOpen((v) => !v)}
                    className="flex items-center gap-2 px-2.5 py-1.5 rounded-[var(--radius)] text-white/80 hover:text-white hover:bg-white/10 transition-all duration-200"
                    aria-expanded={userMenuOpen}
                    aria-haspopup="true"
                    aria-label="User menu"
                  >
                    <div className="w-6 h-6 rounded-full bg-[var(--accent)] flex items-center justify-center flex-shrink-0">
                      <span className="text-[10px] font-bold text-[var(--foreground)]">
                        {userSession.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <span className="hidden sm:block text-sm font-medium max-w-[120px] truncate">
                      {userSession.name.split(" ")[0]}
                    </span>
                    <ChevronDown
                      className={`w-3.5 h-3.5 transition-transform duration-200 ${
                        userMenuOpen ? "rotate-180" : ""
                      }`}
                      aria-hidden="true"
                    />
                  </button>

                  <AnimatePresence>
                    {userMenuOpen && (
                      <motion.div
                        variants={dropdownVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        className="absolute right-0 top-full mt-2 w-56 bg-[var(--card)] border border-[var(--border)] rounded-[var(--radius-md)] shadow-[var(--shadow-md)] overflow-hidden z-50"
                        role="menu"
                      >
                        <div className="px-4 py-3 border-b border-[var(--border)] bg-[var(--muted)]">
                          <p className="text-sm font-semibold text-[var(--foreground)] truncate">
                            {userSession.name}
                          </p>
                          <p className="text-xs text-[var(--muted-foreground)] truncate">
                            {userSession.email}
                          </p>
                          <span
                            className={`inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide ${
                              userSession.role === "admin"
                                ? "badge-admin"
                                : "badge-member"
                            }`}
                          >
                            {userSession.role}
                          </span>
                        </div>

                        <div className="py-1">
                          {userSession.role === "admin" && (
                            <Link
                              href="/admin/dashboard"
                              onClick={() => setUserMenuOpen(false)}
                              className="flex items-center gap-2.5 px-4 py-2 text-sm text-[var(--foreground)] hover:bg-[var(--muted)] transition-colors duration-150"
                              role="menuitem"
                            >
                              <Settings className="w-4 h-4 text-[var(--muted-foreground)]" aria-hidden="true" />
                              Admin Panel
                            </Link>
                          )}
                          <Link
                            href="/dashboard"
                            onClick={() => setUserMenuOpen(false)}
                            className="flex items-center gap-2.5 px-4 py-2 text-sm text-[var(--foreground)] hover:bg-[var(--muted)] transition-colors duration-150"
                            role="menuitem"
                          >
                            <User className="w-4 h-4 text-[var(--muted-foreground)]" aria-hidden="true" />
                            My Dashboard
                          </Link>
                        </div>

                        <div className="py-1 border-t border-[var(--border)]">
                          <button
                            onClick={handleLogout}
                            className="flex items-center gap-2.5 w-full px-4 py-2 text-sm text-[var(--destructive)] hover:bg-red-50 transition-colors duration-150"
                            role="menuitem"
                          >
                            <LogOut className="w-4 h-4" aria-hidden="true" />
                            Sign Out
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </>
            ) : (
              <Link
                href="/login"
                className="px-4 py-1.5 rounded-[var(--radius)] bg-[var(--accent)] text-[var(--foreground)] text-sm font-semibold hover:bg-[var(--accent-hover)] transition-all duration-200 whitespace-nowrap"
              >
                Sign In
              </Link>
            )}

            {/* Mobile menu toggle */}
            <button
              onClick={() => setMobileOpen((v) => !v)}
              className="md:hidden w-8 h-8 flex items-center justify-center rounded-[var(--radius)] text-white/80 hover:text-white hover:bg-white/10 transition-all duration-200"
              aria-expanded={mobileOpen}
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
            >
              {mobileOpen ? (
                <X className="w-5 h-5" aria-hidden="true" />
              ) : (
                <Menu className="w-5 h-5" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            variants={mobileMenuVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="md:hidden border-t border-white/10 bg-[var(--primary)] overflow-hidden"
          >
            <nav className="container-lms py-3 flex flex-col gap-1" aria-label="Mobile navigation">
              {visibleLinks.map((link) => {
                const label = navT[link.key] ?? link.label;
                const active = isActive(link.href);
                return (
                  <Link
                    key={link.key}
                    href={getNavHref(link.href)}
                    onClick={(e) => handleNavClick(e, link.href)}
                    className={`px-3 py-2.5 rounded-[var(--radius)] text-sm font-medium transition-all duration-200 ${
                      active
                        ? "bg-white/15 text-white"
                        : "text-white/80 hover:text-white hover:bg-white/10"
                    }`}
                    aria-current={active ? "page" : undefined}
                  >
                    {label}
                  </Link>
                );
              })}

              {userSession && (
                <button
                  onClick={handleLogout}
                  className="mt-2 px-3 py-2.5 rounded-[var(--radius)] text-sm font-medium text-[var(--destructive)] bg-red-50/10 hover:bg-red-50/20 transition-all duration-200 text-left"
                >
                  Sign Out
                </button>
              )}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Overlay to close user menu */}
      {userMenuOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setUserMenuOpen(false)}
          aria-hidden="true"
        />
      )}
    </motion.header>
  );
}