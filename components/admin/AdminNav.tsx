"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

const LINKS = [
  { href: "/admin", label: "Dashboard", icon: "◈" },
  { href: "/admin/posts", label: "Posts", icon: "✎" },
  { href: "/admin/categories", label: "Categories", icon: "▤" },
  { href: "/admin/tags", label: "Tags", icon: "#" },
  { href: "/admin/pages", label: "Pages", icon: "☰" },
  { href: "/admin/settings", label: "Settings", icon: "⚙" },
];

export default function AdminNav({
  adminName,
  adminEmail,
}: {
  adminName: string;
  adminEmail: string;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  }

  const isActive = (href: string) =>
    href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);

  return (
    <aside className="glass shrink-0 border-b border-white/10 md:min-h-screen md:w-60 md:border-b-0 md:border-r">
      <div className="flex items-center justify-between p-4 md:block">
        <Link href="/admin" className="font-display text-lg font-bold">
          <span className="gradient-text">Admin Panel</span>
        </Link>
        <button
          type="button"
          className="btn-ghost !p-2 md:hidden"
          aria-label="Toggle admin menu"
          aria-expanded={open}
          onClick={() => setOpen(!open)}
        >
          ☰
        </button>
      </div>

      <div className={`${open ? "block" : "hidden"} px-3 pb-4 md:block`}>
        <nav className="space-y-1" aria-label="Admin navigation">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors ${
                isActive(l.href)
                  ? "bg-pulse/20 text-white"
                  : "text-muted hover:bg-white/5 hover:text-white"
              }`}
            >
              <span aria-hidden="true" className="w-4 text-center text-glow">
                {l.icon}
              </span>
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="mt-6 border-t border-white/10 pt-4">
          <p className="truncate px-3 text-xs font-medium text-white/80">{adminName}</p>
          <p className="truncate px-3 text-xs text-muted">{adminEmail}</p>
          <div className="mt-3 flex gap-2 px-3">
            <Link href="/" className="btn-ghost flex-1 !px-2 !py-1.5 text-xs">
              View site
            </Link>
            <button type="button" onClick={logout} className="btn-ghost flex-1 !px-2 !py-1.5 text-xs hover:!border-red-400/40 hover:!text-red-300">
              Log out
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}
