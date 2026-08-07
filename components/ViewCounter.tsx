"use client";

import { useEffect, useState } from "react";

// Module-level guard: prevents double-counting from React strict-mode
// double effects and rapid client-side re-navigation, while still counting
// every full page load.
const lastSent = new Map<string, number>();
const GUARD_MS = 10_000;

/**
 * Displays the live view count and registers a view on every page load.
 * The count updates in place as soon as the server confirms the increment.
 */
export default function ViewCounter({
  slug,
  initial,
}: {
  slug: string;
  initial: number;
}) {
  const [views, setViews] = useState(initial);

  useEffect(() => {
    const now = Date.now();
    const last = lastSent.get(slug) ?? 0;
    if (now - last < GUARD_MS) return;
    lastSent.set(slug, now);

    fetch(`/api/views/${encodeURIComponent(slug)}`, { method: "POST", keepalive: true })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && typeof data.views === "number") setViews(data.views);
      })
      .catch(() => {});
  }, [slug]);

  return (
    <span className="flex items-center gap-1.5">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" />
        <circle cx="12" cy="12" r="3" />
      </svg>
      {views.toLocaleString()} views
    </span>
  );
}
