import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import fs from "fs";
import path from "path";
import { getDb } from "./db";

const COOKIE_NAME = "admin_session";
const SESSION_DAYS = 7;

let _secret: Uint8Array | null = null;

function getSecret(): Uint8Array {
  if (_secret) return _secret;
  if (process.env.AUTH_SECRET) {
    _secret = new TextEncoder().encode(process.env.AUTH_SECRET);
    return _secret;
  }
  if (process.env.NODE_ENV === "production") {
    throw new Error("AUTH_SECRET must be set in production.");
  }
  // Persist a generated secret so sessions survive restarts in local dev.
  const secretPath = path.join(process.cwd(), "data", ".auth-secret");
  fs.mkdirSync(path.dirname(secretPath), { recursive: true });
  if (!fs.existsSync(secretPath)) {
    fs.writeFileSync(secretPath, crypto.randomBytes(48).toString("hex"), { mode: 0o600 });
  }
  _secret = new TextEncoder().encode(fs.readFileSync(secretPath, "utf8").trim());
  return _secret;
}

export interface AdminSession {
  adminId: number;
  email: string;
  name: string;
}

// Basic in-memory brute-force protection for login.
const attempts = new Map<string, { count: number; resetAt: number }>();
const MAX_ATTEMPTS = 8;
const WINDOW_MS = 15 * 60 * 1000;

export function isRateLimited(key: string): boolean {
  const now = Date.now();
  const entry = attempts.get(key);
  if (!entry || entry.resetAt < now) return false;
  return entry.count >= MAX_ATTEMPTS;
}

export function recordFailedAttempt(key: string): void {
  const now = Date.now();
  const entry = attempts.get(key);
  if (!entry || entry.resetAt < now) {
    attempts.set(key, { count: 1, resetAt: now + WINDOW_MS });
  } else {
    entry.count += 1;
  }
}

export function clearAttempts(key: string): void {
  attempts.delete(key);
}

export async function verifyCredentials(
  email: string,
  password: string
): Promise<AdminSession | null> {
  const db = getDb();
  const admin = db
    .prepare("SELECT id, email, password_hash, name FROM admins WHERE email = ?")
    .get(email.toLowerCase().trim()) as
    | { id: number; email: string; password_hash: string; name: string }
    | undefined;
  if (!admin) {
    // Constant-ish time: still run a hash comparison to avoid user enumeration timing.
    await bcrypt.compare(password, "$2a$10$C6UzMDM.H6dfI/f/IKcEeO7pTk1nEXm0eZ9KeS9AcVe3T1L8mUvGe");
    return null;
  }
  const ok = await bcrypt.compare(password, admin.password_hash);
  if (!ok) return null;
  return { adminId: admin.id, email: admin.email, name: admin.name };
}

export async function createSession(session: AdminSession): Promise<void> {
  const token = await new SignJWT({ email: session.email, name: session.name })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(String(session.adminId))
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DAYS}d`)
    .sign(getSecret());
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_DAYS * 24 * 60 * 60,
  });
}

export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export async function getAdminSession(): Promise<AdminSession | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    if (!token) return null;
    const { payload } = await jwtVerify(token, getSecret(), { algorithms: ["HS256"] });
    const adminId = Number(payload.sub);
    if (!adminId) return null;
    // Confirm the admin still exists.
    const db = getDb();
    const admin = db
      .prepare("SELECT id, email, name FROM admins WHERE id = ?")
      .get(adminId) as { id: number; email: string; name: string } | undefined;
    if (!admin) return null;
    return { adminId: admin.id, email: admin.email, name: admin.name };
  } catch {
    return null;
  }
}

/** For API route handlers: returns the session or null. Callers must 401 on null. */
export async function requireAdmin(): Promise<AdminSession | null> {
  return getAdminSession();
}
