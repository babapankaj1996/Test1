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

### Admin login

- URL: `http://localhost:3000/admin`
- Email: `apecommteam@gmail.com`
- Password: `admin123`

**Change these before deploying** — set `ADMIN_EMAIL` / `ADMIN_PASSWORD` env vars *before the first run* (they are used only when the database is first created), or update the `admins` row afterwards.

### Environment (`.env.local`, see `.env.example`)

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_SITE_URL` | Public site URL — used for canonical URLs, sitemap, Open Graph. **Required in production.** |
| `AUTH_SECRET` | Session signing secret. Auto-generated into `data/.auth-secret` if omitted. |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | Seed admin credentials (first run only). |

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
- Login rate limiting (8 attempts / 15 min)
- Every `/api/admin/*` route requires a valid session; `/admin` pages redirect to login
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
data/             SQLite database + auth secret (gitignored)
public/uploads/   uploaded images (samples committed)
```
