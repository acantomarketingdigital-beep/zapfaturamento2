import { NextResponse } from "next/server";
import { getCurrentUser, isAgencyAdmin } from "@/lib/dashboard-auth";
import { queryDb } from "@/lib/db";

export const runtime = "nodejs";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const user = await getCurrentUser();
  if (!user || !isAgencyAdmin(user)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { slug } = await params;

  // Verify client exists
  const check = await queryDb<{ id: number }>(
    `SELECT id FROM clients WHERE client_slug = $1`,
    [slug]
  );
  if (!check.rows.length) {
    return NextResponse.json({ error: "Cliente nao encontrado" }, { status: 404 });
  }

  const clientId = check.rows[0].id;

  // Delete all campaign creatives first (FK: campaign_creatives → client_campaigns)
  await queryDb(
    `DELETE FROM campaign_creatives WHERE campaign_id IN (
       SELECT id FROM client_campaigns WHERE client_id = $1
     )`,
    [clientId]
  );

  // Delete everything referencing client_slug (order matters for FKs)
  const bySlug = [
    "whatsapp_messages",
    "whatsapp_conversations",
    "whatsapp_leads",
    "whatsapp_connection_users",
    "whatsapp_connections",
    "lead_form_submissions",
    "lead_form_views",
    "lead_forms",
    "lead_status_history",
    "ad_spend",
    "billing_usage_events",
    "group_tracking_events",
    "group_campaigns",
    "disparo_instancias",
    "campanhas_disparos",
    "quick_replies",
    "system_logs",
    "client_whatsapp_numbers",
  ];

  for (const table of bySlug) {
    await queryDb(`DELETE FROM ${table} WHERE client_slug = $1`, [slug]);
  }

  // Delete campaigns and client
  await queryDb(`DELETE FROM client_campaigns WHERE client_id = $1`, [clientId]);
  await queryDb(`DELETE FROM clients WHERE id = $1`, [clientId]);

  return NextResponse.redirect(
    new URL("/dashboard/clinicas", request.url),
    303
  );
}
