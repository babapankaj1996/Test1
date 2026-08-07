import { NextRequest, NextResponse } from "next/server";
import { getSettings, updateSettings } from "@/lib/settings";
import { guardAdmin, handleApiError, readJson } from "@/lib/api-helpers";

export async function GET() {
  const { response } = await guardAdmin();
  if (response) return response;
  return NextResponse.json(getSettings());
}

export async function PUT(req: NextRequest) {
  const { response } = await guardAdmin(req);
  if (response) return response;
  try {
    const body = await readJson(req);
    const values: Record<string, string> = {};
    for (const [k, v] of Object.entries(body)) {
      if (typeof v === "string" || typeof v === "number") values[k] = String(v);
    }
    updateSettings(values);
    return NextResponse.json(getSettings());
  } catch (err) {
    return handleApiError(err);
  }
}
