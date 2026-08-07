export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"
).replace(/\/+$/, "");

export const SITE_DEFAULTS = {
  name: "NovaPulse",
  tagline: "Ideas, insights and stories from the edge of tomorrow",
  description:
    "NovaPulse is a modern publication covering technology, design and business — in-depth articles, guides and trends, updated daily.",
};

export function absoluteUrl(path: string): string {
  if (/^https?:\/\//.test(path)) return path;
  return `${SITE_URL}${path.startsWith("/") ? "" : "/"}${path}`;
}
