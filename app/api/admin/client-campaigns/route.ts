import { NextResponse } from "next/server";
import { getCurrentUser, isAgencyAdmin } from "@/lib/dashboard-auth";
import { queryDb, hasDatabaseConfig } from "@/lib/db";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user || !isAgencyAdmin(user)) {
    return NextResponse.json({ error: "Nao autorizado." }, { status: 401 });
  }

  if (!hasDatabaseConfig()) {
    return NextResponse.json({ campaigns: [] });
  }

  const { searchParams } = new URL(request.url);
  const clientSlug = searchParams.get("clientSlug");

  if (!clientSlug) {
    return NextResponse.json({ campaigns: [] });
  }

  const result = await queryDb<{ id: string; name: string }>(
    `SELECT id::text, name FROM client_campaigns WHERE client_slug = $1 ORDER BY name ASC`,
    [clientSlug]
  );

  return NextResponse.json({ campaigns: result.rows });
}
