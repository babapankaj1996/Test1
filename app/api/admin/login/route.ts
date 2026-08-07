import { NextRequest, NextResponse } from "next/server";
import {
  clearAttempts,
  createSession,
  isRateLimited,
  recordFailedAttempt,
  verifyCredentials,
} from "@/lib/auth";

export async function POST(req: NextRequest) {
  let body: { email?: string; password?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const email = String(body.email ?? "").trim().toLowerCase();
  const password = String(body.password ?? "");
  if (!email || !password || email.length > 200 || password.length > 200) {
    return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
  }

  const rateKey = `${req.headers.get("x-forwarded-for") ?? "local"}:${email}`;
  if (isRateLimited(rateKey)) {
    return NextResponse.json(
      { error: "Too many failed attempts. Try again in 15 minutes." },
      { status: 429 }
    );
  }

  const session = await verifyCredentials(email, password);
  if (!session) {
    recordFailedAttempt(rateKey);
    return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
  }

  clearAttempts(rateKey);
  await createSession(session);
  return NextResponse.json({ ok: true, name: session.name });
}
