function normalizeSiteUrl(value?: string): string {
  const raw = (value || "http://localhost:3000").trim().replace(/\/+$/, "");
  const withProtocol = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;

  try {
    return new URL(withProtocol).origin;
  } catch {
    return "http://localhost:3000";
  }
}

export const SITE_URL = normalizeSiteUrl(process.env.NEXT_PUBLIC_SITE_URL);

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
