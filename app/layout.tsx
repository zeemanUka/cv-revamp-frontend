import "./globals.css";
import type { Metadata } from "next";
import Link from "next/link";
import ThemeToggle from "./components/theme-toggle";

export const metadata: Metadata = {
  title: "CV Revamper",
  description: "Revamp your CV for any job description in seconds.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased transition-colors dark:bg-slate-950 dark:text-slate-100">
        <header className="border-b border-slate-200 bg-white/95 backdrop-blur dark:border-slate-800 dark:bg-slate-900/90">
          <div className="mx-auto flex max-w-4xl items-center justify-between gap-3 px-4 py-3">
            <Link href="/" className="text-lg font-semibold">
              CV Revamper
            </Link>
            <nav className="flex items-center gap-4 text-sm text-slate-700 dark:text-slate-200">
              <Link href="/" className="hover:text-slate-900 dark:hover:text-white">
                Home
              </Link>
              <Link
                href="/upload"
                className="hover:text-slate-900 dark:hover:text-white"
              >
                Upload CV
              </Link>
              <Link
                href="/ats-check"
                className="hover:text-slate-900 dark:hover:text-white"
              >
                ATS Check
              </Link>
              <ThemeToggle />
            </nav>
          </div>
        </header>
        <main className="mx-auto max-w-4xl px-4 py-8">{children}</main>
      </body>
    </html>
  );
}
