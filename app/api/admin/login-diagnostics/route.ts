import { NextResponse } from "next/server";
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
  let database:
    | {
        reachable: true;
        adminCount: number;
        adminEmails: string[];
      }
    | {
        reachable: false;
        error: string;
      };

  try {
    const rows = getDb()
      .prepare("SELECT email FROM admins ORDER BY id")
      .all() as Array<{ email: string }>;
    database = {
      reachable: true,
      adminCount: rows.length,
      adminEmails: rows.map((row) => maskEmail(row.email) ?? "***"),
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
        adminPasswordSet: Boolean(process.env.ADMIN_PASSWORD),
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
