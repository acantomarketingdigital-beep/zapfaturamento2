import { NextResponse } from "next/server";
import { queryDb, hasDatabaseConfig } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const start = Date.now();

  if (!hasDatabaseConfig()) {
    return NextResponse.json(
      { ok: false, error: "DATABASE_URL not configured" },
      { status: 503 }
    );
  }

  try {
    await queryDb("SELECT 1");
    return NextResponse.json({
      ok: true,
      db: "connected",
      latency_ms: Date.now() - start,
    });
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        db: "error",
        error: err instanceof Error ? err.message : "unknown",
        latency_ms: Date.now() - start,
      },
      { status: 503 }
    );
  }
}
