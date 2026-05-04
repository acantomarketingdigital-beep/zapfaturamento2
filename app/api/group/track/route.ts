import { NextResponse } from "next/server";
import { createHash } from "node:crypto";
import { headers } from "next/headers";
import {
  getGroupCampaign,
  insertGroupTrackingEvent
} from "@/lib/group-campaigns";
import { getClinicBackendConfigBySlug } from "@/lib/clinics";
import {
  buildMetaExternalId,
  buildMetaFbc,
  sendMetaCapiEvent
} from "@/lib/meta-capi";

function getClientIp(hdrs: Awaited<ReturnType<typeof headers>>): string {
  return (
    hdrs.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    hdrs.get("x-real-ip") ||
    ""
  );
}

function sha256(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "JSON invalido." }, { status: 400 });
  }

  const {
    client_slug,
    tracking_slug,
    event_name,
    event_id,
    utm_source,
    utm_medium,
    utm_campaign,
    utm_content,
    utm_term,
    meta_campaign_id,
    meta_adset_id,
    meta_ad_id,
    placement,
    fbp,
    fbc,
    fbclid,
    user_agent,
    event_source_url
  } = body as Record<string, string | null | undefined>;

  if (!client_slug || !tracking_slug || !event_name || !event_id) {
    return NextResponse.json({ error: "Campos obrigatorios ausentes." }, { status: 400 });
  }

  if (!["group_page_view", "group_join_click"].includes(event_name)) {
    return NextResponse.json({ error: "Evento invalido." }, { status: 400 });
  }

  const campaign = await getGroupCampaign(client_slug, tracking_slug);
  if (!campaign) {
    return NextResponse.json({ error: "Campanha nao encontrada." }, { status: 404 });
  }

  const hdrs = await headers();
  const ip = getClientIp(hdrs);
  const ua = user_agent || hdrs.get("user-agent") || "";

  const ipHash = ip ? sha256(ip) : null;
  const uaHash = ua ? sha256(ua) : null;

  const resolvedFbc = fbc || (fbclid ? buildMetaFbc(fbclid) : null);

  let capiSent = false;
  let capiSuccess: boolean | null = null;

  if (event_name === "group_join_click") {
    try {
      const client = await getClinicBackendConfigBySlug(client_slug) as { metaPixelId?: string; metaCapiAccessToken?: string; metaTestEventCode?: string } | null;
      if (client?.metaPixelId && client?.metaCapiAccessToken) {
        const sourceUrl =
          event_source_url ||
          `${(process.env.NEXT_PUBLIC_BASE_URL ?? "https://zapfaturamento.com.br").trim()}/g/${client_slug}/${tracking_slug}`;

        await sendMetaCapiEvent({
          pixelId: client.metaPixelId,
          accessToken: client.metaCapiAccessToken,
          testEventCode: client.metaTestEventCode || undefined,
          eventName: "Lead",
          eventId: event_id,
          eventTime: Math.floor(Date.now() / 1000),
          actionSource: "website",
          eventSourceUrl: sourceUrl,
          userData: {
            client_ip_address: ip || undefined,
            client_user_agent: ua || undefined,
            fbc: resolvedFbc || undefined,
            fbp: fbp || undefined,
            external_id: buildMetaExternalId(`group:${client_slug}:${tracking_slug}:${event_id}`)
          },
          customData: {
            content_name: campaign.name,
            content_category: "group_whatsapp"
          }
        });
        capiSent = true;
        capiSuccess = true;
      }
    } catch (err) {
      console.error("[GROUP TRACK] CAPI failed", String(err));
      capiSent = true;
      capiSuccess = false;
    }
  }

  try {
    await insertGroupTrackingEvent({
      clientSlug: client_slug,
      campaignId: campaign.id,
      eventName: event_name,
      eventId: event_id,
      utmSource: utm_source,
      utmMedium: utm_medium,
      utmCampaign: utm_campaign,
      utmContent: utm_content,
      utmTerm: utm_term,
      metaCampaignId: meta_campaign_id,
      metaAdsetId: meta_adset_id,
      metaAdId: meta_ad_id,
      placement,
      fbp: fbp || null,
      fbc: resolvedFbc || null,
      ipHash,
      userAgentHash: uaHash,
      capiSent,
      capiSuccess: capiSent ? capiSuccess : null
    });
  } catch (err) {
    console.error("[GROUP TRACK] DB insert failed", String(err));
  }

  return NextResponse.json({ ok: true, capi_sent: capiSent, capi_success: capiSuccess });
}
