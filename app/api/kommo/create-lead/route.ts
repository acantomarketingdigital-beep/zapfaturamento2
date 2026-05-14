import { cookies, headers } from "next/headers";
import { NextResponse } from "next/server";
import {
  getClinicBackendConfigBySlug,
  type ManagedClinicServerRecord
} from "@/lib/clinics";
import { createKommoLead } from "@/lib/kommo";
import {
  insertLeadEvent,
  isBot,
  updateLeadEventStatus,
  type KommoLeadStatus
} from "@/lib/leads";
import {
  buildMetaExternalId,
  buildMetaFbc,
  sendMetaCapiEvent
} from "@/lib/meta-capi";
import {
  EMPTY_CAMPAIGN_PARAMS,
  type LeadCapturePayload,
  inferSourcePlatform,
  sanitizeString
} from "@/lib/utm";

export const runtime = "nodejs";

const isDevelopment = process.env.NODE_ENV === "development";

type LeadCaptureApiResponse = {
  success: boolean;
  noteCreated: boolean;
  kommoEnabled: boolean;
  kommoStatus: KommoLeadStatus;
  kommoLeadId: number | null;
  kommoError: string | null;
  eventId: number | string | null;
  eventSaved: boolean;
  metaCapiEnabled: boolean;
  metaCapiSuccess: boolean | null;
  metaCapiEventId: string | null;
  metaCapiError: string | null;
};

function toSafePayload(body: unknown): LeadCapturePayload | null {
  if (!body || typeof body !== "object") {
    return null;
  }

  const data = body as Record<string, unknown>;
  const campaignParams = { ...EMPTY_CAMPAIGN_PARAMS };

  for (const key of Object.keys(campaignParams) as Array<keyof typeof campaignParams>) {
    campaignParams[key] = sanitizeString(data[key]);
  }

  return {
    ...campaignParams,
    eventId: sanitizeString(data.eventId),
    clientSlug: sanitizeString(data.clientSlug),
    clientName: sanitizeString(data.clientName),
    whatsappNumber: sanitizeString(data.whatsappNumber),
    whatsappMessage: sanitizeString(data.whatsappMessage),
    redirectUrl: sanitizeString(data.redirectUrl),
    pageUrl: sanitizeString(data.pageUrl),
    pagePath: sanitizeString(data.pagePath),
    referrer: sanitizeString(data.referrer),
    userAgent: sanitizeString(data.userAgent),
    timestamp: sanitizeString(data.timestamp),
    language: sanitizeString(data.language),
    sourcePlatform: inferSourcePlatform(campaignParams),
    fbp: sanitizeString(data.fbp) || undefined,
    fbc: sanitizeString(data.fbc) || undefined,
    internalCampaignId: sanitizeString(data.internalCampaignId) || undefined,
    internalCampaignSlug: sanitizeString(data.internalCampaignSlug) || undefined,
    internalCreativeId: sanitizeString(data.internalCreativeId) || undefined,
    internalCreativeSlug: sanitizeString(data.internalCreativeSlug) || undefined
  };
}

function buildLeadStatusPayload(params: {
  kommoEnabled: boolean;
  kommoStatus: KommoLeadStatus;
  kommoSuccess: boolean | null;
  kommoLeadId: number | null;
  kommoError: string | null;
  metaCapiSuccess: boolean | null;
  metaCapiEventId: string | null;
  metaCapiError: string | null;
}) {
  return params;
}

function getClientIpAddress(headerStore: Awaited<ReturnType<typeof headers>>) {
  // Prefer IPv6 sources: cf-connecting-ipv6 (Cloudflare) or x-real-ip if IPv6
  const cfIpv6 = headerStore.get("cf-connecting-ipv6")?.trim() || "";
  if (cfIpv6) return cfIpv6;

  const forwardedFor = headerStore.get("x-forwarded-for") || "";
  const firstForwardedIp = forwardedFor.split(",")[0]?.trim() || "";

  return (
    firstForwardedIp ||
    headerStore.get("x-real-ip") ||
    headerStore.get("cf-connecting-ip") ||
    ""
  );
}

function isMetaCapiConfigured(client: ManagedClinicServerRecord) {
  return Boolean(client.metaPixelId && client.metaCapiAccessToken);
}

