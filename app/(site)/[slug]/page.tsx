import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getCategories, getCategoryBySlug, getStaticPageBySlug } from "@/lib/posts";
import type { StaticPage } from "@/lib/types";
import { getSettings } from "@/lib/settings";
import { absoluteUrl } from "@/lib/site";
import { pagedPath, parsePageSegment } from "@/lib/urls";
import { formatDate } from "@/lib/format";
import JsonLd from "@/components/JsonLd";
import HomeView from "@/components/HomeView";
import CategoryView from "@/components/CategoryView";
import { breadcrumbSchema } from "@/lib/schema";

export const dynamic = "force-dynamic";

/**
 * Top-level slug route:
 *   /page2, /page3 …  → homepage pagination
 *   /about, /privacy… → static page
 *   /technology …     → category archive (page 1)
 */

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const settings = getSettings();

  const pageNum = parsePageSegment(slug);
  if (pageNum) {
    const title = `Latest Articles — Page ${pageNum}`;
    return {
      title,
      description: settings.site_description,
      alternates: { canonical: absoluteUrl(pagedPath("/", pageNum)) },
      openGraph: { title, url: absoluteUrl(pagedPath("/", pageNum)), type: "website" },
    };
  }

  const page = getStaticPageBySlug(slug);
  if (page) {
    const title = page.seo_title || page.title;
    const description = page.seo_description;
    const url = absoluteUrl(`/${page.slug}`);
    return {
      title,
      description,
      alternates: { canonical: url },
      openGraph: { title, description, url, type: "website" },
      twitter: { card: "summary", title, description },
    };
  }

  const category = getCategoryBySlug(slug);
  if (category) {
    const title = category.seo_title || `${category.name} Articles`;
    const description =
      category.seo_description ||
      category.description ||
      `All ${category.name} articles on ${settings.site_name}.`;
    const url = absoluteUrl(`/${category.slug}`);
    return {
      title,
      description,
      alternates: { canonical: url },
      openGraph: { title, description, url, type: "website" },
      twitter: { card: "summary_large_image", title, description },
    };
  }

  return { title: "Page not found" };
}

export default async function SlugPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ q?: string; tag?: string; category?: string }>;
}) {
  const { slug } = await params;

  const pageNum = parsePageSegment(slug);
  if (pageNum) {
    const sp = await searchParams;
    return (
      <HomeView
        pageNum={pageNum}
        filters={{
          q: sp.q?.trim().slice(0, 100) || undefined,
          tag: sp.tag || undefined,
          category: sp.category || undefined,
        }}
      />
    );
  }

  const page = getStaticPageBySlug(slug);
  if (page) {
    if (page.template === "categories") return <CategoriesIndex page={page} />;
    return (
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <JsonLd
          data={breadcrumbSchema([
            { name: "Home", url: "/" },
            { name: page.title, url: `/${page.slug}` },
          ])}
        />
        <nav aria-label="Breadcrumb" className="mb-6 text-sm text-muted">
          <ol className="flex flex-wrap items-center gap-1.5">
            <li>
              <Link href="/" className="transition-colors hover:text-neon">Home</Link>
            </li>
            <li aria-hidden="true">/</li>
            <li aria-current="page" className="text-white/80">{page.title}</li>
          </ol>
        </nav>

        <h1 className="font-display text-3xl font-bold sm:text-4xl">
          <span className="gradient-text">{page.title}</span>
        </h1>
        <p className="mt-2 text-sm text-muted">Last updated: {formatDate(page.updated_at)}</p>

        <div className="prose-content mt-8" dangerouslySetInnerHTML={{ __html: page.content }} />
      </div>
    );
  }

  const category = getCategoryBySlug(slug);
  if (!category) notFound();

  return <CategoryView category={category} pageNum={1} />;
}

/* ---------- Categories index (renamable page, template = 'categories') ---------- */

function CategoriesIndex({ page }: { page: StaticPage }) {
  const categories = getCategories();

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      <JsonLd
        data={breadcrumbSchema([
          { name: "Home", url: "/" },
          { name: page.title, url: `/${page.slug}` },
        ])}
      />
      <nav aria-label="Breadcrumb" className="mb-6 text-sm text-muted">
        <ol className="flex flex-wrap items-center gap-1.5">
          <li>
            <Link href="/" className="transition-colors hover:text-neon">Home</Link>
          </li>
          <li aria-hidden="true">/</li>
          <li aria-current="page" className="text-white/80">{page.title}</li>
        </ol>
      </nav>

      <header className="text-center">
        <p className="eyebrow justify-center">Browse by topic</p>
        <h1 className="font-display mt-3 text-3xl font-bold sm:text-4xl">
          <span className="gradient-text">{page.title}</span>
        </h1>
        {page.content && (
          <div
            className="prose-content mx-auto mt-4 max-w-xl !text-base"
            dangerouslySetInnerHTML={{ __html: page.content }}
          />
        )}
      </header>

      {categories.length > 0 ? (
        <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={`/${cat.slug}`}
              className="card-hover glass group flex flex-col rounded-2xl p-7"
            >
              <div className="flex items-center justify-between gap-3">
                <span
                  aria-hidden="true"
                  className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-pulse to-fuchsia-pop text-lg font-bold text-white shadow-lg shadow-fuchsia-pop/25"
                >
                  {cat.name.charAt(0)}
                </span>
                <span className="chip-tag px-3 py-1 text-xs">
                  {cat.post_count} article{cat.post_count === 1 ? "" : "s"}
                </span>
              </div>
              <h2 className="font-display mt-5 text-xl font-bold transition-colors group-hover:text-glow">
                {cat.name}
              </h2>
              {cat.description && (
                <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted">
                  {cat.description}
                </p>
              )}
              <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-neon">
                Explore
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
                  <path d="M5 12h14M13 6l6 6-6 6" />
                </svg>
              </span>
            </Link>
          ))}
        </div>
      ) : (
        <p className="mt-10 text-center text-muted">No categories with published posts yet.</p>
      )}
    </div>
  );
}
