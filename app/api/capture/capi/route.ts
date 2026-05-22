import { NextResponse } from "next/server";
import { cookies, headers } from "next/headers";
import { getClinicBackendConfigBySlug } from "@/lib/clinics";
import {
  buildMetaExternalId,
  buildMetaFbc,
  sendMetaCapiEvent
} from "@/lib/meta-capi";
import { sanitizeString, inferSourcePlatform, EMPTY_CAMPAIGN_PARAMS } from "@/lib/utm";

export const runtime = "nodejs";

function getClientIp(hdrs: Awaited<ReturnType<typeof headers>>): string {
  return (
    hdrs.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    hdrs.get("x-real-ip") ||
    ""
  );
}

export async function POST(request: Request) {
  try {
    const body = await request.json() as Record<string, unknown>;

    const clientSlug = sanitizeString(body.clientSlug);
    if (!clientSlug) {
      return NextResponse.json({ ok: false, error: "clientSlug obrigatorio." }, { status: 400 });
    }

    const eventId = sanitizeString(body.eventId);
    if (!eventId) {
      return NextResponse.json({ ok: false, error: "eventId obrigatorio." }, { status: 400 });
    }

    const client = await getClinicBackendConfigBySlug(clientSlug);
    if (!client?.metaPixelId || !("metaCapiAccessToken" in client) || !client.metaCapiAccessToken) {
      return NextResponse.json({ ok: true, capi: false });
    }

    const campaignParams = { ...EMPTY_CAMPAIGN_PARAMS };
    for (const key of Object.keys(campaignParams) as Array<keyof typeof campaignParams>) {
      campaignParams[key] = sanitizeString(body[key]);
    }
    const sourcePlatform = inferSourcePlatform(campaignParams);

    const hdrs = await headers();
    const cookieStore = await cookies();

    const ip = getClientIp(hdrs);
    const ua = sanitizeString(body.userAgent) || hdrs.get("user-agent") || "";
    const fbclidVal = sanitizeString(body.fbclid) || sanitizeString(body.fbc);
    const fbc =
      sanitizeString(body.fbc) ||
      cookieStore.get("_fbc")?.value ||
      (fbclidVal ? buildMetaFbc(fbclidVal) : undefined);
    const fbp =
      sanitizeString(body.fbp) ||
      cookieStore.get("_fbp")?.value ||
      "";

    await sendMetaCapiEvent({
      pixelId: client.metaPixelId,
      accessToken: client.metaCapiAccessToken as string,
      testEventCode: (client as { metaTestEventCode?: string }).metaTestEventCode || undefined,
      eventName: "Lead",
      eventId,
      eventTime: Math.floor(Date.now() / 1000),
      actionSource: "website",
      eventSourceUrl: sanitizeString(body.pageUrl) || "",
      userData: {
        client_ip_address: ip || undefined,
        client_user_agent: ua || undefined,
        fbc: fbc || undefined,
        fbp: fbp || undefined,
        external_id: buildMetaExternalId(
          `${clientSlug}:${sanitizeString(body.whatsappNumber)}:${eventId}`
        )
      },
      customData: {
        client_slug: clientSlug,
        client_name: sanitizeString(body.clientName),
        source_platform: sourcePlatform,
        utm_source: campaignParams.utm_source,
        utm_medium: campaignParams.utm_medium,
        utm_campaign: campaignParams.utm_campaign,
        utm_content: campaignParams.utm_content,
        utm_term: campaignParams.utm_term,
        campaign_id: campaignParams.campaign_id,
        adset_id: campaignParams.adset_id,
        ad_id: campaignParams.ad_id,
        placement: campaignParams.placement,
        fbclid: campaignParams.fbclid,
        gclid: campaignParams.gclid,
        whatsapp_number: sanitizeString(body.whatsappNumber)
      }
    });

    return NextResponse.json({ ok: true, capi: true });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Erro desconhecido." },
      { status: 500 }
    );
  }
}
