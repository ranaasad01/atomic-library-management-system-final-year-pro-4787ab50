import type { Metadata } from "next";
import { Inter, DM_Sans } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import LocaleProvider from "@/components/LocaleProvider";
import LanguageToggle from "@/components/LanguageToggle";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  display: "swap",
});

export const metadata: Metadata = {
  formatDetection: { telephone: false, date: false, email: false, address: false },
  title: {
    default: "NCBA&E Library Management System",
    template: "%s | NCBA&E LMS",
  },
  description:
    "A web-based Library Management System for NCBA&E — manage books, members, issue/return workflows, and fines with role-based access control.",
  keywords: [
    "library management",
    "NCBA&E",
    "book management",
    "issue return",
    "fine tracking",
    "LMS",
  ],
  openGraph: {
    title: "NCBA&E Library Management System",
    description:
      "Institutional library portal for borrowing, returning, and managing library resources with JWT-secured role-based access.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${dmSans.variable}`}>
      <body className="bg-[var(--background)] text-[var(--foreground)] font-sans antialiased min-h-screen flex flex-col">
        <LocaleProvider>
          <Navbar />
          <main className="flex-1">{children}</main>
          <Footer />
          <LanguageToggle />
        </LocaleProvider>
      </body>
    </html>
  );
}
