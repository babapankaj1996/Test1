import { permanentRedirect } from "next/navigation";

export const dynamic = "force-dynamic";

/** The blog listing moved to the homepage — 308 /blog (with filters) to /. */
export default async function LegacyBlogRedirect({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; tag?: string; category?: string }>;
}) {
  const sp = await searchParams;
  const params = new URLSearchParams();
  if (sp.q) params.set("q", sp.q);
  if (sp.tag) params.set("tag", sp.tag);
  if (sp.category) params.set("category", sp.category);
  const qs = params.toString();
  permanentRedirect(qs ? `/?${qs}` : "/");
}
