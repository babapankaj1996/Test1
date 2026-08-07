import { NextResponse } from "next/server";
import { incrementViewCount } from "@/lib/posts";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  if (!/^[a-z0-9-]{1,96}$/.test(slug)) {
    return NextResponse.json({ error: "Invalid slug" }, { status: 400 });
  }
  const views = incrementViewCount(slug);
  if (views === null) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 });
  }
  return NextResponse.json({ views });
}
