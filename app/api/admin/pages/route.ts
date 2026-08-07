import { NextResponse } from "next/server";
import { getStaticPages } from "@/lib/posts";
import { guardAdmin } from "@/lib/api-helpers";

export async function GET() {
  const { response } = await guardAdmin();
  if (response) return response;
  return NextResponse.json({ items: getStaticPages() });
}
