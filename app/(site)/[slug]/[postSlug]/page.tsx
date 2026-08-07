import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import { getCategoryBySlug, getPostBySlug, getRelatedPosts } from "@/lib/posts";
import { getSettings } from "@/lib/settings";
import { absoluteUrl } from "@/lib/site";
import { pagedPath, parsePageSegment, postPath, UNCATEGORIZED_SLUG } from "@/lib/urls";
import CategoryView from "@/components/CategoryView";
import { formatDate, toIsoDate } from "@/lib/format";
import { articleSchema, breadcrumbSchema, faqSchema } from "@/lib/schema";
import JsonLd from "@/components/JsonLd";
import PostCard from "@/components/PostCard";
import FaqAccordion from "@/components/FaqAccordion";
import ShareButtons from "@/components/ShareButtons";
import ViewCounter from "@/components/ViewCounter";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; postSlug: string }>;
}): Promise<Metadata> {
  const { slug, postSlug } = await params;

  // /<category>/page2 → paginated category archive
  const pageNum = parsePageSegment(postSlug);
  if (pageNum) {
    const category = getCategoryBySlug(slug);
    if (!category) return { title: "Page not found" };
    const title = `${category.seo_title || `${category.name} Articles`} — Page ${pageNum}`;
    const url = absoluteUrl(pagedPath(`/${category.slug}`, pageNum));
    return {
      title,
      description: category.seo_description || category.description,
      alternates: { canonical: url },
      openGraph: { title, url, type: "website" },
    };
  }

  const post = getPostBySlug(postSlug);
  if (!post) return { title: "Post not found" };

  const title = post.seo_title || post.title;
  const description = post.seo_description || post.excerpt;
  const url = post.canonical_url || absoluteUrl(postPath(post));
  const image = post.featured_image ? absoluteUrl(post.featured_image) : undefined;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      type: "article",
      publishedTime: toIsoDate(post.published_at),
      modifiedTime: toIsoDate(post.updated_at),
      authors: [post.author_name],
      section: post.category_name ?? undefined,
      tags: post.tags?.map((t) => t.name),
      images: image ? [{ url: image, alt: post.image_alt || post.title }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: image ? [image] : undefined,
    },
  };
}

export default async function PostPage({
  params,
}: {
  params: Promise<{ slug: string; postSlug: string }>;
}) {
  const { slug, postSlug } = await params;

  // /<category>/page2 → paginated category archive
  const pageNum = parsePageSegment(postSlug);
  if (pageNum) {
    const category = getCategoryBySlug(slug);
    if (!category) notFound();
    return <CategoryView category={category} pageNum={pageNum} />;
  }

  const post = getPostBySlug(postSlug);
  if (!post) notFound();

  // Enforce the canonical URL: /<category-slug>/<post-slug>. A stale or
  // wrong category segment 308s to the right one (handles category renames).
  const expectedSegment = post.category_slug || UNCATEGORIZED_SLUG;
  if (slug !== expectedSegment) permanentRedirect(postPath(post));

  const settings = getSettings();
  const related = getRelatedPosts(post, 3);
  const postUrl = absoluteUrl(postPath(post));
  const faqLd = faqSchema(post.faqs ?? []);

  const crumbs = [
    { name: "Home", url: "/" },
    ...(post.category_name && post.category_slug
      ? [{ name: post.category_name, url: `/${post.category_slug}` }]
      : []),
    { name: post.title, url: postPath(post) },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <JsonLd data={articleSchema(post, settings.site_name)} />
      {faqLd && <JsonLd data={faqLd} />}
      <JsonLd data={breadcrumbSchema(crumbs)} />

      <article className="mx-auto max-w-3xl">
        <nav aria-label="Breadcrumb" className="mb-6 text-sm text-muted">
          <ol className="flex flex-wrap items-center gap-1.5">
            {crumbs.slice(0, -1).map((c) => (
              <li key={c.url} className="flex items-center gap-1.5">
                <Link href={c.url} className="transition-colors hover:text-neon">
                  {c.name}
                </Link>
                <span aria-hidden="true">/</span>
              </li>
            ))}
            <li aria-current="page" className="line-clamp-1 max-w-[16rem] text-white/80">
              {post.title}
            </li>
          </ol>
        </nav>

        <header>
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {post.category_slug && (
              <Link href={`/${post.category_slug}`} className="chip-category px-3 py-1">
                {post.category_name}
              </Link>
            )}
            {post.is_trending === 1 && (
              <Link href="/trending" className="chip-tag px-3 py-1">🔥 Trending</Link>
            )}
          </div>

          <h1 className="font-display mt-4 text-3xl font-bold leading-tight tracking-tight sm:text-4xl lg:text-[2.6rem]">
            {post.title}
          </h1>

          {post.excerpt && (
            <p className="mt-4 text-lg leading-relaxed text-muted">{post.excerpt}</p>
          )}

          <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2 border-y border-white/10 py-4 text-sm text-muted">
            <span className="flex items-center gap-2">
              <span
                aria-hidden="true"
                className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-pulse to-fuchsia-pop text-xs font-bold text-white"
              >
                {post.author_name.charAt(0).toUpperCase()}
              </span>
              <span className="font-medium text-white/90">{post.author_name}</span>
            </span>
            <time dateTime={toIsoDate(post.published_at)}>{formatDate(post.published_at)}</time>
            <span>{post.reading_time} min read</span>
            <ViewCounter slug={post.slug} initial={post.view_count} />
          </div>
        </header>

        {post.featured_image && (
          <figure className="relative mt-8 aspect-[4/3] overflow-hidden rounded-2xl sm:aspect-[16/9]">
            <Image
              src={post.featured_image}
              alt={post.image_alt || post.title}
              fill
              sizes="(max-width: 768px) 100vw, 768px"
              priority
              className="object-cover"
            />
          </figure>
        )}

        <div
          className="prose-content mt-8"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />

        {(post.images?.length ?? 0) > 0 && (
          <section aria-label="Image gallery" className="mt-10">
            <h2 className="font-display text-xl font-bold">
              Gallery <span className="gradient-text">({post.images!.length})</span>
            </h2>
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {post.images!.map((img, i) => (
                <figure
                  key={img.id}
                  className="group relative aspect-[3/4] overflow-hidden rounded-xl bg-panel"
                >
                  <Image
                    src={img.url}
                    alt={img.alt || `${post.title} — image ${i + 1}`}
                    fill
                    sizes="(max-width: 640px) 50vw, 33vw"
                    loading="lazy"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  {img.alt && (
                    <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent px-3 pb-2 pt-8 text-xs text-white opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                      {img.alt}
                    </figcaption>
                  )}
                </figure>
              ))}
            </div>
          </section>
        )}

        {(post.tags?.length ?? 0) > 0 && (
          <div className="mt-10 flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium text-muted">Tags:</span>
            {post.tags!.map((t) => (
              <Link
                key={t.id}
                href={`/?tag=${t.slug}`}
                className="chip-tag px-3.5 py-1.5 text-xs"
              >
                #{t.name}
              </Link>
            ))}
          </div>
        )}

        <div className="mt-8 border-t border-white/10 pt-6">
          <ShareButtons url={postUrl} title={post.title} />
        </div>

        {post.faqs && post.faqs.length > 0 && <FaqAccordion faqs={post.faqs} />}
      </article>

      {related.length > 0 && (
        <section aria-labelledby="related-heading" className="mx-auto mt-16 max-w-5xl">
          <h2 id="related-heading" className="font-display text-2xl font-bold">
            Related <span className="gradient-text">Articles</span>
          </h2>
          <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((p) => (
              <PostCard key={p.id} post={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
