import { NextRequest, NextResponse } from "next/server";
import { getTags } from "@/lib/posts";
import { createTag, type TagInput } from "@/lib/admin";
import { guardAdmin, handleApiError, readJson } from "@/lib/api-helpers";

export async function GET() {
  const { response } = await guardAdmin();
  if (response) return response;
  return NextResponse.json({ items: getTags() });
}

export async function POST(req: NextRequest) {
  const { response } = await guardAdmin();
  if (response) return response;
  try {
    const body = await readJson<TagInput>(req);
    return NextResponse.json(createTag(body), { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}
