import { NextRequest, NextResponse } from "next/server";
import { getCategories } from "@/lib/posts";
import { createCategory, type CategoryInput } from "@/lib/admin";
import { guardAdmin, handleApiError, readJson } from "@/lib/api-helpers";

export async function GET() {
  const { response } = await guardAdmin();
  if (response) return response;
  return NextResponse.json({ items: getCategories() });
}

export async function POST(req: NextRequest) {
  const { response } = await guardAdmin();
  if (response) return response;
  try {
    const body = await readJson<CategoryInput>(req);
    return NextResponse.json(createCategory(body), { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}
