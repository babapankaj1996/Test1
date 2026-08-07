"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

interface NavCategory {
  name: string;
  slug: string;
}

export default function Header({
  siteName,
  categories,
  categoriesPage,
  contactPage,
}: {
  siteName: string;
  categories: NavCategory[];
  categoriesPage?: { title: string; slug: string } | null;
  contactPage?: { title: string; slug: string } | null;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const router = useRouter();
  const pathname = usePathname();

  function submitSearch(e: React.FormEvent) {
    e.preventDefault();
    const q = query.trim();
    router.push(q ? `/?q=${encodeURIComponent(q)}` : "/");
    setOpen(false);
  }

  // Order: Home, Trending, Categories page, specific categories, Contact.
  const links = [
    { href: "/", label: "Home" },
    { href: "/trending", label: "Trending" },
    ...(categoriesPage
      ? [{ href: `/${categoriesPage.slug}`, label: categoriesPage.title }]
      : []),
    ...categories.map((c) => ({ href: `/${c.slug}`, label: c.name })),
    ...(contactPage ? [{ href: `/${contactPage.slug}`, label: contactPage.title }] : []),
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-white/8 bg-void/75 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link
          href="/"
          className="flex items-center gap-2.5 font-display text-xl font-bold tracking-tight"
          onClick={() => setOpen(false)}
        >
          <span
            aria-hidden="true"
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-pulse to-fuchsia-pop text-sm font-bold text-white shadow-lg shadow-fuchsia-pop/30"
          >
            {siteName.charAt(0)}
          </span>
          <span className="gradient-text">{siteName}</span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex" aria-label="Main navigation">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`rounded-full px-3.5 py-1.5 text-sm transition-all ${
                pathname === l.href
                  ? "bg-gradient-to-r from-pulse/30 to-fuchsia-pop/20 text-white shadow-[inset_0_0_0_1px_rgba(232,121,249,0.3)]"
                  : "text-muted hover:bg-white/5 hover:text-white"
              }`}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <form onSubmit={submitSearch} role="search" className="hidden sm:block">
            <label htmlFor="header-search" className="sr-only">
              Search posts
            </label>
            <input
              id="header-search"
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search…"
              className="field w-40 !rounded-full !py-1.5 text-sm transition-[width] duration-300 focus:w-56 lg:w-48"
            />
          </form>
          <button
            type="button"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            onClick={() => setOpen(!open)}
            className="btn-ghost !rounded-full !p-2 md:!hidden"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              {open ? (
                <path d="M6 6l12 12M18 6L6 18" />
              ) : (
                <path d="M4 7h16M4 12h16M4 17h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-white/10 px-4 pb-4 md:hidden animate-fade-up">
          <form onSubmit={submitSearch} role="search" className="pt-3">
            <label htmlFor="mobile-search" className="sr-only">
              Search posts
            </label>
            <input
              id="mobile-search"
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search posts…"
              className="field"
            />
          </form>
          <nav className="mt-3 flex flex-col gap-1" aria-label="Mobile navigation">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className={`rounded-lg px-3 py-2 text-sm ${
                  pathname === l.href
                    ? "bg-gradient-to-r from-pulse/25 to-fuchsia-pop/15 text-white"
                    : "text-muted hover:bg-white/5"
                }`}
              >
                {l.label}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}
