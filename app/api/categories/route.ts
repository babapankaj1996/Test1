import { NextResponse } from "next/server";
import { getCategories } from "@/lib/posts";

export async function GET() {
  return NextResponse.json({ items: getCategories() });
}
