import { getDb } from "./db";
import { isPageLikeSlug, RESERVED_SLUGS } from "./urls";
import { isValidSlug, slugify } from "./slugify";
import {
  readingTimeFromHtml,
  sanitizeContent,
  sanitizeInline,
  sanitizeText,
} from "./sanitize";
import type { Post } from "./types";

export interface PostInput {
  title: string;
  slug?: string;
  excerpt?: string;
  content?: string;
  featured_image?: string;
  image_alt?: string;
  category_id?: number | null;
  status?: "draft" | "published";
  is_featured?: boolean;
  is_trending?: boolean;
  is_pinned?: boolean;
  author_name?: string;
  seo_title?: string;
  seo_description?: string;
  canonical_url?: string;
  published_at?: string | null;
  tag_ids?: number[];
  faqs?: Array<{ question: string; answer: string }>;
  images?: Array<{ url: string; alt?: string }>;
}

export class ValidationError extends Error {}

function toSqlDate(value: string | null | undefined): string | null {
  if (!value) return null;
  const d = new Date(value);
  if (isNaN(d.getTime())) return null;
  return d.toISOString().replace("T", " ").slice(0, 19);
}

function validateImagePath(p: string): string {
  const clean = sanitizeText(p).slice(0, 500);
  if (!clean) return "";
  if (!/^(\/uploads\/[a-zA-Z0-9._-]+|https:\/\/[^\s"'<>]+)$/.test(clean)) {
    throw new ValidationError("Featured image must be an uploaded file or an https URL");
  }
  return clean;
}

function normalizePostInput(input: PostInput, existingId?: number) {
  const db = getDb();
  const title = sanitizeText(input.title ?? "").slice(0, 200);
  if (!title) throw new ValidationError("Title is required");

  let slug = (input.slug ? sanitizeText(input.slug) : slugify(title)).toLowerCase();
  if (!isValidSlug(slug)) slug = slugify(slug);
  if (!slug || !isValidSlug(slug)) throw new ValidationError("Slug is invalid");
  // /<category>/page2 style pagination URLs must never collide with a post.
  if (isPageLikeSlug(slug)) {
    throw new ValidationError(`"${slug}" conflicts with pagination URLs — pick a different slug`);
  }

  const clash = db
    .prepare("SELECT id FROM posts WHERE slug = ? AND id != ?")
    .get(slug, existingId ?? -1);
  if (clash) throw new ValidationError("A post with this slug already exists");

  let categoryId: number | null = null;
  if (input.category_id != null && input.category_id !== 0) {
    const cat = db.prepare("SELECT id FROM categories WHERE id = ?").get(Number(input.category_id));
    if (!cat) throw new ValidationError("Category does not exist");
    categoryId = Number(input.category_id);
  }

  const status = input.status === "published" ? "published" : "draft";
  const content = sanitizeContent(input.content ?? "");

  const canonical = sanitizeText(input.canonical_url ?? "").slice(0, 500);
  if (canonical && !/^https?:\/\/[^\s"'<>]+$/.test(canonical)) {
    throw new ValidationError("Canonical URL must be a valid http(s) URL");
  }

  let publishedAt = toSqlDate(input.published_at);
  if (status === "published" && !publishedAt) {
    publishedAt = new Date().toISOString().replace("T", " ").slice(0, 19);
  }

  const faqs = (input.faqs ?? [])
    .map((f) => ({
      question: sanitizeText(f.question ?? "").slice(0, 300),
      answer: sanitizeInline(f.answer ?? "").slice(0, 5000),
    }))
    .filter((f) => f.question && f.answer)
    .slice(0, 30);

  const images = (input.images ?? [])
    .map((img) => ({
      url: validateImagePath(img.url ?? ""),
      alt: sanitizeText(img.alt ?? "").slice(0, 300),
    }))
    .filter((img) => img.url)
    .slice(0, 20);

  const tagIds = [...new Set((input.tag_ids ?? []).map(Number).filter((n) => Number.isInteger(n) && n > 0))];
  if (tagIds.length) {
    const found = db
      .prepare(`SELECT COUNT(*) AS n FROM tags WHERE id IN (${tagIds.map(() => "?").join(",")})`)
      .get(...tagIds) as { n: number };
    if (found.n !== tagIds.length) throw new ValidationError("One or more tags do not exist");
  }

  return {
    title,
    slug,
    excerpt: sanitizeText(input.excerpt ?? "").slice(0, 500),
    content,
    featured_image: validateImagePath(input.featured_image ?? ""),
    image_alt: sanitizeText(input.image_alt ?? "").slice(0, 300),
    category_id: categoryId,
    status,
    is_featured: input.is_featured ? 1 : 0,
    is_trending: input.is_trending ? 1 : 0,
    is_pinned: input.is_pinned ? 1 : 0,
    reading_time: readingTimeFromHtml(content),
    author_name: sanitizeText(input.author_name ?? "Admin").slice(0, 100) || "Admin",
    seo_title: sanitizeText(input.seo_title ?? "").slice(0, 200),
    seo_description: sanitizeText(input.seo_description ?? "").slice(0, 400),
    canonical_url: canonical,
    published_at: publishedAt,
    tagIds,
    faqs,
    images,
  };
}

function postSqlParams(data: ReturnType<typeof normalizePostInput>) {
  return {
    title: data.title,
    slug: data.slug,
    excerpt: data.excerpt,
    content: data.content,
    featured_image: data.featured_image,
    image_alt: data.image_alt,
    category_id: data.category_id,
    status: data.status,
    is_featured: data.is_featured,
    is_trending: data.is_trending,
    is_pinned: data.is_pinned,
    reading_time: data.reading_time,
    author_name: data.author_name,
    seo_title: data.seo_title,
    seo_description: data.seo_description,
    canonical_url: data.canonical_url,
    published_at: data.published_at,
  };
}

export function createPost(input: PostInput): Post {
  const db = getDb();
  const data = normalizePostInput(input);
  const tx = db.transaction(() => {
    const info = db
      .prepare(
        `INSERT INTO posts (title, slug, excerpt, content, featured_image, image_alt, category_id,
          status, is_featured, is_trending, is_pinned, reading_time, author_name,
          seo_title, seo_description, canonical_url, published_at)
         VALUES (@title, @slug, @excerpt, @content, @featured_image, @image_alt, @category_id,
          @status, @is_featured, @is_trending, @is_pinned, @reading_time, @author_name,
          @seo_title, @seo_description, @canonical_url, @published_at)`
      )
      .run(postSqlParams(data));
    const postId = Number(info.lastInsertRowid);
    syncPostRelations(postId, data.tagIds, data.faqs, data.images);
    return postId;
  });
  const id = tx();
  return getPostRow(id);
}

export function updatePost(id: number, input: PostInput): Post {
  const db = getDb();
  const existing = db.prepare("SELECT id FROM posts WHERE id = ?").get(id);
  if (!existing) throw new ValidationError("Post not found");
  const data = normalizePostInput(input, id);
  const tx = db.transaction(() => {
    db.prepare(
      `UPDATE posts SET title=@title, slug=@slug, excerpt=@excerpt, content=@content,
        featured_image=@featured_image, image_alt=@image_alt, category_id=@category_id,
        status=@status, is_featured=@is_featured, is_trending=@is_trending, is_pinned=@is_pinned,
        reading_time=@reading_time, author_name=@author_name, seo_title=@seo_title,
        seo_description=@seo_description, canonical_url=@canonical_url, published_at=@published_at,
        updated_at=datetime('now')
       WHERE id=@id`
    ).run({ ...postSqlParams(data), id });
    syncPostRelations(id, data.tagIds, data.faqs, data.images);
  });
  tx();
  return getPostRow(id);
}

function syncPostRelations(
  postId: number,
  tagIds: number[],
  faqs: Array<{ question: string; answer: string }>,
  images: Array<{ url: string; alt: string }>
) {
  const db = getDb();
  db.prepare("DELETE FROM post_tags WHERE post_id = ?").run(postId);
  const linkTag = db.prepare("INSERT INTO post_tags (post_id, tag_id) VALUES (?, ?)");
  for (const tagId of tagIds) linkTag.run(postId, tagId);

  db.prepare("DELETE FROM post_faqs WHERE post_id = ?").run(postId);
  const insertFaq = db.prepare(
    "INSERT INTO post_faqs (post_id, question, answer, sort_order) VALUES (?, ?, ?, ?)"
  );
  faqs.forEach((f, i) => insertFaq.run(postId, f.question, f.answer, i));

  db.prepare("DELETE FROM post_images WHERE post_id = ?").run(postId);
  const insertImage = db.prepare(
    "INSERT INTO post_images (post_id, url, alt, sort_order) VALUES (?, ?, ?, ?)"
  );
  images.forEach((img, i) => insertImage.run(postId, img.url, img.alt, i));
}

export function deletePost(id: number): boolean {
  const db = getDb();
  return db.prepare("DELETE FROM posts WHERE id = ?").run(id).changes > 0;
}

function getPostRow(id: number): Post {
  const db = getDb();
  return db.prepare("SELECT * FROM posts WHERE id = ?").get(id) as Post;
}

// ---------------- Categories ----------------

export interface CategoryInput {
  name: string;
  slug?: string;
  description?: string;
  content?: string;
  seo_title?: string;
  seo_description?: string;
  show_in_nav?: boolean;
  show_in_footer?: boolean;
}

function normalizeCategory(input: CategoryInput) {
  const db = getDb();
  const name = sanitizeText(input.name ?? "").slice(0, 100);
  if (!name) throw new ValidationError("Category name is required");
  let slug = (input.slug ? sanitizeText(input.slug) : slugify(name)).toLowerCase();
  if (!isValidSlug(slug)) slug = slugify(slug);
  if (!slug) throw new ValidationError("Category slug is invalid");
  // Categories live at /<slug>, so the slug must not shadow app routes, pages
  // or /pageN pagination URLs.
  if (RESERVED_SLUGS.has(slug) || isPageLikeSlug(slug)) {
    throw new ValidationError(`"${slug}" is a reserved URL — pick a different slug`);
  }
  if (db.prepare("SELECT id FROM pages WHERE slug = ?").get(slug)) {
    throw new ValidationError(`"${slug}" is already used by a site page — pick a different slug`);
  }
  return {
    name,
    slug,
    description: sanitizeText(input.description ?? "").slice(0, 500),
    content: sanitizeContent(input.content ?? "").slice(0, 50000),
    seo_title: sanitizeText(input.seo_title ?? "").slice(0, 200),
    seo_description: sanitizeText(input.seo_description ?? "").slice(0, 400),
    show_in_nav: input.show_in_nav === false ? 0 : 1,
    show_in_footer: input.show_in_footer === false ? 0 : 1,
  };
}

export function createCategory(input: CategoryInput) {
  const db = getDb();
  const data = normalizeCategory(input);
  const clash = db
    .prepare("SELECT id FROM categories WHERE slug = ? OR name = ?")
    .get(data.slug, data.name);
  if (clash) throw new ValidationError("A category with this name or slug already exists");
  const info = db
    .prepare(
      `INSERT INTO categories (name, slug, description, content, seo_title, seo_description, show_in_nav, show_in_footer)
       VALUES (@name, @slug, @description, @content, @seo_title, @seo_description, @show_in_nav, @show_in_footer)`
    )
    .run(data);
  return db.prepare("SELECT * FROM categories WHERE id = ?").get(Number(info.lastInsertRowid));
}

export function updateCategory(id: number, input: CategoryInput) {
  const db = getDb();
  if (!db.prepare("SELECT id FROM categories WHERE id = ?").get(id))
    throw new ValidationError("Category not found");
  const data = normalizeCategory(input);
  const clash = db
    .prepare("SELECT id FROM categories WHERE (slug = ? OR name = ?) AND id != ?")
    .get(data.slug, data.name, id);
  if (clash) throw new ValidationError("A category with this name or slug already exists");
  db.prepare(
    `UPDATE categories SET name=@name, slug=@slug, description=@description, content=@content,
      seo_title=@seo_title, seo_description=@seo_description,
      show_in_nav=@show_in_nav, show_in_footer=@show_in_footer
     WHERE id=@id`
  ).run({ ...data, id });
  return db.prepare("SELECT * FROM categories WHERE id = ?").get(id);
}

export function deleteCategory(id: number): boolean {
  const db = getDb();
  return db.prepare("DELETE FROM categories WHERE id = ?").run(id).changes > 0;
}

// ---------------- Tags ----------------

export interface TagInput {
  name: string;
  slug?: string;
  description?: string;
}

export function createTag(input: TagInput) {
  const db = getDb();
  const name = sanitizeText(input.name ?? "").slice(0, 60);
  if (!name) throw new ValidationError("Tag name is required");
  let slug = (input.slug ? sanitizeText(input.slug) : slugify(name)).toLowerCase();
  if (!isValidSlug(slug)) slug = slugify(slug);
  if (!slug) throw new ValidationError("Tag slug is invalid");
  const clash = db.prepare("SELECT id FROM tags WHERE slug = ? OR name = ?").get(slug, name);
  if (clash) throw new ValidationError("A tag with this name or slug already exists");
  const info = db
    .prepare("INSERT INTO tags (name, slug, description) VALUES (?, ?, ?)")
    .run(name, slug, sanitizeText(input.description ?? "").slice(0, 300));
  return db.prepare("SELECT * FROM tags WHERE id = ?").get(Number(info.lastInsertRowid));
}

export function updateTag(id: number, input: TagInput) {
  const db = getDb();
  if (!db.prepare("SELECT id FROM tags WHERE id = ?").get(id))
    throw new ValidationError("Tag not found");
  const name = sanitizeText(input.name ?? "").slice(0, 60);
  if (!name) throw new ValidationError("Tag name is required");
  let slug = (input.slug ? sanitizeText(input.slug) : slugify(name)).toLowerCase();
  if (!isValidSlug(slug)) slug = slugify(slug);
  const clash = db
    .prepare("SELECT id FROM tags WHERE (slug = ? OR name = ?) AND id != ?")
    .get(slug, name, id);
  if (clash) throw new ValidationError("A tag with this name or slug already exists");
  db.prepare("UPDATE tags SET name=?, slug=?, description=? WHERE id=?").run(
    name,
    slug,
    sanitizeText(input.description ?? "").slice(0, 300),
    id
  );
  return db.prepare("SELECT * FROM tags WHERE id = ?").get(id);
}

export function deleteTag(id: number): boolean {
  const db = getDb();
  return db.prepare("DELETE FROM tags WHERE id = ?").run(id).changes > 0;
}

// ---------------- Static pages ----------------

export interface PageInput {
  title: string;
  slug?: string;
  content?: string;
  seo_title?: string;
  seo_description?: string;
}

export function updateStaticPage(id: number, input: PageInput) {
  const db = getDb();
  const existing = db.prepare("SELECT slug FROM pages WHERE id = ?").get(id) as
    | { slug: string }
    | undefined;
  if (!existing) throw new ValidationError("Page not found");
  const title = sanitizeText(input.title ?? "").slice(0, 150);
  if (!title) throw new ValidationError("Page title is required");

  // Pages live at /<slug>, so a renamed slug must not shadow routes,
  // pagination URLs, categories or another page.
  let slug = existing.slug;
  if (input.slug !== undefined) {
    slug = sanitizeText(input.slug).toLowerCase();
    if (!isValidSlug(slug)) slug = slugify(slug);
    if (!slug || !isValidSlug(slug)) throw new ValidationError("Page slug is invalid");
    if (RESERVED_SLUGS.has(slug) || isPageLikeSlug(slug)) {
      throw new ValidationError(`"${slug}" is a reserved URL — pick a different slug`);
    }
    if (db.prepare("SELECT id FROM categories WHERE slug = ?").get(slug)) {
      throw new ValidationError(`"${slug}" is already used by a category — pick a different slug`);
    }
    if (db.prepare("SELECT id FROM pages WHERE slug = ? AND id != ?").get(slug, id)) {
      throw new ValidationError(`Another page already uses the slug "${slug}"`);
    }
  }

  db.prepare(
    "UPDATE pages SET title=?, slug=?, content=?, seo_title=?, seo_description=?, updated_at=datetime('now') WHERE id=?"
  ).run(
    title,
    slug,
    sanitizeContent(input.content ?? ""),
    sanitizeText(input.seo_title ?? "").slice(0, 200),
    sanitizeText(input.seo_description ?? "").slice(0, 400),
    id
  );
  return db.prepare("SELECT * FROM pages WHERE id = ?").get(id);
}