async function sendMetaLeadEvent(
  payload: LeadCapturePayload,
  client: ManagedClinicServerRecord,
  requestHeaders: Awaited<ReturnType<typeof headers>>,
  cookieStore: Awaited<ReturnType<typeof cookies>>
) {
  if (!client.metaPixelId || !client.metaCapiAccessToken) {
    return {
      enabled: false,
      success: null,
      error: null
    };
  }

  const userAgent =
    payload.userAgent ||
    requestHeaders.get("user-agent") ||
    "";
  const fbc =
    payload.fbc ||
    cookieStore.get("_fbc")?.value ||
    buildMetaFbc(payload.fbclid);
  const fbp =
    payload.fbp ||
    cookieStore.get("_fbp")?.value ||
    "";

  await sendMetaCapiEvent({
    pixelId: client.metaPixelId,
    accessToken: client.metaCapiAccessToken,
    testEventCode: client.metaTestEventCode,
    eventName: "Lead",
    eventId: payload.eventId,
    eventTime: Math.floor(Date.now() / 1000),
    actionSource: "website",
    eventSourceUrl: payload.pageUrl,
    userData: {
      client_ip_address: getClientIpAddress(requestHeaders),
      client_user_agent: userAgent,
      fbc,
      fbp,
      external_id: buildMetaExternalId(
        `${payload.clientSlug}:${payload.whatsappNumber}:${payload.eventId}`
      )
    },
    customData: {
      client_slug: payload.clientSlug,
      client_name: payload.clientName,
      source_platform: payload.sourcePlatform,
      utm_source: payload.utm_source,
      utm_medium: payload.utm_medium,
      utm_campaign: payload.utm_campaign,
      utm_content: payload.utm_content,
      utm_term: payload.utm_term,
      campaign_id: payload.campaign_id,
      adset_id: payload.adset_id,
      ad_id: payload.ad_id,
      placement: payload.placement,
      fbclid: payload.fbclid,
      gclid: payload.gclid,
      whatsapp_number: payload.whatsappNumber
    }
  });

  return {
    enabled: true,
    success: true,
    error: null
  };
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const payload = toSafePayload(body);

    if (!payload?.clientSlug) {
      return NextResponse.json(
        { success: false, error: "clientSlug e obrigatorio." },
        { status: 400 }
      );
    }

    if (!payload.eventId) {
      return NextResponse.json(
        { success: false, error: "eventId e obrigatorio." },
        { status: 400 }
      );
    }

    const client = await getClinicBackendConfigBySlug(payload.clientSlug);

    if (!client) {
      return NextResponse.json(
        { success: false, error: "Cliente nao encontrado." },
        { status: 404 }
      );
    }

    if (!client.isActive) {
      return NextResponse.json(
        { success: false, error: "Cliente inativo." },
        { status: 409 }
      );
    }

    if (!client.whatsappNumber) {
      return NextResponse.json(
        { success: false, error: "Numero de WhatsApp nao configurado." },
        { status: 400 }
      );
    }

    // Rejeita bots antes de salvar no banco ou enviar CAPI
    const requestHeaders = await headers();
    const userAgent = payload.userAgent || requestHeaders.get("user-agent") || "";
    if (isBot(userAgent)) {
      return NextResponse.json({ success: false, error: "Bot detectado." }, { status: 400 });
    }

    const normalizedPayload: LeadCapturePayload = {
      ...payload,
      clientName: client.clientName,
      whatsappNumber: client.whatsappNumber,
      whatsappMessage: payload.whatsappMessage,
      redirectUrl: payload.redirectUrl
    };

    const initialStatus = buildLeadStatusPayload({
      kommoEnabled: client.kommoEnabled,
      kommoStatus: client.kommoEnabled ? "pending" : "disabled",
      kommoSuccess: client.kommoEnabled ? null : false,
      kommoLeadId: null,
      kommoError: null,
      metaCapiSuccess: null,
      metaCapiEventId: normalizedPayload.eventId,
      metaCapiError: null
    });

    let eventId: number | string | null = null;

    try {
      eventId = await insertLeadEvent(normalizedPayload, initialStatus);
    } catch (databaseError) {
      if (isDevelopment) {
        console.error("[capture-api] erro ao salvar lead no banco", {
          message:
            databaseError instanceof Error
              ? databaseError.message
              : "database_error"
        });
      }
    }

    const cookieStore = await cookies();

    let metaCapiSuccess: boolean | null = null;
    let metaCapiError: string | null = null;
    const metaCapiEnabled = isMetaCapiConfigured(client);

    if (metaCapiEnabled) {
      try {
        await sendMetaLeadEvent(
          normalizedPayload,
          client,
          requestHeaders,
          cookieStore
        );
        metaCapiSuccess = true;
      } catch (error) {
        metaCapiSuccess = false;
        metaCapiError =
          error instanceof Error ? error.message : "Falha desconhecida na Meta CAPI.";

        if (isDevelopment) {
          console.error("[capture-api] erro na Meta CAPI", {
            slug: client.clientSlug,
            eventId,
            message: metaCapiError
          });
        }
      }
    }

    if (!client.kommoEnabled) {
      if (eventId) {
        await updateLeadEventStatus(
          Number(eventId),
          buildLeadStatusPayload({
            kommoEnabled: false,
            kommoStatus: "disabled",
            kommoSuccess: false,
            kommoLeadId: null,
            kommoError: null,
            metaCapiSuccess,
            metaCapiEventId: normalizedPayload.eventId,
            metaCapiError
          })
        );
      }

      return NextResponse.json<LeadCaptureApiResponse>({
        success: true,
        noteCreated: false,
        kommoEnabled: false,
        kommoStatus: "disabled",
        kommoLeadId: null,
        kommoError: null,
        eventId,
        eventSaved: Boolean(eventId),
        metaCapiEnabled,
        metaCapiSuccess,
        metaCapiEventId: normalizedPayload.eventId,
        metaCapiError
      });
    }

    let kommoError: string | null = null;
    let kommoLeadId: number | null = null;
    let noteCreated = false;

    try {
      const result = await createKommoLead(normalizedPayload, client);
      kommoLeadId = result.leadId;
      noteCreated = result.noteCreated;

      if (eventId) {
        await updateLeadEventStatus(
          Number(eventId),
          buildLeadStatusPayload({
            kommoEnabled: true,
            kommoStatus: "success",
            kommoSuccess: true,
            kommoLeadId: result.leadId,
            kommoError: null,
            metaCapiSuccess,
            metaCapiEventId: normalizedPayload.eventId,
            metaCapiError
          })
        );
      }

      if (isDevelopment) {
        console.info("[capture-api] lead enviado para Kommo", {
          slug: client.clientSlug,
          eventId,
          kommoLeadId: result.leadId
        });
      }

      return NextResponse.json<LeadCaptureApiResponse>({
        success: true,
        noteCreated,
        kommoEnabled: true,
        kommoStatus: "success",
        kommoLeadId,
        kommoError: null,
        eventId,
        eventSaved: Boolean(eventId),
        metaCapiEnabled,
        metaCapiSuccess,
        metaCapiEventId: normalizedPayload.eventId,
        metaCapiError
      });
    } catch (error) {
      kommoError =
        error instanceof Error ? error.message : "Falha desconhecida na Kommo.";

      if (eventId) {
        await updateLeadEventStatus(
          Number(eventId),
          buildLeadStatusPayload({
            kommoEnabled: true,
            kommoStatus: "error",
            kommoSuccess: false,
            kommoLeadId: null,
            kommoError,
            metaCapiSuccess,
            metaCapiEventId: normalizedPayload.eventId,
            metaCapiError
          })
        );
      }

      if (isDevelopment) {
        console.error("[capture-api] erro na Kommo", {
          slug: client.clientSlug,
          eventId,
          message: kommoError
        });
      }

      return NextResponse.json<LeadCaptureApiResponse>({
        success: false,
        noteCreated: false,
        kommoEnabled: true,
        kommoStatus: "error",
        kommoLeadId: null,
        kommoError,
        eventId,
        eventSaved: Boolean(eventId),
        metaCapiEnabled,
        metaCapiSuccess,
        metaCapiEventId: normalizedPayload.eventId,
        metaCapiError
      });
    }
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Falha desconhecida na API.";

    if (isDevelopment) {
      console.error("[capture-api] erro", message);
    }

    return NextResponse.json(
      {
        success: false,
        error: message
      },
      { status: 500 }
    );
  }
}
