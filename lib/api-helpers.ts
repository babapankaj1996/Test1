import { NextResponse } from "next/server";
import { requireAdmin } from "./auth";
import { ValidationError } from "./admin";

export async function guardAdmin() {
  const session = await requireAdmin();
  if (!session) {
    return { session: null, response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  return { session, response: null };
}

export function handleApiError(err: unknown): NextResponse {
  if (err instanceof ValidationError) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
  console.error("[api]", err);
  return NextResponse.json({ error: "Internal server error" }, { status: 500 });
}

export async function readJson<T = Record<string, unknown>>(req: Request): Promise<T> {
  try {
    const body = await req.json();
    if (body && typeof body === "object" && !Array.isArray(body)) return body as T;
  } catch {
    /* fallthrough */
  }
  throw new ValidationError("Request body must be a JSON object");
}
