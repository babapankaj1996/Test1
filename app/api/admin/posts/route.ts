import { NextRequest, NextResponse } from "next/server";
import { getPosts } from "@/lib/posts";
import { createPost, type PostInput } from "@/lib/admin";
import { guardAdmin, handleApiError, readJson } from "@/lib/api-helpers";

export async function GET(req: NextRequest) {
  const { response } = await guardAdmin();
  if (response) return response;

  const sp = req.nextUrl.searchParams;
  const statusParam = sp.get("status");
  const result = getPosts({
    page: Math.max(1, parseInt(sp.get("page") || "1", 10) || 1),
    perPage: Math.min(50, parseInt(sp.get("perPage") || "10", 10) || 10),
    q: sp.get("q")?.slice(0, 100) || undefined,
    status:
      statusParam === "draft" || statusParam === "published" ? statusParam : "all",
  });
  return NextResponse.json(result);
}

export async function POST(req: NextRequest) {
  const { session, response } = await guardAdmin();
  if (response) return response;

  try {
    const body = await readJson<PostInput>(req);
    if (!body.author_name) body.author_name = session!.name;
    const post = createPost(body);
    return NextResponse.json(post, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}
