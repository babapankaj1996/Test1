import { NextRequest, NextResponse } from "next/server";
import { deleteCategory, updateCategory, type CategoryInput } from "@/lib/admin";
import { guardAdmin, handleApiError, readJson } from "@/lib/api-helpers";

function parseId(raw: string): number | null {
  const id = parseInt(raw, 10);
  return Number.isInteger(id) && id > 0 ? id : null;
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { response } = await guardAdmin();
  if (response) return response;
  const id = parseId((await params).id);
  if (!id) return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  try {
    const body = await readJson<CategoryInput>(req);
    return NextResponse.json(updateCategory(id, body));
  } catch (err) {
    return handleApiError(err);
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { response } = await guardAdmin();
  if (response) return response;
  const id = parseId((await params).id);
  if (!id) return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  const deleted = deleteCategory(id);
  if (!deleted) return NextResponse.json({ error: "Category not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
