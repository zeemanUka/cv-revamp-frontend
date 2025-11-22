"use client";

import Link from "next/link";
import { useState } from "react";
import ThemeToggle from "./theme-toggle";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/upload", label: "Upload CV" },
  { href: "/ats-check", label: "ATS Check" },
];

const navButtonClasses =
  "inline-flex items-center rounded-full border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 shadow-sm transition hover:border-slate-400 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200";

export default function SiteHeader() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:flex-nowrap sm:gap-4">
      <Link href="/" className="text-lg font-semibold">
        CV Revamper
      </Link>
      <button
        type="button"
        className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 shadow-sm transition hover:border-slate-400 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 sm:hidden"
        onClick={() => setMenuOpen((prev) => !prev)}
        aria-expanded={menuOpen}
        aria-label="Toggle navigation menu"
      >
        <span className="relative flex h-4 w-4 flex-col justify-between">
          <span
            className={`h-0.5 w-full bg-slate-700 transition-transform duration-300 dark:bg-slate-200 ${
              menuOpen ? "translate-y-1.5 rotate-45" : ""
            }`}
          />
          <span
            className={`h-0.5 w-full bg-slate-700 transition-opacity duration-300 dark:bg-slate-200 ${
              menuOpen ? "opacity-0" : "opacity-100"
            }`}
          />
          <span
            className={`h-0.5 w-full bg-slate-700 transition-transform duration-300 dark:bg-slate-200 ${
              menuOpen ? "-translate-y-1.5 -rotate-45" : ""
            }`}
          />
        </span>
      </button>
      <nav
        className={`flex w-full flex-col gap-3 border-t border-slate-200 pt-3 sm:flex-1 sm:flex-row sm:flex-nowrap sm:items-center sm:justify-end sm:gap-3 sm:border-t-0 sm:pt-0 ${
          menuOpen ? "flex" : "hidden sm:flex"
        }`}
      >
        {navLinks.map((link) => (
          <Link key={link.href} href={link.href} className={navButtonClasses}>
            {link.label}
          </Link>
        ))}
        <ThemeToggle />
      </nav>
    </div>
  );
}
