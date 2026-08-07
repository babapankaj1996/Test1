import { NextRequest, NextResponse } from "next/server";
import { updateStaticPage, type PageInput } from "@/lib/admin";
import { guardAdmin, handleApiError, readJson } from "@/lib/api-helpers";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { response } = await guardAdmin();
  if (response) return response;
  const id = parseInt((await params).id, 10);
  if (!Number.isInteger(id) || id <= 0) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }
  try {
    const body = await readJson<PageInput>(req);
    return NextResponse.json(updateStaticPage(id, body));
  } catch (err) {
    return handleApiError(err);
  }
}
