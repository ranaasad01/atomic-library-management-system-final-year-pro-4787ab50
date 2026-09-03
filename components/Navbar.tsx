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

  const isHome = pathname === "/";

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

  // Navbar background logic:
  // - On home page + not scrolled: transparent (overlays hero)
  // - On home page + scrolled: polished glass navy
  // - On other pages: always navy
  const isTransparent = isHome && !scrolled;

  const navStyle: React.CSSProperties = isTransparent
    ? {
        background: "transparent",
        boxShadow: "none",
      }
    : {
        background: "rgba(30,58,95,0.97)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        boxShadow: "0 4px 24px rgba(30,58,95,0.25)",
      };

  return (
    <motion.nav
      variants={navbarVariants}
      initial="hidden"
      animate="visible"
      style={navStyle}
      className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
    >
      {/* Hairline border at bottom when scrolled */}
      {!isTransparent && (
        <div className="absolute bottom-0 left-0 right-0 h-px bg-white/10" />
      )}

      <div className="container-lms">
        <div className="flex items-center justify-between h-16">
          {/* ── Logo / Brand ── */}
          <Link
            href="/"
            className="flex items-center gap-3 group flex-shrink-0"
          >
            {/* Gold gradient icon container */}
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 transition-transform duration-200 group-hover:scale-105"
              style={{
                background: "linear-gradient(135deg, #c8a96e 0%, #e8c98e 50%, #b8944f 100%)",
                boxShadow: "0 2px 8px rgba(200,169,110,0.4)",
              }}
            >
              <BookOpen className="w-5 h-5 text-white" aria-hidden="true" />
            </div>
            <div className="hidden sm:block">
              <span className="text-white font-semibold text-sm leading-tight block tracking-tight">
                {BRAND.shortName}
              </span>
              <span className="text-white/40 text-[10px] uppercase tracking-widest block leading-tight">
                {BRAND.project}
              </span>
            </div>
          </Link>

          {/* ── Desktop Nav Links ── */}
          <div className="hidden md:flex items-center gap-1">
            {visibleLinks.map((link) => {
              const active = isActive(link.href);
              return (
                <Link
                  key={link.key}
                  href={getNavHref(link.href)}
                  onClick={(e) => handleNavClick(e, link.href)}
                  className="relative px-3.5 py-2 text-sm font-medium rounded-lg transition-all duration-200 group"
                  style={{
                    color: active ? "#c8a96e" : "rgba(255,255,255,0.75)",
                  }}
                  onMouseEnter={(e) => {
                    if (!active) {
                      (e.currentTarget as HTMLAnchorElement).style.color = "#ffffff";
                      (e.currentTarget as HTMLAnchorElement).style.background = "rgba(255,255,255,0.08)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!active) {
                      (e.currentTarget as HTMLAnchorElement).style.color = "rgba(255,255,255,0.75)";
                      (e.currentTarget as HTMLAnchorElement).style.background = "transparent";
                    }
                  }}
                >
                  {navT[link.key] ?? link.label}
                  {/* Gold underline + dot for active */}
                  {active && (
                    <>
                      <span
                        className="absolute bottom-0.5 left-3.5 right-3.5 h-0.5 rounded-full"
                        style={{ background: "linear-gradient(90deg, #c8a96e, #e8c98e)" }}
                      />
                      <span
                        className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[#c8a96e]"
                      />
                    </>
                  )}
                </Link>
              );
            })}
          </div>

          {/* ── Right Side Actions ── */}
          <div className="flex items-center gap-2">
            {userSession ? (
              <>
                {/* Bell icon */}
                <button
                  className="hidden md:flex w-9 h-9 items-center justify-center rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-all duration-200"
                  aria-label="Notifications"
                >
                  <Bell className="w-4 h-4" />
                </button>

                {/* User dropdown trigger */}
                <div className="relative">
                  <button
                    onClick={() => setUserMenuOpen((v) => !v)}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all duration-200 hover:bg-white/10"
                    aria-expanded={userMenuOpen}
                    aria-haspopup="true"
                  >
                    {/* Avatar */}
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                      style={{
                        background: "linear-gradient(135deg, #c8a96e 0%, #b8944f 100%)",
                        boxShadow: "0 0 0 2px rgba(200,169,110,0.3)",
                      }}
                    >
                      {userSession.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="hidden md:block text-left">
                      <span className="text-white text-xs font-medium block leading-tight max-w-[100px] truncate">
                        {userSession.name}
                      </span>
                      <span
                        className="text-xs block leading-tight capitalize"
                        style={{ color: "#c8a96e" }}
                      >
                        {userSession.role}
                      </span>
                    </div>
                    <ChevronDown
                      className={`w-3.5 h-3.5 text-white/50 transition-transform duration-200 ${
                        userMenuOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  {/* Dropdown */}
                  <AnimatePresence>
                    {userMenuOpen && (
                      <motion.div
                        variants={dropdownVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        className="absolute right-0 top-full mt-2 w-56 rounded-xl overflow-hidden"
                        style={{
                          background: "#ffffff",
                          border: "1px solid rgba(214,207,194,0.8)",
                          boxShadow:
                            "0 4px 6px -1px rgba(0,0,0,0.07), 0 16px 40px -8px rgba(30,58,95,0.18)",
                        }}
                      >
                        {/* User info header */}
                        <div className="px-4 py-3 border-b border-[#d6cfc2]/60">
                          <p className="text-[#1a2a3a] text-sm font-semibold truncate">
                            {userSession.name}
                          </p>
                          <p className="text-[#5a6a7a] text-xs truncate mt-0.5">
                            {userSession.email}
                          </p>
                          <span
                            className="inline-flex items-center mt-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide"
                            style={{
                              background: "rgba(200,169,110,0.12)",
                              color: "#b8944f",
                              border: "1px solid rgba(200,169,110,0.25)",
                            }}
                          >
                            {userSession.role}
                          </span>
                        </div>

                        {/* Menu items */}
                        <div className="py-1.5">
                          <Link
                            href="/dashboard"
                            onClick={() => setUserMenuOpen(false)}
                            className="flex items-center gap-3 px-4 py-2.5 text-sm text-[#1a2a3a] hover:bg-[#f5f0e8] transition-colors duration-150 group"
                          >
                            <User className="w-4 h-4 text-[#5a6a7a] group-hover:text-[#c8a96e] transition-colors" />
                            My Dashboard
                          </Link>
                          {userSession.role === "admin" && (
                            <Link
                              href="/admin/dashboard"
                              onClick={() => setUserMenuOpen(false)}
                              className="flex items-center gap-3 px-4 py-2.5 text-sm text-[#1a2a3a] hover:bg-[#f5f0e8] transition-colors duration-150 group"
                            >
                              <Settings className="w-4 h-4 text-[#5a6a7a] group-hover:text-[#c8a96e] transition-colors" />
                              Admin Panel
                            </Link>
                          )}
                        </div>

                        {/* Logout */}
                        <div className="border-t border-[#d6cfc2]/60 py-1.5">
                          <button
                            onClick={handleLogout}
                            className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-[#e74c3c] hover:bg-red-50 transition-colors duration-150 group"
                          >
                            <LogOut className="w-4 h-4" />
                            Sign Out
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </>
            ) : (
              /* Sign In button — gold gradient */
              <Link
                href="/login"
                className="hidden md:inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white transition-all duration-200 hover:scale-[1.03] active:scale-[0.98]"
                style={{
                  background: "linear-gradient(135deg, #c8a96e 0%, #e8c98e 50%, #b8944f 100%)",
                  boxShadow: "0 2px 8px rgba(200,169,110,0.35), 0 1px 2px rgba(0,0,0,0.1)",
                }}
              >
                Sign In
              </Link>
            )}

            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileOpen((v) => !v)}
              className="md:hidden w-9 h-9 flex items-center justify-center rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-all duration-200"
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
              aria-expanded={mobileOpen}
            >
              {mobileOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* ── Mobile Menu ── */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            variants={mobileMenuVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="md:hidden overflow-hidden"
            style={{
              background: "rgba(20,40,75,0.98)",
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
              borderTop: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            <div className="container-lms py-3 flex flex-col gap-1">
              {visibleLinks.map((link) => {
                const active = isActive(link.href);
                return (
                  <Link
                    key={link.key}
                    href={getNavHref(link.href)}
                    onClick={(e) => handleNavClick(e, link.href)}
                    className="flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200"
                    style={{
                      color: active ? "#c8a96e" : "rgba(255,255,255,0.8)",
                      background: active ? "rgba(200,169,110,0.1)" : "transparent",
                      border: active ? "1px solid rgba(200,169,110,0.2)" : "1px solid transparent",
                    }}
                  >
                    {navT[link.key] ?? link.label}
                    {active && (
                      <span
                        className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                        style={{ background: "#c8a96e" }}
                      />
                    )}
                  </Link>
                );
              })}

              {/* Mobile auth section */}
              <div
                className="mt-2 pt-3"
                style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}
              >
                {userSession ? (
                  <div className="flex flex-col gap-1">
                    {/* User info */}
                    <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/5">
                      <div
                        className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
                        style={{
                          background: "linear-gradient(135deg, #c8a96e 0%, #b8944f 100%)",
                        }}
                      >
                        {userSession.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-white text-sm font-medium leading-tight">
                          {userSession.name}
                        </p>
                        <p className="text-white/50 text-xs leading-tight capitalize">
                          {userSession.role}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-400 hover:bg-red-500/10 transition-all duration-200"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </div>
                ) : (
                  <Link
                    href="/login"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center justify-center gap-2 w-full px-4 py-3 rounded-xl text-sm font-semibold text-white transition-all duration-200"
                    style={{
                      background: "linear-gradient(135deg, #c8a96e 0%, #e8c98e 50%, #b8944f 100%)",
                      boxShadow: "0 2px 8px rgba(200,169,110,0.3)",
                    }}
                  >
                    Sign In
                  </Link>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}
