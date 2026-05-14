import { NextResponse } from "next/server";
import { getCurrentUser, canAccessClient } from "@/lib/dashboard-auth";
import { queryDb } from "@/lib/db";

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Nao autorizado." }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const clientSlug = searchParams.get("clientSlug") || user.clientSlug || "";
  const campaignSlug = searchParams.get("campaignSlug") || "";

  if (!clientSlug || !campaignSlug) {
    return NextResponse.json({ audiences: [] });
  }
  if (!(await canAccessClient(user, clientSlug))) {
    return NextResponse.json({ error: "Sem permissao." }, { status: 403 });
  }

  const result = await queryDb<{ utm_term: string }>(
    `SELECT DISTINCT utm_term
     FROM whatsapp_leads
     WHERE client_slug = $1
       AND utm_campaign = $2
       AND utm_term IS NOT NULL
       AND utm_term <> ''
       AND lead_phone IS NOT NULL
     ORDER BY utm_term`,
    [clientSlug, campaignSlug]
  );

  return NextResponse.json({ audiences: result.rows.map((r) => r.utm_term) });
}
