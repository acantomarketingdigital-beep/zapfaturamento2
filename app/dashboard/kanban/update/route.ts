import { createHash, randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/dashboard-auth";
import { updateLeadStatus } from "@/lib/kanban";
import { normalizeLeadStatus } from "@/lib/kanban-shared";
import { buildMetaExternalId, buildMetaFbc, sendMetaCapiEvent } from "@/lib/meta-capi";
import { hasDatabaseConfig, queryDb } from "@/lib/db";

export const runtime = "nodejs";

function sha256(value: string) {
  return createHash("sha256").update(value.trim().toLowerCase()).digest("hex");
}

async function firePurchaseCapi(leadId: number, paidAmountCents: number) {
  if (!hasDatabaseConfig()) return;

  const result = await queryDb<{
    client_slug: string;
    lead_phone: string | null;
    lead_email: string | null;
    fbclid: string | null;
    page_url: string | null;
    meta_pixel_id: string | null;
    meta_capi_access_token: string | null;
    meta_test_event_code: string | null;
  }>(
    `SELECT
       l.client_slug, l.lead_phone, l.lead_email, l.fbclid, l.page_url,
       c.meta_pixel_id, c.meta_capi_access_token, c.meta_test_event_code
     FROM whatsapp_leads l
     JOIN clients c ON c.client_slug = l.client_slug
     WHERE l.id = $1
     LIMIT 1`,
    [leadId]
  );

  const row = result.rows[0];
  if (!row?.meta_pixel_id || !row?.meta_capi_access_token) return;

  const ph = row.lead_phone ? sha256(row.lead_phone.replace(/\D/g, "")) : undefined;
  const em = row.lead_email ? sha256(row.lead_email) : undefined;
  const fbc = buildMetaFbc(row.fbclid);
  const externalId = buildMetaExternalId(`purchase:${row.client_slug}:${leadId}`);
  const eventId = `purchase-${leadId}-${randomUUID().slice(0, 8)}`;
  const valueReais = paidAmountCents / 100;

  await sendMetaCapiEvent({
    pixelId: row.meta_pixel_id,
    accessToken: row.meta_capi_access_token,
    testEventCode: row.meta_test_event_code ?? undefined,
    eventName: "Purchase",
    eventId,
    eventTime: Math.floor(Date.now() / 1000),
    actionSource: "website",
    eventSourceUrl: row.page_url || "",
    userData: {
      ph,
      em,
      fbc,
      external_id: externalId
    },
    customData: {
      value: valueReais,
      currency: "BRL"
    }
  });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ success: false, error: "Nao autenticado." }, { status: 401 });
  }

  const body = (await request.json()) as {
    leadId?: number;
    status?: string;
    paidAmountCents?: number | null;
    leadEmail?: string | null;
    leadName?: string | null;
  };

  if (!body.leadId || !body.status) {
    return NextResponse.json({ success: false, error: "Dados invalidos." }, { status: 400 });
  }

  const status = normalizeLeadStatus(body.status);

  await updateLeadStatus(body.leadId, status, {
    paidAmountCents: body.paidAmountCents ?? null,
    scopeClientSlug: user.clientSlug,
    leadEmail: body.leadEmail ?? null,
    leadName: body.leadName ?? null,
    changedBy: user.email
  });

  if (status === "pago" && body.paidAmountCents && body.paidAmountCents > 0) {
    firePurchaseCapi(body.leadId, body.paidAmountCents).catch(() => {});
  }

  return NextResponse.json({ success: true });
}
