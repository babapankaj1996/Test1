import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getCategories, getPosts, getTags } from "@/lib/posts";
import { getSettings } from "@/lib/settings";
import { postPath } from "@/lib/urls";
import { formatDate } from "@/lib/format";
import PostCard from "@/components/PostCard";
import Pagination from "@/components/Pagination";
import SearchBar from "@/components/SearchBar";

export interface HomeFilters {
  q?: string;
  tag?: string;
  category?: string;
}

/**
 * The homepage. Renders the full landing experience, or — when a search
 * query / tag / category filter is active — a filtered results view
 * (this replaces the old /blog listing page).
 */
export default function HomeView({
  pageNum = 1,
  filters = {},
}: {
  pageNum?: number;
  filters?: HomeFilters;
}) {
  const settings = getSettings();
  const { q, tag, category } = filters;
  const filtered = !!(q || tag || category);

  const categories = getCategories().filter((c) => (c.post_count ?? 0) > 0);
  const tags = getTags().filter((t) => (t.post_count ?? 0) > 0);

  if (filtered) {
    return (
      <FilteredResults
        pageNum={pageNum}
        filters={filters}
        perPage={settings.posts_per_page}
        categories={categories}
        tags={tags}
      />
    );
  }

  // Hero: pinned post first, else most recent featured, else latest.
  const pinned = getPosts({ pinned: true, perPage: 1 }).items[0];
  const hero =
    pinned ?? getPosts({ featured: true, perPage: 1 }).items[0] ?? getPosts({ perPage: 1 }).items[0];

  const latest = getPosts({
    page: pageNum,
    perPage: settings.posts_per_page,
    excludeIds: hero ? [hero.id] : [],
  });
  if (pageNum > 1 && pageNum > latest.totalPages) notFound();
  const trending = getPosts({ orderBy: "views", perPage: 4 });
  const totalViews = getPosts({ perPage: 50 }).items.reduce((sum, p) => sum + p.view_count, 0);

  const words = settings.site_tagline.split(" ");
  const taglineStart = words.slice(0, -3).join(" ");
  const taglineEnd = words.slice(-3).join(" ");

  return (
    <>
      {/* ---------- Hero ---------- */}
      <section className="relative overflow-hidden">
        <div aria-hidden="true" className="grid-lines absolute inset-0 -z-10" />
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 pb-16 pt-14 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:gap-10 lg:pt-20">
          <div className="animate-fade-up">
            <p className="eyebrow">{settings.site_name} · Digital Publication</p>
            <h1 className="font-display mt-5 text-4xl font-bold leading-[1.08] tracking-tight sm:text-5xl xl:text-6xl">
              {taglineStart} <span className="gradient-text">{taglineEnd}</span>
            </h1>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-muted sm:text-lg">
              {settings.site_description}
            </p>
            <div className="mt-8 max-w-xl">
              <SearchBar align="left" />
            </div>
            {tags.length > 0 && (
              <div className="mt-6 flex flex-wrap items-center gap-2">
                <span className="text-xs font-medium uppercase tracking-wider text-muted">
                  Popular:
                </span>
                {tags.slice(0, 5).map((t) => (
                  <Link key={t.id} href={`/?tag=${t.slug}`} className="chip-tag px-3 py-1 text-xs">
                    #{t.name}
                  </Link>
                ))}
              </div>
            )}
          </div>

          {hero && (
            <article className="animate-fade-up relative">
              <div
                aria-hidden="true"
                className="absolute -inset-6 rounded-[2rem] bg-gradient-to-br from-pulse/25 via-fuchsia-pop/15 to-cyan-glow/20 blur-2xl"
              />
              <div className="glow-border card-hover relative overflow-hidden rounded-3xl">
                <Link href={postPath(hero)} className="relative block aspect-[16/9] bg-panel lg:aspect-[4/3]">
                  {hero.featured_image && (
                    <Image
                      src={hero.featured_image}
                      alt={hero.image_alt || hero.title}
                      fill
                      sizes="(max-width: 1024px) 100vw, 45vw"
                      priority
                      className="object-cover"
                    />
                  )}
                  <div
                    aria-hidden="true"
                    className="absolute inset-0 bg-gradient-to-t from-[#100c1d] via-transparent to-transparent"
                  />
                  <span className="absolute left-4 top-4 rounded-full bg-gradient-to-r from-pulse to-fuchsia-pop/90 px-3 py-1 text-xs font-semibold text-white shadow-lg">
                    {hero.is_pinned ? "📌 Pinned Story" : "★ Featured Story"}
                  </span>
                  <span className="absolute bottom-4 right-4 flex items-center gap-1.5 rounded-full bg-black/60 px-2.5 py-1 text-[11px] font-medium text-white backdrop-blur">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                    {hero.view_count.toLocaleString()} views
                  </span>
                </Link>
                <div className="p-6 sm:p-7">
                  <div className="flex flex-wrap items-center gap-2.5 text-xs text-muted">
                    {hero.category_name && (
                      <Link href={`/${hero.category_slug}`} className="chip-category px-2.5 py-0.5 text-xs">
                        {hero.category_name}
                      </Link>
                    )}
                    <span>{formatDate(hero.published_at)}</span>
                    <span aria-hidden="true">·</span>
                    <span>{hero.reading_time} min read</span>
                  </div>
                  <h2 className="font-display mt-3 text-xl font-bold leading-snug sm:text-2xl">
                    <Link href={postPath(hero)} className="transition-colors hover:text-glow">
                      {hero.title}
                    </Link>
                  </h2>
                  <p className="mt-2.5 line-clamp-2 text-sm leading-relaxed text-muted">
                    {hero.excerpt}
                  </p>
                  <Link href={postPath(hero)} className="btn-primary mt-5 text-sm">
                    Read Article
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
                      <path d="M5 12h14M13 6l6 6-6 6" />
                    </svg>
                  </Link>
                </div>
              </div>
            </article>
          )}
        </div>

        {/* Stats strip */}
        <div className="mx-auto max-w-7xl px-4 pb-4 sm:px-6">
          <div className="glass grid grid-cols-2 divide-white/8 rounded-2xl sm:grid-cols-4 sm:divide-x">
            {[
              { value: latest.total + (hero ? 1 : 0), label: "Articles published" },
              { value: categories.length, label: "Categories" },
              { value: totalViews, label: "Total reads" },
              { value: tags.length, label: "Topics covered" },
            ].map((stat) => (
              <div key={stat.label} className="px-6 py-5 text-center">
                <p className="font-display text-2xl font-bold gradient-text sm:text-3xl">
                  {stat.value.toLocaleString()}
                </p>
                <p className="mt-1 text-xs text-muted">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        {/* ---------- Trending ---------- */}
        {trending.items.length > 0 && (
          <section aria-labelledby="trending-heading" className="mt-20">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="eyebrow">What&apos;s hot</p>
                <h2 id="trending-heading" className="font-display mt-2 text-2xl font-bold sm:text-3xl">
                  Trending <span className="gradient-text">Now</span>
                </h2>
              </div>
              <Link href="/trending" className="btn-ghost shrink-0 !px-4 !py-2 text-sm">
                Top 10 →
              </Link>
            </div>
            <div className="mt-7 grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
              {trending.items.map((post, i) => (
                <div key={post.id} className="relative">
                  <span
                    aria-hidden="true"
                    className="font-display absolute -top-3 left-4 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-pulse to-fuchsia-pop text-sm font-bold text-white shadow-lg shadow-fuchsia-pop/30"
                  >
                    {i + 1}
                  </span>
                  <PostCard post={post} />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ---------- Latest ---------- */}
        <section aria-labelledby="latest-heading" className="mt-20">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="eyebrow">Fresh off the press</p>
              <h2 id="latest-heading" className="font-display mt-2 text-2xl font-bold sm:text-3xl">
                Latest <span className="gradient-text">Articles</span>
              </h2>
            </div>
          </div>
          {latest.items.length > 0 ? (
            <>
              <div className="mt-7 grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-3 xl:grid-cols-4">
                {latest.items.map((post) => (
                  <PostCard key={post.id} post={post} />
                ))}
              </div>
              <Pagination page={latest.page} totalPages={latest.totalPages} basePath="/" />
            </>
          ) : (
            <p className="mt-6 text-muted">No posts published yet — check back soon.</p>
          )}
        </section>

        {/* ---------- Tags (filters only) ---------- */}
        {pageNum === 1 && tags.length > 0 && (
          <section aria-labelledby="tags-heading" className="mt-20 pb-4">
            <div className="glow-border relative overflow-hidden rounded-3xl p-8 sm:p-12">
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-pulse/20 blur-3xl"
              />
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-cyan-glow/10 blur-3xl"
              />
              <p className="eyebrow">Find your topic</p>
              <h2 id="tags-heading" className="font-display mt-2 text-2xl font-bold sm:text-3xl">
                Explore by <span className="gradient-text">Tag</span>
              </h2>
              <p className="mt-1.5 text-sm text-muted">
                Tags filter every article — pick one to dive in.
              </p>
              <div className="relative mt-6 flex flex-wrap gap-2.5">
                {tags.map((t) => (
                  <Link key={t.id} href={`/?tag=${t.slug}`} className="chip-tag px-4 py-2 text-sm">
                    #{t.name}
                    <span className="ml-1.5 text-xs opacity-70">{t.post_count}</span>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}
      </div>
    </>
  );
}

/* ---------- Filtered results (replaces the old /blog listing) ---------- */

function FilteredResults({
  pageNum,
  filters,
  perPage,
  categories,
  tags,
}: {
  pageNum: number;
  filters: HomeFilters;
  perPage: number;
  categories: ReturnType<typeof getCategories>;
  tags: ReturnType<typeof getTags>;
}) {
  const { q, tag, category } = filters;
  const posts = getPosts({ page: pageNum, perPage, q, category, tag });
  if (pageNum > 1 && pageNum > posts.totalPages) notFound();

  const filterHref = (next: Partial<HomeFilters>) => {
    const merged = { q, category, tag, ...next };
    const sp = new URLSearchParams();
    if (merged.q) sp.set("q", merged.q);
    if (merged.category) sp.set("category", merged.category);
    if (merged.tag) sp.set("tag", merged.tag);
    const qs = sp.toString();
    return qs ? `/?${qs}` : "/";
  };

  const activeFilters = [
    q && { label: `Search: “${q}”`, clear: filterHref({ q: undefined }) },
    category && {
      label: `Category: ${categories.find((c) => c.slug === category)?.name ?? category}`,
      clear: filterHref({ category: undefined }),
    },
    tag && {
      label: `Tag: #${tags.find((t) => t.slug === tag)?.name ?? tag}`,
      clear: filterHref({ tag: undefined }),
    },
  ].filter(Boolean) as Array<{ label: string; clear: string }>;

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      <div className="text-center">
        <p className="eyebrow justify-center">Articles</p>
        <h1 className="font-display mt-3 text-3xl font-bold sm:text-4xl">
          {q ? (
            <>Results for <span className="gradient-text">“{q}”</span></>
          ) : tag ? (
            <>Tagged <span className="gradient-text">#{tags.find((t) => t.slug === tag)?.name ?? tag}</span></>
          ) : (
            <>Filtered <span className="gradient-text">Articles</span></>
          )}
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-muted">
          {posts.total} article{posts.total === 1 ? "" : "s"} matching your filters.
        </p>
        <div className="mt-6">
          <SearchBar defaultValue={q ?? ""} />
        </div>
      </div>

      {/* Category filter chips */}
      <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
        <Link
          href={filterHref({ category: undefined })}
          className={`rounded-full px-4 py-1.5 text-sm transition-all ${
            !category ? "btn-primary !py-1.5" : "glass text-muted hover:text-white"
          }`}
        >
          All
        </Link>
        {categories.map((c) => (
          <Link
            key={c.id}
            href={filterHref({ category: c.slug })}
            className={`rounded-full px-4 py-1.5 text-sm transition-all ${
              category === c.slug ? "btn-primary !py-1.5" : "glass text-muted hover:text-white"
            }`}
          >
            {c.name}
          </Link>
        ))}
      </div>

      {/* Tag filter chips */}
      {tags.length > 0 && (
        <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
          {tags.map((t) => (
            <Link
              key={t.id}
              href={filterHref({ tag: tag === t.slug ? undefined : t.slug })}
              className={`px-3 py-1 text-xs ${
                tag === t.slug ? "chip-tag !border-neon/70 !bg-neon/20 !text-neon" : "chip-tag"
              }`}
            >
              #{t.name}
            </Link>
          ))}
        </div>
      )}

      {activeFilters.length > 0 && (
        <div className="mt-6 flex flex-wrap items-center justify-center gap-2 text-sm">
          {activeFilters.map((f) => (
            <Link
              key={f.label}
              href={f.clear}
              className="glass flex items-center gap-2 rounded-full px-3.5 py-1.5 text-white/90 hover:border-red-400/40"
            >
              {f.label} <span aria-hidden="true" className="text-muted">✕</span>
            </Link>
          ))}
          <Link href="/" className="text-neon hover:opacity-80">
            Clear all
          </Link>
        </div>
      )}

      {posts.items.length > 0 ? (
        <>
          <div className="mt-10 grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-3 xl:grid-cols-4">
            {posts.items.map((post, i) => (
              <PostCard key={post.id} post={post} priority={i < 3 && pageNum === 1} />
            ))}
          </div>
          <Pagination
            page={posts.page}
            totalPages={posts.totalPages}
            basePath="/"
            searchParams={{ q, category, tag }}
          />
        </>
      ) : (
        <div className="glass mx-auto mt-12 max-w-md rounded-2xl p-10 text-center">
          <p className="text-4xl" aria-hidden="true">🛰️</p>
          <h2 className="font-display mt-4 text-xl font-bold">Nothing found</h2>
          <p className="mt-2 text-sm text-muted">
            No articles match your current filters. Try a different search or clear the filters.
          </p>
          <Link href="/" className="btn-primary mt-6">
            View all posts
          </Link>
        </div>
      )}
    </div>
  );
}
