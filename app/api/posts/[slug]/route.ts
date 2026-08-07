import { NextResponse } from "next/server";
import { getPostBySlug, incrementViewCount } from "@/lib/posts";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  if (!/^[a-z0-9-]{1,96}$/.test(slug)) {
    return NextResponse.json({ error: "Invalid slug" }, { status: 400 });
  }
  const post = getPostBySlug(slug, { publishedOnly: true });
  if (!post) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 });
  }
  incrementViewCount(slug);
  return NextResponse.json({ ...post, view_count: post.view_count + 1 });
}
