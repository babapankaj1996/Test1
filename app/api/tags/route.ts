import { NextResponse } from "next/server";
import { getTags } from "@/lib/posts";

export async function GET() {
  return NextResponse.json({ items: getTags() });
}
