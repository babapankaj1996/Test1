import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import fs from "fs/promises";
import path from "path";
import sharp from "sharp";
import { guardAdmin } from "@/lib/api-helpers";

const MAX_BYTES = 8 * 1024 * 1024; // 8 MB
const ALLOWED_INPUT = new Set(["jpeg", "png", "webp", "avif", "gif"]);
const MAX_WIDTH = 1920;

export async function POST(req: NextRequest) {
  const { response } = await guardAdmin(req);
  if (response) return response;

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "Expected multipart form data" }, { status: 400 });
  }

  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }
  if (file.size === 0 || file.size > MAX_BYTES) {
    return NextResponse.json({ error: "File must be between 1 byte and 8 MB" }, { status: 400 });
  }
  if (!file.type.startsWith("image/")) {
    return NextResponse.json({ error: "Only image uploads are allowed" }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  // Validate real content via sharp (magic bytes), then re-encode to WebP.
  // Re-encoding strips metadata and any embedded payloads.
  let output: Buffer;
  let width: number | undefined;
  let height: number | undefined;
  try {
    const image = sharp(buffer, { limitInputPixels: 40_000_000, animated: false });
    const meta = await image.metadata();
    if (!meta.format || !ALLOWED_INPUT.has(meta.format)) {
      return NextResponse.json(
        { error: "Unsupported image format. Use JPEG, PNG, WebP, AVIF or GIF." },
        { status: 400 }
      );
    }
    const resized = image.resize({ width: MAX_WIDTH, withoutEnlargement: true }).rotate();
    output = await resized.webp({ quality: 82 }).toBuffer();
    const outMeta = await sharp(output).metadata();
    width = outMeta.width;
    height = outMeta.height;
  } catch {
    return NextResponse.json({ error: "File is not a valid image" }, { status: 400 });
  }

  const filename = `${Date.now()}-${crypto.randomBytes(6).toString("hex")}.webp`;
  // data/uploads is served by app/uploads/[file]/route.ts — public/ is
  // snapshotted at build time, so runtime uploads must not live there.
  const uploadDir = path.join(process.cwd(), "data", "uploads");
  await fs.mkdir(uploadDir, { recursive: true });
  await fs.writeFile(path.join(uploadDir, filename), output);

  return NextResponse.json({ url: `/uploads/${filename}`, width, height }, { status: 201 });
}
