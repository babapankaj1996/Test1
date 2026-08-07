import { getDb } from "./db";

export interface SiteSettings {
  site_name: string;
  site_tagline: string;
  site_description: string;
  posts_per_page: number;
  social_twitter: string;
  social_facebook: string;
  social_instagram: string;
  social_youtube: string;
}

export function getSettings(): SiteSettings {
  const db = getDb();
  const rows = db.prepare("SELECT key, value FROM settings").all() as Array<{
    key: string;
    value: string;
  }>;
  const map = Object.fromEntries(rows.map((r) => [r.key, r.value]));
  return {
    site_name: map.site_name || "NovaPulse",
    site_tagline: map.site_tagline || "",
    site_description: map.site_description || "",
    posts_per_page: Math.min(50, Math.max(1, parseInt(map.posts_per_page || "9", 10) || 9)),
    social_twitter: map.social_twitter || "",
    social_facebook: map.social_facebook || "",
    social_instagram: map.social_instagram || "",
    social_youtube: map.social_youtube || "",
  };
}

export function updateSettings(values: Record<string, string>): void {
  const db = getDb();
  const allowed = new Set([
    "site_name",
    "site_tagline",
    "site_description",
    "posts_per_page",
    "social_twitter",
    "social_facebook",
    "social_instagram",
    "social_youtube",
  ]);
  const upsert = db.prepare(
    "INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value"
  );
  const tx = db.transaction(() => {
    for (const [k, v] of Object.entries(values)) {
      if (allowed.has(k)) upsert.run(k, String(v).slice(0, 500));
    }
  });
  tx();
}
