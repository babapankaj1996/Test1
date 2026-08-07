import { NextRequest, NextResponse } from "next/server";
import { getPosts } from "@/lib/posts";
import { getSettings } from "@/lib/settings";
import type { Post } from "@/lib/types";

function publicPost(p: Post) {
  // Strip full content from list responses to keep payloads small.
  const rest: Partial<Post> = { ...p };
  delete rest.content;
  return rest;
}

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const settings = getSettings();
  const result = getPosts({
    page: Math.max(1, parseInt(sp.get("page") || "1", 10) || 1),
    perPage: Math.min(50, parseInt(sp.get("perPage") || "", 10) || settings.posts_per_page),
    q: sp.get("q")?.slice(0, 100) || undefined,
    category: sp.get("category") || undefined,
    tag: sp.get("tag") || undefined,
    featured: sp.get("featured") === "1",
    trending: sp.get("trending") === "1",
    orderBy: sp.get("orderBy") === "views" ? "views" : "newest",
    status: "published",
  });
  return NextResponse.json({ ...result, items: result.items.map(publicPost) });
}
