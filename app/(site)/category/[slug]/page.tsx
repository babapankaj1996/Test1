import { permanentRedirect } from "next/navigation";

export const dynamic = "force-dynamic";

/** Legacy category URL (/category/<slug>) — 308 to /<slug>. */
export default async function LegacyCategoryRedirect({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  permanentRedirect(`/${encodeURIComponent(slug)}`);
}
