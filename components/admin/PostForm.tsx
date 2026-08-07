"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Category, Post, Tag } from "@/lib/types";

interface FaqDraft {
  question: string;
  answer: string;
}

interface GalleryDraft {
  url: string;
  alt: string;
}

function clientSlugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 96);
}

export default function PostForm({
  post,
  categories,
  tags,
}: {
  post: Post | null;
  categories: Category[];
  tags: Tag[];
}) {
  const router = useRouter();
  const isEdit = !!post;

  const [title, setTitle] = useState(post?.title ?? "");
  const [slug, setSlug] = useState(post?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(isEdit);
  const [excerpt, setExcerpt] = useState(post?.excerpt ?? "");
  const [content, setContent] = useState(post?.content ?? "");
  const [featuredImage, setFeaturedImage] = useState(post?.featured_image ?? "");
  const [imageAlt, setImageAlt] = useState(post?.image_alt ?? "");
  const [categoryId, setCategoryId] = useState<number | "">(post?.category_id ?? "");
  const [tagIds, setTagIds] = useState<number[]>(post?.tags?.map((t) => t.id) ?? []);
  const [faqs, setFaqs] = useState<FaqDraft[]>(
    post?.faqs?.map((f) => ({ question: f.question, answer: f.answer })) ?? []
  );
  const [gallery, setGallery] = useState<GalleryDraft[]>(
    post?.images?.map((img) => ({ url: img.url, alt: img.alt })) ?? []
  );
  const [galleryUploading, setGalleryUploading] = useState(false);
  const [seoTitle, setSeoTitle] = useState(post?.seo_title ?? "");
  const [seoDescription, setSeoDescription] = useState(post?.seo_description ?? "");
  const [canonicalUrl, setCanonicalUrl] = useState(post?.canonical_url ?? "");
  const [authorName, setAuthorName] = useState(post?.author_name ?? "Admin");
  const [isFeatured, setIsFeatured] = useState(post?.is_featured === 1);
  const [isTrending, setIsTrending] = useState(post?.is_trending === 1);
  const [isPinned, setIsPinned] = useState(post?.is_pinned === 1);
  const [publishedAt, setPublishedAt] = useState(
    post?.published_at ? post.published_at.replace(" ", "T").slice(0, 16) : ""
  );

  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  function onTitleChange(value: string) {
    setTitle(value);
    if (!slugTouched) setSlug(clientSlugify(value));
  }

  async function uploadImage(file: File) {
    setUploading(true);
    setError("");
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/admin/upload", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Upload failed");
        return;
      }
      setFeaturedImage(data.url);
    } catch {
      setError("Upload failed — network error");
    } finally {
      setUploading(false);
    }
  }

  async function uploadGalleryImages(files: FileList) {
    setGalleryUploading(true);
    setError("");
    try {
      for (const file of Array.from(files).slice(0, 20 - gallery.length)) {
        const form = new FormData();
        form.append("file", file);
        const res = await fetch("/api/admin/upload", { method: "POST", body: form });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || "Upload failed");
          break;
        }
        setGallery((prev) => [...prev, { url: data.url, alt: "" }]);
      }
    } catch {
      setError("Upload failed — network error");
    } finally {
      setGalleryUploading(false);
    }
  }

  function moveGalleryImage(index: number, dir: -1 | 1) {
    setGallery((prev) => {
      const next = [...prev];
      const target = index + dir;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  function toggleTag(id: number) {
    setTagIds((prev) => (prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]));
  }

  function updateFaq(index: number, patch: Partial<FaqDraft>) {
    setFaqs((prev) => prev.map((f, i) => (i === index ? { ...f, ...patch } : f)));
  }

  function moveFaq(index: number, dir: -1 | 1) {
    setFaqs((prev) => {
      const next = [...prev];
      const target = index + dir;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  async function save(status: "draft" | "published") {
    setSaving(true);
    setError("");
    setNotice("");
    try {
      const payload = {
        title,
        slug: slug || undefined,
        excerpt,
        content,
        featured_image: featuredImage,
        image_alt: imageAlt,
        category_id: categoryId === "" ? null : Number(categoryId),
        status,
        is_featured: isFeatured,
        is_trending: isTrending,
        is_pinned: isPinned,
        seo_title: seoTitle,
        seo_description: seoDescription,
        canonical_url: canonicalUrl,
        author_name: authorName,
        published_at: publishedAt ? new Date(publishedAt).toISOString() : null,
        tag_ids: tagIds,
        faqs: faqs.filter((f) => f.question.trim() && f.answer.trim()),
        images: gallery.filter((img) => img.url),
      };
      const res = await fetch(isEdit ? `/api/admin/posts/${post!.id}` : "/api/admin/posts", {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to save post");
        return;
      }
      setNotice(status === "published" ? "Post published ✓" : "Draft saved ✓");
      if (!isEdit) {
        router.push(`/admin/posts/${data.id}`);
      } else {
        router.refresh();
      }
    } catch {
      setError("Failed to save — network error");
    } finally {
      setSaving(false);
    }
  }

  const categorySlug =
    categories.find((c) => c.id === (categoryId === "" ? -1 : Number(categoryId)))?.slug ??
    "uncategorized";
  const livePath = `/${categorySlug}/${slug || "post-slug"}`;

  const sectionCls = "glass rounded-xl p-5";
  const labelCls = "mb-1.5 block text-sm font-medium text-white/80";

  return (
    <form onSubmit={(e) => e.preventDefault()} className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <div className="min-w-0 space-y-6">
        {(error || notice) && (
          <p
            role="alert"
            className={`rounded-lg border px-4 py-2.5 text-sm ${
              error
                ? "border-red-500/30 bg-red-500/10 text-red-300"
                : "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
            }`}
          >
            {error || notice}
          </p>
        )}

        <div className={sectionCls}>
          <label htmlFor="post-title" className={labelCls}>
            Title *
          </label>
          <input
            id="post-title"
            value={title}
            onChange={(e) => onTitleChange(e.target.value)}
            className="field !text-lg"
            placeholder="Post title"
            maxLength={200}
            required
          />

          <label htmlFor="post-slug" className={`${labelCls} mt-4`}>
            Slug
          </label>
          <div className="flex items-center gap-2">
            <span className="shrink-0 text-sm text-muted">/{categorySlug}/</span>
            <input
              id="post-slug"
              value={slug}
              onChange={(e) => {
                setSlugTouched(true);
                setSlug(clientSlugify(e.target.value));
              }}
              className="field"
              placeholder="auto-generated-from-title"
            />
          </div>

          <label htmlFor="post-excerpt" className={`${labelCls} mt-4`}>
            Excerpt
          </label>
          <textarea
            id="post-excerpt"
            value={excerpt}
            onChange={(e) => setExcerpt(e.target.value)}
            className="field min-h-[70px]"
            placeholder="Short summary shown on cards and in search results…"
            maxLength={500}
          />

          <label htmlFor="post-content" className={`${labelCls} mt-4`}>
            Content (HTML)
          </label>
          <textarea
            id="post-content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="field min-h-[360px] font-mono !text-[13px]"
            placeholder="<p>Write your post content here…</p>&#10;<h2>Section heading</h2>&#10;<p>Use h2/h3 for headings, ul/ol for lists, img for images.</p>"
          />
          <p className="mt-1.5 text-xs text-muted">
            Allowed: headings (h2–h6), paragraphs, lists, links, images, tables, quotes, code.
            Scripts and unsafe markup are stripped automatically.
          </p>
        </div>

        <div className={sectionCls}>
          <div className="flex items-center justify-between">
            <h2 className="font-display text-base font-bold">FAQ Section</h2>
            <button
              type="button"
              onClick={() => setFaqs((prev) => [...prev, { question: "", answer: "" }])}
              className="btn-ghost !px-3 !py-1.5 text-xs"
            >
              + Add FAQ
            </button>
          </div>
          <p className="mt-1 text-xs text-muted">
            Shown as an accordion on the post and output as FAQ schema (JSON-LD) for Google rich results.
          </p>
          <div className="mt-4 space-y-4">
            {faqs.map((faq, i) => (
              <div key={i} className="rounded-lg border border-white/10 p-4">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-medium text-muted">FAQ #{i + 1}</span>
                  <div className="flex gap-1">
                    <button type="button" onClick={() => moveFaq(i, -1)} className="btn-ghost !px-2 !py-1 text-xs" aria-label="Move up">↑</button>
                    <button type="button" onClick={() => moveFaq(i, 1)} className="btn-ghost !px-2 !py-1 text-xs" aria-label="Move down">↓</button>
                    <button
                      type="button"
                      onClick={() => setFaqs((prev) => prev.filter((_, j) => j !== i))}
                      className="btn-ghost !px-2 !py-1 text-xs hover:!border-red-400/50 hover:!text-red-300"
                      aria-label="Remove FAQ"
                    >
                      ✕
                    </button>
                  </div>
                </div>
                <input
                  value={faq.question}
                  onChange={(e) => updateFaq(i, { question: e.target.value })}
                  className="field mt-2"
                  placeholder="Question"
                  maxLength={300}
                  aria-label={`FAQ ${i + 1} question`}
                />
                <textarea
                  value={faq.answer}
                  onChange={(e) => updateFaq(i, { answer: e.target.value })}
                  className="field mt-2 min-h-[70px]"
                  placeholder="Answer (plain text or light HTML)"
                  aria-label={`FAQ ${i + 1} answer`}
                />
              </div>
            ))}
            {faqs.length === 0 && (
              <p className="text-sm text-muted">No FAQs yet — add question &amp; answer pairs.</p>
            )}
          </div>
        </div>

        <div className={sectionCls}>
          <h2 className="font-display text-base font-bold">SEO</h2>
          <label htmlFor="seo-title" className={`${labelCls} mt-4`}>
            SEO title <span className="font-normal text-muted">({seoTitle.length}/60 recommended)</span>
          </label>
          <input
            id="seo-title"
            value={seoTitle}
            onChange={(e) => setSeoTitle(e.target.value)}
            className="field"
            placeholder={title || "Defaults to post title"}
            maxLength={200}
          />
          <label htmlFor="seo-description" className={`${labelCls} mt-4`}>
            Meta description{" "}
            <span className="font-normal text-muted">({seoDescription.length}/160 recommended)</span>
          </label>
          <textarea
            id="seo-description"
            value={seoDescription}
            onChange={(e) => setSeoDescription(e.target.value)}
            className="field min-h-[70px]"
            placeholder={excerpt || "Defaults to the excerpt"}
            maxLength={400}
          />
          <label htmlFor="canonical-url" className={`${labelCls} mt-4`}>
            Canonical URL <span className="font-normal text-muted">(optional override)</span>
          </label>
          <input
            id="canonical-url"
            value={canonicalUrl}
            onChange={(e) => setCanonicalUrl(e.target.value)}
            className="field"
            placeholder="https://… (leave empty to use the post URL)"
            maxLength={500}
          />
        </div>
      </div>

      {/* ----- Sidebar ----- */}
      <div className="space-y-6">
        <div className={sectionCls}>
          <h2 className="font-display text-base font-bold">Publish</h2>
          <label htmlFor="published-at" className={`${labelCls} mt-4`}>
            Publish date
          </label>
          <input
            id="published-at"
            type="datetime-local"
            value={publishedAt}
            onChange={(e) => setPublishedAt(e.target.value)}
            className="field"
          />
          <label htmlFor="author-name" className={`${labelCls} mt-4`}>
            Author name
          </label>
          <input
            id="author-name"
            value={authorName}
            onChange={(e) => setAuthorName(e.target.value)}
            className="field"
            maxLength={100}
          />
          <div className="mt-4 space-y-2.5 text-sm">
            {[
              { label: "★ Featured", checked: isFeatured, set: setIsFeatured },
              { label: "🔥 Trending / Popular", checked: isTrending, set: setIsTrending },
              { label: "📌 Pin to homepage hero", checked: isPinned, set: setIsPinned },
            ].map((flag) => (
              <label key={flag.label} className="flex cursor-pointer items-center gap-2.5">
                <input
                  type="checkbox"
                  checked={flag.checked}
                  onChange={(e) => flag.set(e.target.checked)}
                  className="h-4 w-4 accent-[#7c3aed]"
                />
                {flag.label}
              </label>
            ))}
          </div>
          <div className="mt-5 grid grid-cols-2 gap-2">
            <button type="button" onClick={() => save("draft")} disabled={saving || uploading} className="btn-ghost">
              {saving ? "Saving…" : "Save draft"}
            </button>
            <button type="button" onClick={() => save("published")} disabled={saving || uploading} className="btn-primary">
              {saving ? "Saving…" : "Publish"}
            </button>
          </div>
          {isEdit && post!.status === "published" && (
            <p className="mt-3 text-center text-xs text-muted">
              Live at{" "}
              <a href={livePath} target="_blank" rel="noreferrer" className="text-neon">
                {livePath}
              </a>
            </p>
          )}
        </div>

        <div className={sectionCls}>
          <h2 className="font-display text-base font-bold">Featured image</h2>
          {featuredImage ? (
            <div className="relative mt-3 aspect-video overflow-hidden rounded-lg">
              <Image src={featuredImage} alt={imageAlt || "Featured image preview"} fill sizes="320px" className="object-cover" />
            </div>
          ) : (
            <p className="mt-3 rounded-lg border border-dashed border-white/15 py-8 text-center text-xs text-muted">
              No image uploaded
            </p>
          )}
          <label className="btn-ghost mt-3 w-full cursor-pointer text-xs">
            {uploading ? "Uploading…" : featuredImage ? "Replace image" : "Upload image"}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/avif,image/gif"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) uploadImage(file);
                e.target.value = "";
              }}
            />
          </label>
          {featuredImage && (
            <button type="button" onClick={() => setFeaturedImage("")} className="mt-2 w-full text-center text-xs text-red-300/80 hover:text-red-300">
              Remove image
            </button>
          )}
          <label htmlFor="image-alt" className={`${labelCls} mt-4`}>
            Image alt text
          </label>
          <input
            id="image-alt"
            value={imageAlt}
            onChange={(e) => setImageAlt(e.target.value)}
            className="field"
            placeholder="Describe the image for SEO & accessibility"
            maxLength={300}
          />
        </div>

        <div className={sectionCls}>
          <h2 className="font-display text-base font-bold">Gallery images</h2>
          <p className="mt-1 text-xs text-muted">
            Extra images shown as a gallery on the post ({gallery.length}/20).
          </p>
          <div className="mt-3 space-y-3">
            {gallery.map((img, i) => (
              <div key={`${img.url}-${i}`} className="rounded-lg border border-white/10 p-3">
                <div className="flex items-center gap-3">
                  <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-md">
                    <Image src={img.url} alt={img.alt || `Gallery image ${i + 1}`} fill sizes="56px" className="object-cover" />
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                    <input
                      value={img.alt}
                      onChange={(e) =>
                        setGallery((prev) =>
                          prev.map((g, j) => (j === i ? { ...g, alt: e.target.value } : g))
                        )
                      }
                      className="field !py-1.5 text-xs"
                      placeholder="Alt text (SEO)"
                      maxLength={300}
                      aria-label={`Gallery image ${i + 1} alt text`}
                    />
                    <div className="flex gap-1">
                      <button type="button" onClick={() => moveGalleryImage(i, -1)} className="btn-ghost !px-2 !py-0.5 text-xs" aria-label="Move up">↑</button>
                      <button type="button" onClick={() => moveGalleryImage(i, 1)} className="btn-ghost !px-2 !py-0.5 text-xs" aria-label="Move down">↓</button>
                      <button
                        type="button"
                        onClick={() => setGallery((prev) => prev.filter((_, j) => j !== i))}
                        className="btn-ghost !px-2 !py-0.5 text-xs hover:!border-red-400/50 hover:!text-red-300"
                        aria-label="Remove image"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <label className="btn-ghost mt-3 w-full cursor-pointer text-xs">
            {galleryUploading ? "Uploading…" : "+ Add images (multiple)"}
            <input
              type="file"
              multiple
              accept="image/jpeg,image/png,image/webp,image/avif,image/gif"
              className="hidden"
              onChange={(e) => {
                if (e.target.files?.length) uploadGalleryImages(e.target.files);
                e.target.value = "";
              }}
            />
          </label>
        </div>

        <div className={sectionCls}>
          <h2 className="font-display text-base font-bold">Category</h2>
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value === "" ? "" : Number(e.target.value))}
            className="field mt-3"
            aria-label="Category"
          >
            <option value="">— No category —</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          <h2 className="font-display mt-5 text-base font-bold">Tags</h2>
          <p className="mt-1 text-xs text-muted">Used as filters on the blog.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {tags.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => toggleTag(t.id)}
                aria-pressed={tagIds.includes(t.id)}
                className={`rounded-full border px-3 py-1 text-xs transition-all ${
                  tagIds.includes(t.id)
                    ? "border-neon/60 bg-neon/15 text-neon"
                    : "border-white/10 text-muted hover:border-white/30"
                }`}
              >
                #{t.name}
              </button>
            ))}
            {tags.length === 0 && <p className="text-xs text-muted">No tags yet — create some under Tags.</p>}
          </div>
        </div>
      </div>
    </form>
  );
}
