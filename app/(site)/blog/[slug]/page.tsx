import { notFound, permanentRedirect } from "next/navigation";
import { getPostBySlug } from "@/lib/posts";
import { postPath } from "@/lib/urls";

export const dynamic = "force-dynamic";

/** Legacy post URL (/blog/<slug>) — 308 to /<category-slug>/<post-slug>. */
export default async function LegacyPostRedirect({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) notFound();
  permanentRedirect(postPath(post));
}
