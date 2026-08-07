import { getDb } from "./db";
import type { Category, Paginated, Post, PostFaq, PostImage, StaticPage, Tag } from "./types";

const POST_COLUMNS = `
  p.id, p.title, p.slug, p.excerpt, p.content, p.featured_image, p.image_alt,
  p.category_id, p.status, p.is_featured, p.is_trending, p.is_pinned,
  p.view_count, p.reading_time, p.author_name, p.seo_title, p.seo_description,
  p.canonical_url, p.published_at, p.created_at, p.updated_at,
  c.name AS category_name, c.slug AS category_slug
`;

export interface PostQuery {
  page?: number;
  perPage?: number;
  category?: string; // category slug
  tag?: string; // tag slug
  q?: string; // search query
  status?: "draft" | "published" | "all";
  featured?: boolean;
  trending?: boolean;
  pinned?: boolean;
  orderBy?: "newest" | "views";
  excludeIds?: number[];
}

export function getPosts(query: PostQuery = {}): Paginated<Post> {
  const db = getDb();
  const page = Math.max(1, query.page || 1);
  const perPage = Math.min(50, Math.max(1, query.perPage || 9));

  const where: string[] = [];
  const params: (string | number)[] = [];

  const status = query.status ?? "published";
  if (status !== "all") {
    where.push("p.status = ?");
    params.push(status);
    if (status === "published") where.push("p.published_at IS NOT NULL");
  }
  if (query.category) {
    where.push("c.slug = ?");
    params.push(query.category);
  }
  if (query.tag) {
    where.push(
      "p.id IN (SELECT pt.post_id FROM post_tags pt JOIN tags t ON t.id = pt.tag_id WHERE t.slug = ?)"
    );
    params.push(query.tag);
  }
  if (query.q) {
    const like = `%${query.q.replace(/[%_]/g, "")}%`;
    where.push("(p.title LIKE ? OR p.excerpt LIKE ? OR p.content LIKE ?)");
    params.push(like, like, like);
  }
  if (query.featured) where.push("p.is_featured = 1");
  if (query.trending) where.push("p.is_trending = 1");
  if (query.pinned) where.push("p.is_pinned = 1");
  if (query.excludeIds?.length) {
    where.push(`p.id NOT IN (${query.excludeIds.map(() => "?").join(",")})`);
    params.push(...query.excludeIds);
  }

  const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";
  const orderSql =
    query.orderBy === "views"
      ? "ORDER BY p.view_count DESC, p.published_at DESC"
      : "ORDER BY COALESCE(p.published_at, p.created_at) DESC";

  const total = (
    db
      .prepare(
        `SELECT COUNT(*) AS n FROM posts p LEFT JOIN categories c ON c.id = p.category_id ${whereSql}`
      )
      .get(...params) as { n: number }
  ).n;

  const items = db
    .prepare(
      `SELECT ${POST_COLUMNS} FROM posts p LEFT JOIN categories c ON c.id = p.category_id
       ${whereSql} ${orderSql} LIMIT ? OFFSET ?`
    )
    .all(...params, perPage, (page - 1) * perPage) as Post[];

  attachTags(items);

  return { items, total, page, perPage, totalPages: Math.max(1, Math.ceil(total / perPage)) };
}

function attachTags(posts: Post[]): void {
  if (!posts.length) return;
  const db = getDb();
  const ids = posts.map((p) => p.id);
  const rows = db
    .prepare(
      `SELECT pt.post_id, t.id, t.name, t.slug, t.description FROM post_tags pt
       JOIN tags t ON t.id = pt.tag_id WHERE pt.post_id IN (${ids.map(() => "?").join(",")})
       ORDER BY t.name`
    )
    .all(...ids) as Array<Tag & { post_id: number }>;
  const byPost = new Map<number, Tag[]>();
  for (const r of rows) {
    const list = byPost.get(r.post_id) || [];
    list.push({ id: r.id, name: r.name, slug: r.slug, description: r.description });
    byPost.set(r.post_id, list);
  }
  for (const p of posts) p.tags = byPost.get(p.id) || [];
}

export function getPostBySlug(slug: string, opts: { publishedOnly?: boolean } = {}): Post | null {
  const db = getDb();
  const publishedOnly = opts.publishedOnly ?? true;
  const post = db
    .prepare(
      `SELECT ${POST_COLUMNS} FROM posts p LEFT JOIN categories c ON c.id = p.category_id
       WHERE p.slug = ? ${publishedOnly ? "AND p.status = 'published' AND p.published_at IS NOT NULL" : ""}`
    )
    .get(slug) as Post | undefined;
  if (!post) return null;
  attachTags([post]);
  post.faqs = getPostFaqs(post.id);
  post.images = getPostImages(post.id);
  return post;
}

