import { NextResponse } from "next/server";
import { requireAdmin } from "./auth";
import { ValidationError } from "./admin";

function firstHeaderValue(value: string | null): string {
  return value?.split(",")[0]?.trim().toLowerCase() ?? "";
}

export function sameOriginResponse(req: Request): NextResponse | null {
  const secFetchSite = firstHeaderValue(req.headers.get("sec-fetch-site"));
  if (secFetchSite && !["same-origin", "same-site", "none"].includes(secFetchSite)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const origin = req.headers.get("origin");
  if (!origin) return null;

  let originUrl: URL;
  try {
    originUrl = new URL(origin);
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const candidateHosts = [
    firstHeaderValue(req.headers.get("x-forwarded-host")),
    firstHeaderValue(req.headers.get("host")),
    new URL(req.url).host.toLowerCase(),
  ].filter(Boolean);
  if (!candidateHosts.includes(originUrl.host.toLowerCase())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return null;
}

export async function guardAdmin(req?: Request) {
  if (req && !["GET", "HEAD", "OPTIONS"].includes(req.method)) {
    const response = sameOriginResponse(req);
    if (response) return { session: null, response };
  }

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
