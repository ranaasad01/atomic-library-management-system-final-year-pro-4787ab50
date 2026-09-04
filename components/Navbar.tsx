'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { navLinks, BRAND } from '@/lib/data';
import { createBrowserClient } from '@supabase/ssr';
import { Menu, X, BookOpen, User, LogOut, ChevronDown, Settings } from 'lucide-react';

const navbarVariants = {
  hidden: { opacity: 0, y: -12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
};

const mobileMenuVariants = {
  hidden: { opacity: 0, height: 0 },
  visible: { opacity: 1, height: 'auto', transition: { duration: 0.3, ease: 'easeOut' } },
  exit: { opacity: 0, height: 0, transition: { duration: 0.2, ease: 'easeIn' } },
};

const dropdownVariants = {
  hidden: { opacity: 0, y: -8, scale: 0.97 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.2, ease: 'easeOut' } },
  exit: { opacity: 0, y: -8, scale: 0.97, transition: { duration: 0.15, ease: 'easeIn' } },
};

export default function Navbar() {
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

  const isHome = pathname === '/';

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const { data: profile } = await supabase
          .from('users')
          .select('full_name, role')
          .eq('id', session.user.id)
          .single();
        setUserSession({
          name: profile?.full_name ?? session.user.email ?? 'User',
          email: session.user.email ?? '',
          role: profile?.role ?? 'member',
        });
      } else {
        setUserSession(null);
      }
    };
    getSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        supabase
          .from('users')
          .select('full_name, role')
          .eq('id', session.user.id)
          .single()
          .then(({ data: profile }) => {
            setUserSession({
              name: profile?.full_name ?? session.user?.email ?? 'User',
              email: session.user?.email ?? '',
              role: profile?.role ?? 'member',
            });
          });
      } else {
        setUserSession(null);
      }
    });

    return () => subscription.unsubscribe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUserSession(null);
    setUserMenuOpen(false);
    router.push('/login');
  };

  const visibleLinks = navLinks.filter(
    (link) => !link.adminOnly || userSession?.role === 'admin'
  );

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/');

  const navBg = scrolled || !isHome
    ? 'bg-[var(--primary)] shadow-md'
    : 'bg-transparent';

  return (
    <motion.nav
      variants={navbarVariants}
      initial="hidden"
      animate="visible"
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${navBg}`}
    >
      <div className="container-lms">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #c8a96e, #b8944f)' }}
            >
              <BookOpen className="h-4 w-4 text-white" />
            </div>
            <div className="hidden sm:block">
              <div className="text-white font-bold text-sm leading-tight">{BRAND.shortName}</div>
              <div className="text-[#c8a96e] text-xs leading-tight opacity-80">Library Portal</div>
            </div>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            {visibleLinks.map((link) => (
              <Link
                key={link.key}
                href={link.href}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200 ${
                  isActive(link.href)
                    ? 'bg-white/15 text-white'
                    : 'text-white/75 hover:text-white hover:bg-white/10'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-2">
            {userSession ? (
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen((v) => !v)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors text-white text-sm"
                >
                  <div className="w-6 h-6 rounded-full bg-[#c8a96e] flex items-center justify-center">
                    <User className="h-3.5 w-3.5 text-white" />
                  </div>
                  <span className="hidden sm:block max-w-[120px] truncate">{userSession.name}</span>
                  <ChevronDown className={`h-3.5 w-3.5 transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                <AnimatePresence>
                  {userMenuOpen && (
                    <motion.div
                      variants={dropdownVariants}
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                      className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-xl border border-[var(--border)] overflow-hidden z-50"
                    >
                      <div className="px-4 py-3 border-b border-[var(--border)] bg-[var(--muted)]">
                        <p className="text-sm font-semibold text-[var(--foreground)] truncate">{userSession.name}</p>
                        <p className="text-xs text-[var(--muted-foreground)] truncate">{userSession.email}</p>
                        <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-medium bg-[var(--primary)] text-white capitalize">
                          {userSession.role}
                        </span>
                      </div>
                      <div className="py-1">
                        {userSession.role === 'admin' && (
                          <Link
                            href="/admin/dashboard"
                            onClick={() => setUserMenuOpen(false)}
                            className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-[var(--foreground)] hover:bg-[var(--muted)] transition-colors"
                          >
                            <Settings className="h-4 w-4 text-[var(--muted-foreground)]" />
                            Admin Panel
                          </Link>
                        )}
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-[var(--destructive)] hover:bg-red-50 transition-colors"
                        >
                          <LogOut className="h-4 w-4" />
                          Sign Out
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  className="px-3 py-1.5 text-sm font-medium text-white/80 hover:text-white transition-colors"
                >
                  Login
                </Link>
                <Link
                  href="/signup"
                  className="px-4 py-1.5 text-sm font-semibold rounded-lg transition-all duration-200 text-[var(--primary)]"
                  style={{ background: 'linear-gradient(135deg, #c8a96e, #b8944f)' }}
                >
                  Sign Up
                </Link>
              </div>
            )}

            {/* Mobile menu toggle */}
            <button
              onClick={() => setMobileOpen((v) => !v)}
              className="md:hidden p-2 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors"
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
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
            className="md:hidden bg-[var(--primary)] border-t border-white/10 overflow-hidden"
          >
            <div className="container-lms py-3 flex flex-col gap-1">
              {visibleLinks.map((link) => (
                <Link
                  key={link.key}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive(link.href)
                      ? 'bg-white/15 text-white'
                      : 'text-white/75 hover:text-white hover:bg-white/10'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
              {!userSession && (
                <div className="flex gap-2 pt-2 border-t border-white/10 mt-1">
                  <Link
                    href="/login"
                    onClick={() => setMobileOpen(false)}
                    className="flex-1 text-center px-4 py-2 text-sm font-medium text-white/80 hover:text-white border border-white/20 rounded-lg transition-colors"
                  >
                    Login
                  </Link>
                  <Link
                    href="/signup"
                    onClick={() => setMobileOpen(false)}
                    className="flex-1 text-center px-4 py-2 text-sm font-semibold rounded-lg text-[var(--primary)] transition-colors"
                    style={{ background: 'linear-gradient(135deg, #c8a96e, #b8944f)' }}
                  >
                    Sign Up
                  </Link>
                </div>
              )}
              {userSession && (
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-red-300 hover:text-red-200 hover:bg-white/5 rounded-lg transition-colors mt-1"
                >
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}
