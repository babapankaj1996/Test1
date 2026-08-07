import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getDb } from "@/lib/db";

export const dynamic = "force-dynamic";

function maskEmail(email?: string | null): string | null {
  if (!email) return null;
  const [local, domain] = email.split("@");
  if (!local || !domain) return "***";
  const [domainName, ...domainParts] = domain.split(".");
  const maskedLocal = `${local.slice(0, 2)}***`;
  const maskedDomain = `${domainName.slice(0, 1)}***`;
  const suffix = domainParts.length > 0 ? `.${domainParts.join(".")}` : "";
  return `${maskedLocal}@${maskedDomain}${suffix}`;
}

function classifyError(error: unknown): string {
  if (!(error instanceof Error)) return "unknown";
  if (error.message.includes("ADMIN_EMAIL") || error.message.includes("ADMIN_PASSWORD")) {
    return "admin_env_missing_or_incomplete";
  }
  if (error.message.includes("AUTH_SECRET")) return "auth_secret_missing";
  return "database_unavailable";
}

export async function GET() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const rawPassword = process.env.ADMIN_PASSWORD;
  const password = rawPassword?.trim();
  let database:
    | {
        reachable: true;
        adminCount: number;
        adminEmails: string[];
        passwordMatchesEnv: boolean | null;
      }
    | {
        reachable: false;
        error: string;
      };

  try {
    const rows = getDb()
      .prepare("SELECT email, password_hash FROM admins ORDER BY id")
      .all() as Array<{ email: string; password_hash: string }>;
    const configuredAdmin = email ? rows.find((row) => row.email === email) : undefined;
    database = {
      reachable: true,
      adminCount: rows.length,
      adminEmails: rows.map((row) => maskEmail(row.email) ?? "***"),
      passwordMatchesEnv:
        password && configuredAdmin
          ? await bcrypt.compare(password, configuredAdmin.password_hash)
          : null,
    };
  } catch (error) {
    database = {
      reachable: false,
      error: classifyError(error),
    };
  }

  return NextResponse.json(
    {
      ok: true,
      runtime: {
        nodeEnv: process.env.NODE_ENV ?? null,
        checkedAt: new Date().toISOString(),
      },
      env: {
        adminEmailSet: Boolean(email),
        adminEmail: maskEmail(email),
        adminPasswordSet: Boolean(rawPassword),
        adminPasswordHasBoundaryWhitespace: Boolean(rawPassword && rawPassword !== rawPassword.trim()),
        authSecretSet: Boolean(process.env.AUTH_SECRET),
      },
      database,
    },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    }
  );
}
