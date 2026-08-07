# NovaPulse — SEO-First Blog & Content Platform

A futuristic, mobile-first publication built with **Next.js 16 (App Router) + TypeScript + Tailwind CSS 4 + SQLite**. Server-rendered pages, full structured-data coverage, secure admin panel, zero external services.

## Quick start

```bash
npm install
npm run dev        # development on http://localhost:3000
# or production:
npm run build && npm start
```

The SQLite database (`data/blog.db`) is created and seeded automatically on first run — 6 sample posts, 3 categories, 6 tags, 4 footer pages, and the admin account.

### Local admin login

- URL: `http://localhost:3000/admin`
- Email: `apecommteam@gmail.com`
- Password: `admin123`

These defaults are for local development only. In production, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, and `AUTH_SECRET` must be configured. On each production startup, the admin account is synced from `ADMIN_EMAIL` / `ADMIN_PASSWORD`.

### Environment (`.env.local`, see `.env.example`)

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_SITE_URL` | Public site URL — used for canonical URLs, sitemap, Open Graph. **Required in production.** |
| `AUTH_SECRET` | Session signing secret. Required in production; auto-generated into `data/.auth-secret` only in local development. |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | Production admin credentials. Required in production and synced on startup. |

## What's included

**Public site**
- `/` — hero with pinned/featured post, trending, latest (paginated), per-category sections, tag filter chips, search
- `/blog` — all published posts with category filter, tag filter, full-text search, clean `?page=2` pagination
- `/blog/<slug>` — post page with view counter, reading time, breadcrumbs, related posts, share buttons, collapsible FAQ accordion
- `/category/<slug>` — per-category pages with their own SEO title/description
- `/about`, `/contact`, `/privacy-policy`, `/terms-and-conditions` — DB-driven footer pages, editable from the admin panel

**SEO**
- Dynamic meta titles/descriptions, canonical URLs, Open Graph + Twitter cards on every page
- JSON-LD: WebSite, Organization, Article, FAQPage, BreadcrumbList
- `/sitemap.xml` (auto-includes posts, categories, pages) and `/robots.txt`
- One H1 per page, semantic headings, alt text everywhere, `?page/?tag/?q` variants marked noindex,follow

**Admin panel** (`/admin`)
- Dashboard with content stats
- Posts: create/edit/delete, draft↔publish, slug, excerpt, HTML content, featured image upload + alt text, category, tags, multiple FAQs, SEO title/description, canonical override, featured/trending/pinned flags, publish date, author name
- Categories & tags managers (tags act only as filters — no tag pages)
- Footer pages editor, site settings (name, tagline, posts-per-page, social links)

**Security**
- bcrypt-hashed admin credentials, JWT session in an httpOnly `SameSite=Lax` cookie
- Production refuses missing `AUTH_SECRET` or default seeded admin credentials
- Login rate limiting (8 attempts / 15 min)
- Every `/api/admin/*` route requires a valid session; `/admin` pages redirect to login
- Admin write APIs reject cross-origin requests
- All content sanitized server-side (`sanitize-html`) — scripts, event handlers and `javascript:` URLs stripped
- Uploads validated by real image decoding (sharp) and **re-encoded to WebP**, killing any embedded payloads; 8 MB limit

**Performance**
- Server-side rendering, `next/image` with AVIF/WebP + responsive sizes, lazy loading below the fold
- Almost no client JS on public pages (FAQ accordion is CSS-only `<details>`)
- SQLite WAL mode, immutable cache headers on uploads

## Project layout

```
app/(site)/       public pages (home, blog, post, category, footer pages)
app/admin/        admin panel (login + guarded (panel) group)
app/api/          public + admin REST APIs
components/       shared UI, components/admin/ for panel UI
lib/              db (schema+seed), queries, auth, sanitize, schema.org builders
data/             SQLite database, auth secret and runtime uploads (gitignored)
```
