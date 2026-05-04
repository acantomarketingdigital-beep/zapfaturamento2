import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/dashboard-auth";
import { hasDatabaseConfig, queryDb } from "@/lib/db";

type ClientRow = { client_slug: string; client_name: string };

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Nao autorizado." }, { status: 401 });
  if (!hasDatabaseConfig()) return NextResponse.json({ clients: [] });

  let result;
  if (user.role === "client_user" && user.clientSlug) {
    result = await queryDb<ClientRow>(
      `SELECT client_slug, client_name FROM clients WHERE client_slug = $1 AND is_active = TRUE ORDER BY client_name ASC`,
      [user.clientSlug]
    );
  } else {
    result = await queryDb<ClientRow>(
      `SELECT client_slug, client_name FROM clients WHERE is_active = TRUE ORDER BY client_name ASC`
    );
  }

  return NextResponse.json({
    clients: result.rows.map((r) => ({ slug: r.client_slug, name: r.client_name }))
  });
}
