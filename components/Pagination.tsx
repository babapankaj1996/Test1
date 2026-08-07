import Link from "next/link";
import { pagedPath } from "@/lib/urls";

/**
 * SEO-friendly pagination with clean path URLs: /page2, /technology/page3.
 * mode="query" keeps ?page=N (used by the admin panel).
 */
export default function Pagination({
  page,
  totalPages,
  basePath,
  searchParams = {},
  mode = "path",
}: {
  page: number;
  totalPages: number;
  basePath: string;
  searchParams?: Record<string, string | undefined>;
  mode?: "path" | "query";
}) {
  if (totalPages <= 1) return null;

  const href = (p: number) => {
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries(searchParams)) {
      if (v && k !== "page") params.set(k, v);
    }
    if (mode === "query" && p > 1) params.set("page", String(p));
    const qs = params.toString();
    const path = mode === "path" ? pagedPath(basePath, p) : basePath;
    return qs ? `${path}?${qs}` : path;
  };

  const pages: (number | "…")[] = [];
  for (let p = 1; p <= totalPages; p++) {
    if (p === 1 || p === totalPages || Math.abs(p - page) <= 1) {
      pages.push(p);
    } else if (pages[pages.length - 1] !== "…") {
      pages.push("…");
    }
  }

  return (
    <nav aria-label="Pagination" className="mt-10 flex items-center justify-center gap-1.5">
      {page > 1 && (
        <Link href={href(page - 1)} rel="prev" className="btn-ghost !px-3 !py-2 text-sm" aria-label="Previous page">
          ←
        </Link>
      )}
      {pages.map((p, i) =>
        p === "…" ? (
          <span key={`gap-${i}`} className="px-2 text-muted" aria-hidden="true">
            …
          </span>
        ) : (
          <Link
            key={p}
            href={href(p)}
            aria-current={p === page ? "page" : undefined}
            className={
              p === page
                ? "btn-primary !px-3.5 !py-2 text-sm"
                : "btn-ghost !px-3.5 !py-2 text-sm"
            }
          >
            {p}
          </Link>
        )
      )}
      {page < totalPages && (
        <Link href={href(page + 1)} rel="next" className="btn-ghost !px-3 !py-2 text-sm" aria-label="Next page">
          →
        </Link>
      )}
    </nav>
  );
}
