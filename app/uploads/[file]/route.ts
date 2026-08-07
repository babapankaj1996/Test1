import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

const UPLOAD_DIR = path.join(process.cwd(), "data", "uploads");
const PUBLIC_UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");

const MIME: Record<string, string> = {
  ".webp": "image/webp",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".avif": "image/avif",
  ".gif": "image/gif",
};

/**
 * Serves uploaded images from data/uploads at runtime, with a public/uploads
 * fallback for bundled seed/demo images.
 */
export async function GET(_req: Request, { params }: { params: Promise<{ file: string }> }) {
  const { file } = await params;
  // Strict allowlist: no separators, no traversal.
  if (!/^[a-zA-Z0-9_-]+\.[a-z0-9]+$/.test(file)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const type = MIME[path.extname(file).toLowerCase()];
  if (!type) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  try {
    let data: Buffer;
    try {
      data = await fs.readFile(path.join(UPLOAD_DIR, file));
    } catch {
      data = await fs.readFile(path.join(PUBLIC_UPLOAD_DIR, file));
    }

    return new NextResponse(new Uint8Array(data), {
      headers: {
        "Content-Type": type,
        "Cache-Control": "public, max-age=31536000, immutable",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
