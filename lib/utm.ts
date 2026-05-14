import type { ResolvedClientConfig } from "@/lib/clients";

export const TRACKED_QUERY_KEYS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
  "utm_term",
  "fbclid",
  "gclid",
  "campaign_id",
  "adset_id",
  "ad_id",
  "placement",
  "source",
  "medium",
  "device",
  "keyword",
  "matchtype",
  "network"
] as const;

export type TrackedQueryKey = (typeof TRACKED_QUERY_KEYS)[number];
export type SourcePlatform = "Meta Ads" | "Google Ads" | "Outro";

export type CampaignParams = Record<TrackedQueryKey, string>;

export type LeadCapturePayload = CampaignParams & {
  eventId: string;
  clientSlug: string;
  clientName: string;
  whatsappNumber: string;
  whatsappMessage: string;
  redirectUrl: string;
  pageUrl: string;
  pagePath: string;
  referrer: string;
  userAgent: string;
  timestamp: string;
  language: string;
  sourcePlatform: SourcePlatform;
  fbp?: string;
  fbc?: string;
  internalCampaignId?: string;
  internalCampaignSlug?: string;
  internalCreativeId?: string;
  internalCreativeSlug?: string;
};

export const EMPTY_CAMPAIGN_PARAMS: CampaignParams = {
  utm_source: "",
  utm_medium: "",
  utm_campaign: "",
  utm_content: "",
  utm_term: "",
  fbclid: "",
  gclid: "",
  campaign_id: "",
  adset_id: "",
  ad_id: "",
  placement: "",
  source: "",
  medium: "",
  device: "",
  keyword: "",
  matchtype: "",
  network: ""
};

export function sanitizeString(value: unknown) {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim();
}

export function extractTrackedParams(searchParams: URLSearchParams): CampaignParams {
  const params = { ...EMPTY_CAMPAIGN_PARAMS };

  for (const key of TRACKED_QUERY_KEYS) {
    params[key] = sanitizeString(searchParams.get(key));
  }

  return params;
}

export function inferSourcePlatform(params: CampaignParams): SourcePlatform {
  const source = params.utm_source.toLowerCase();

  if (
    params.fbclid ||
    source.includes("facebook") ||
    source.includes("instagram") ||
    source.includes("meta")
  ) {
    return "Meta Ads";
  }

  if (params.gclid || source.includes("google")) {
    return "Google Ads";
  }

  return "Outro";
}

export function buildCampaignAwareWhatsAppMessage(
  _clientName: string,
  baseMessage: string,
  _params: CampaignParams,
  _sourcePlatform: SourcePlatform
) {
  return baseMessage.trim();
}

export function buildWhatsAppUrl(number: string, message: string) {
  const sanitizedNumber = number.replace(/\D/g, "");
  return `https://wa.me/${sanitizedNumber}?text=${encodeURIComponent(message)}`;
}

export function buildLeadCapturePayload({
  client,
  url,
  redirectUrl,
  referrer,
  userAgent,
  language,
  eventId,
  campaign,
  creative
}: {
  client: ResolvedClientConfig;
  url: URL;
  redirectUrl: string;
  referrer: string;
  userAgent: string;
  language: string;
  eventId: string;
  campaign?: { id: string; slug: string; name: string; defaultMessage: string };
  creative?: { id: string; slug: string };
}): LeadCapturePayload {
  const params = extractTrackedParams(url.searchParams);
  const sourcePlatform = inferSourcePlatform(params);
  const baseMessage = campaign?.defaultMessage || client.whatsappMessage;

  return {
    ...params,
    eventId,
    clientSlug: client.clientSlug,
    clientName: client.clientName,
    whatsappNumber: client.whatsappNumber,
    whatsappMessage: buildCampaignAwareWhatsAppMessage(
      client.clientName,
      baseMessage,
      params,
      sourcePlatform
    ),
    redirectUrl,
    pageUrl: url.toString(),
    pagePath: url.pathname,
    referrer: referrer.trim(),
    userAgent: userAgent.trim(),
    timestamp: new Date().toISOString(),
    language: language.trim(),
    sourcePlatform,
    ...(campaign ? { internalCampaignId: campaign.id, internalCampaignSlug: campaign.slug } : {}),
    ...(creative ? { internalCreativeId: creative.id, internalCreativeSlug: creative.slug } : {})
  };
}
