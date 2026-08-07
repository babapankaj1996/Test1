import { NextRequest, NextResponse } from "next/server";
import { deleteTag, updateTag, type TagInput } from "@/lib/admin";
import { guardAdmin, handleApiError, readJson } from "@/lib/api-helpers";

function parseId(raw: string): number | null {
  const id = parseInt(raw, 10);
  return Number.isInteger(id) && id > 0 ? id : null;
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { response } = await guardAdmin(req);
  if (response) return response;
  const id = parseId((await params).id);
  if (!id) return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  try {
    const body = await readJson<TagInput>(req);
    return NextResponse.json(updateTag(id, body));
  } catch (err) {
    return handleApiError(err);
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { response } = await guardAdmin(req);
  if (response) return response;
  const id = parseId((await params).id);
  if (!id) return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  const deleted = deleteTag(id);
  if (!deleted) return NextResponse.json({ error: "Tag not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
