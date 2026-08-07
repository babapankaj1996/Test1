import { absoluteUrl, SITE_URL } from "./site";
import { stripHtml } from "./sanitize";
import { postPath } from "./urls";
import type { Post, PostFaq } from "./types";

type JsonLd = Record<string, unknown>;

export function websiteSchema(siteName: string, description: string): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: siteName,
    url: SITE_URL,
    description,
    potentialAction: {
      "@type": "SearchAction",
      target: { "@type": "EntryPoint", urlTemplate: `${SITE_URL}/?q={search_term_string}` },
      "query-input": "required name=search_term_string",
    },
  };
}

export function organizationSchema(siteName: string, description: string): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: siteName,
    url: SITE_URL,
    description,
    logo: { "@type": "ImageObject", url: absoluteUrl("/icon.svg") },
  };
}

export function articleSchema(post: Post, siteName: string): JsonLd {
  const images = [
    ...(post.featured_image ? [absoluteUrl(post.featured_image)] : []),
    ...(post.images ?? []).map((img) => absoluteUrl(img.url)),
  ].slice(0, 10);
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.seo_description || post.excerpt,
    image: images.length ? images : undefined,
    datePublished: post.published_at ? new Date(post.published_at + "Z").toISOString() : undefined,
    dateModified: new Date(post.updated_at + "Z").toISOString(),
    author: { "@type": "Person", name: post.author_name || "Admin" },
    publisher: {
      "@type": "Organization",
      name: siteName,
      logo: { "@type": "ImageObject", url: absoluteUrl("/icon.svg") },
    },
    mainEntityOfPage: { "@type": "WebPage", "@id": absoluteUrl(postPath(post)) },
    articleSection: post.category_name || undefined,
    keywords: post.tags?.map((t) => t.name).join(", ") || undefined,
    wordCount: stripHtml(post.content).split(/\s+/).filter(Boolean).length,
  };
}

export function faqSchema(faqs: PostFaq[]): JsonLd | null {
  if (!faqs.length) return null;
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.question,
      acceptedAnswer: { "@type": "Answer", text: stripHtml(f.answer) },
    })),
  };
}

export function breadcrumbSchema(crumbs: Array<{ name: string; url: string }>): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: c.name,
      item: absoluteUrl(c.url),
    })),
  };
}

/** Render JSON-LD safely inside a <script> tag. */
export function jsonLdString(data: JsonLd): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