export function getPostById(id: number): Post | null {
  const db = getDb();
  const post = db
    .prepare(
      `SELECT ${POST_COLUMNS} FROM posts p LEFT JOIN categories c ON c.id = p.category_id WHERE p.id = ?`
    )
    .get(id) as Post | undefined;
  if (!post) return null;
  attachTags([post]);
  post.faqs = getPostFaqs(post.id);
  post.images = getPostImages(post.id);
  return post;
}

export function getPostImages(postId: number): PostImage[] {
  const db = getDb();
  return db
    .prepare(
      "SELECT id, post_id, url, alt, sort_order FROM post_images WHERE post_id = ? ORDER BY sort_order, id"
    )
    .all(postId) as PostImage[];
}

export function getPostFaqs(postId: number): PostFaq[] {
  const db = getDb();
  return db
    .prepare(
      "SELECT id, post_id, question, answer, sort_order FROM post_faqs WHERE post_id = ? ORDER BY sort_order, id"
    )
    .all(postId) as PostFaq[];
}

export function getRelatedPosts(post: Post, limit = 3): Post[] {
  const db = getDb();
  const rows = db
    .prepare(
      `SELECT ${POST_COLUMNS} FROM posts p LEFT JOIN categories c ON c.id = p.category_id
       WHERE p.status = 'published' AND p.published_at IS NOT NULL AND p.id != ?
       ORDER BY (p.category_id = ?) DESC, p.published_at DESC LIMIT ?`
    )
    .all(post.id, post.category_id ?? -1, limit) as Post[];
  attachTags(rows);
  return rows;
}

export function incrementViewCount(slug: string): number | null {
  const db = getDb();
  const info = db
    .prepare(
      "UPDATE posts SET view_count = view_count + 1 WHERE slug = ? AND status = 'published'"
    )
    .run(slug);
  if (info.changes === 0) return null;
  const row = db.prepare("SELECT view_count FROM posts WHERE slug = ?").get(slug) as
    | { view_count: number }
    | undefined;
  return row?.view_count ?? null;
}

// ---------------- Categories ----------------

export function getCategories(): Category[] {
  const db = getDb();
  return db
    .prepare(
      `SELECT c.*, (SELECT COUNT(*) FROM posts p WHERE p.category_id = c.id AND p.status = 'published') AS post_count
       FROM categories c ORDER BY c.name`
    )
    .all() as Category[];
}

export function getCategoryBySlug(slug: string): Category | null {
  const db = getDb();
  return (
    (db
      .prepare(
        `SELECT c.*, (SELECT COUNT(*) FROM posts p WHERE p.category_id = c.id AND p.status = 'published') AS post_count
         FROM categories c WHERE c.slug = ?`
      )
      .get(slug) as Category | undefined) ?? null
  );
}

// ---------------- Tags ----------------

export function getTags(): Tag[] {
  const db = getDb();
  return db
    .prepare(
      `SELECT t.*, (SELECT COUNT(*) FROM post_tags pt JOIN posts p ON p.id = pt.post_id
        WHERE pt.tag_id = t.id AND p.status = 'published') AS post_count
       FROM tags t ORDER BY t.name`
    )
    .all() as Tag[];
}

export function getTagBySlug(slug: string): Tag | null {
  const db = getDb();
  return (
    (db.prepare("SELECT * FROM tags WHERE slug = ?").get(slug) as Tag | undefined) ?? null
  );
}

// ---------------- Static pages ----------------

export function getStaticPages(): StaticPage[] {
  const db = getDb();
  return db.prepare("SELECT * FROM pages ORDER BY id").all() as StaticPage[];
}

export function getStaticPageBySlug(slug: string): StaticPage | null {
  const db = getDb();
  return (
    (db.prepare("SELECT * FROM pages WHERE slug = ?").get(slug) as StaticPage | undefined) ?? null
  );
}

/** The (renamable) page that lists all categories, if it exists. */
export function getCategoriesPage(): StaticPage | null {
  const db = getDb();
  return (
    (db.prepare("SELECT * FROM pages WHERE template = 'categories'").get() as
      | StaticPage
      | undefined) ?? null
  );
}

// ---------------- Sitemap helpers ----------------

export function getAllPublishedSlugs(): Array<{
  slug: string;
  category_slug: string | null;
  updated_at: string;
}> {
  const db = getDb();
  return db
    .prepare(
      `SELECT p.slug, c.slug AS category_slug, p.updated_at FROM posts p
       LEFT JOIN categories c ON c.id = p.category_id
       WHERE p.status = 'published' AND p.published_at IS NOT NULL
       ORDER BY p.published_at DESC`
    )
    .all() as Array<{ slug: string; category_slug: string | null; updated_at: string }>;
}
