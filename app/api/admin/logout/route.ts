import { NextResponse } from "next/server";
import { destroySession } from "@/lib/auth";
import { guardAdmin } from "@/lib/api-helpers";

export async function POST(req: Request) {
  const { response } = await guardAdmin(req);
  if (response) return response;

  await destroySession();
  return NextResponse.json({ ok: true });
}
