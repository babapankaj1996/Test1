import type { MetadataRoute } from "next";
import { getAllPublishedSlugs, getCategories, getStaticPages } from "@/lib/posts";
import { absoluteUrl } from "@/lib/site";
import { toIsoDate } from "@/lib/format";
import { postPath } from "@/lib/urls";

export const dynamic = "force-dynamic";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const entries: MetadataRoute.Sitemap = [
    { url: absoluteUrl("/"), lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: absoluteUrl("/trending"), lastModified: now, changeFrequency: "daily", priority: 0.9 },
  ];

  for (const post of getAllPublishedSlugs()) {
    entries.push({
      url: absoluteUrl(postPath(post)),
      lastModified: toIsoDate(post.updated_at) ?? now,
      changeFrequency: "weekly",
      priority: 0.8,
    });
  }

  for (const cat of getCategories()) {
    if ((cat.post_count ?? 0) > 0) {
      entries.push({
        url: absoluteUrl(`/${cat.slug}`),
        lastModified: now,
        changeFrequency: "weekly",
        priority: 0.7,
      });
    }
  }

  for (const page of getStaticPages()) {
    entries.push({
      url: absoluteUrl(`/${page.slug}`),
      lastModified: toIsoDate(page.updated_at) ?? now,
      changeFrequency: "monthly",
      priority: 0.4,
    });
  }

  return entries;
}
