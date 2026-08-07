@AGENTS.md

# NovaPulse blog platform

- Stack: Next.js 16 App Router + TypeScript + Tailwind 4 + better-sqlite3 (no ORM). DB auto-creates and seeds at `data/blog.db` on first `getDb()` call (`lib/db.ts`).
- Public pages live in `app/(site)/`, admin in `app/admin/` (login page is outside the guarded `(panel)` route group). All pages are `force-dynamic`; data access is synchronous better-sqlite3 in server components.
- Every `/api/admin/*` handler must call `guardAdmin()` from `lib/api-helpers.ts` first. Auth = jose JWT in httpOnly cookie, secret from `AUTH_SECRET` env or `data/.auth-secret`.
- All user/admin-supplied HTML must pass through `lib/sanitize.ts` (`sanitizeContent`/`sanitizeText`/`sanitizeInline`) before storage. Never render unsanitized input.
- Image uploads go through `/api/admin/upload`: sharp-validated, re-encoded to WebP into `public/uploads/`.
- Tags are filters only (`/blog?tag=slug`) — never create tag pages. Pagination uses clean `?page=N` URLs.
- SEO helpers in `lib/schema.ts` (JSON-LD builders) and `lib/site.ts` (`absoluteUrl`, requires `NEXT_PUBLIC_SITE_URL` in prod).
- Admin login for local dev: apecommteam@gmail.com / admin123.
- URL structure: posts at /<category-slug>/<post-slug>, categories at /<category-slug>, footer pages at /<page-slug>; legacy /blog/<slug> and /category/<slug> 308-redirect (see lib/urls.ts). /blog remains the search/filter archive. Category and page slugs share one namespace — RESERVED_SLUGS in lib/urls.ts guards route collisions.
