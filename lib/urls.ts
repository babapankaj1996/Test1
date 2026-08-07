/**
 * Clean URL structure:
 *   post     → /<category-slug>/<post-slug>
 *   category → /<category-slug>
 *   page     → /<page-slug>
 * Posts without a category fall back to the "uncategorized" segment.
 * Old /blog/<slug> and /category/<slug> URLs 308-redirect to these.
 */

export const UNCATEGORIZED_SLUG = "uncategorized";

/** First URL segments that can never be category or page slugs. */
export const RESERVED_SLUGS = new Set([
  "blog",
  "category",
  "trending",
  "admin",
  "api",
  "uploads",
  "sitemap.xml",
  "robots.txt",
  "favicon.ico",
  "icon.svg",
  "_next",
  UNCATEGORIZED_SLUG,
]);

/**
 * Path-based pagination segment: /page2, /technology/page3, …
 * Returns the page number, or null if the segment isn't a pagination segment.
 */
export function parsePageSegment(segment: string): number | null {
  const m = /^page([2-9]|[1-9][0-9]+)$/.exec(segment);
  return m ? parseInt(m[1], 10) : null;
}

/** True for slugs that would collide with pagination URLs (page2, page3, …). */
export function isPageLikeSlug(slug: string): boolean {
  return /^page\d*$/.test(slug);
}

/** Build a paginated path: page 1 → basePath, page N → basePath + /pageN. */
export function pagedPath(basePath: string, page: number): string {
  const clean = basePath === "/" ? "" : basePath.replace(/\/+$/, "");
  return page <= 1 ? clean || "/" : `${clean}/page${page}`;
}

export function postPath(post: { slug: string; category_slug?: string | null }): string {
  return `/${post.category_slug || UNCATEGORIZED_SLUG}/${post.slug}`;
}

export function categoryPath(slug: string): string {
  return `/${slug}`;
}
