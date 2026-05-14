import type { ResolvedClientConfig } from "@/lib/clients";
import type { LeadCapturePayload } from "@/lib/utm";

declare global {
  interface Window {
    dataLayer: unknown[];
    fbq?: MetaPixelFunction;
    _fbq?: MetaPixelFunction;
    gtag?: (...args: unknown[]) => void;
    __trackingState?: {
      gtmIds: Set<string>;
      metaPixels: Set<string>;
      googleTagLoaded: boolean;
      configuredGoogleIds: Set<string>;
    };
  }
}

type MetaPixelFunction = ((...args: unknown[]) => void) & {
  callMethod?: (...args: unknown[]) => void;
  queue?: unknown[];
  loaded?: boolean;
  version?: string;
  push?: (...args: unknown[]) => void;
};

function readCookie(name: string) {
  const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = document.cookie.match(
    new RegExp(`(?:^|; )${escapedName}=([^;]*)`)
  );

  return match ? decodeURIComponent(match[1]) : "";
}

function getTrackingState() {
  if (!window.__trackingState) {
    window.__trackingState = {
      gtmIds: new Set<string>(),
      metaPixels: new Set<string>(),
      googleTagLoaded: false,
      configuredGoogleIds: new Set<string>()
    };
  }

  return window.__trackingState;
}

function ensureDataLayer() {
  window.dataLayer = window.dataLayer || [];
}

function injectScript(id: string, src: string) {
  if (document.getElementById(id)) {
    return;
  }

  const script = document.createElement("script");
  script.id = id;
  script.async = true;
  script.src = src;
  document.head.appendChild(script);
}

function bootstrapGtm(gtmId?: string) {
  if (!gtmId) {
    return;
  }

  const state = getTrackingState();
  ensureDataLayer();

  if (state.gtmIds.has(gtmId)) {
    return;
  }

  state.gtmIds.add(gtmId);
  window.dataLayer.push({
    "gtm.start": Date.now(),
    event: "gtm.js"
  });

  injectScript(
    `gtm-script-${gtmId}`,
    `https://www.googletagmanager.com/gtm.js?id=${encodeURIComponent(gtmId)}`
  );
}

function bootstrapMetaPixel(metaPixelId?: string) {
  if (!metaPixelId) {
    return;
  }

  const state = getTrackingState();

  if (!window.fbq) {
    const fbq = function (...args: unknown[]) {
      if (fbq.callMethod) {
        fbq.callMethod(...args);
      } else {
        fbq.queue?.push(args);
      }
    } as MetaPixelFunction;

    fbq.push = fbq;
    fbq.loaded = true;
    fbq.version = "2.0";
    fbq.queue = [];

    window.fbq = fbq;
    window._fbq = fbq;

    injectScript(
      "meta-pixel-script",
      "https://connect.facebook.net/en_US/fbevents.js"
    );
  }

  if (state.metaPixels.has(metaPixelId)) {
    return;
  }

  state.metaPixels.add(metaPixelId);
  window.fbq("init", metaPixelId);
}

function bootstrapGoogleTag(config: {
  ga4Id?: string;
  googleAdsId?: string;
}) {
  const ids = [config.ga4Id, config.googleAdsId].filter(Boolean) as string[];

  if (!ids.length) {
    return;
  }

  const state = getTrackingState();
  ensureDataLayer();

  if (!window.gtag) {
    window.gtag = (...args: unknown[]) => {
      window.dataLayer.push(args);
    };
  }

  if (!state.googleTagLoaded) {
    injectScript(
      "google-tag-script",
      `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(ids[0])}`
    );
    window.gtag("js", new Date());
    state.googleTagLoaded = true;
  }

  for (const id of ids) {
    if (state.configuredGoogleIds.has(id)) {
      continue;
    }

    window.gtag("config", id, {
      send_page_view: false
    });
    state.configuredGoogleIds.add(id);
  }
}

function buildSharedEventPayload(payload: LeadCapturePayload) {
  return {
    event_id: payload.eventId,
    client_name: payload.clientName,
    client_slug: payload.clientSlug,
    whatsapp_number: payload.whatsappNumber,
    utm_source: payload.utm_source,
    utm_medium: payload.utm_medium,
    utm_campaign: payload.utm_campaign,
    utm_content: payload.utm_content,
    utm_term: payload.utm_term,
    fbclid: payload.fbclid,
    gclid: payload.gclid,
    campaign_id: payload.campaign_id,
    adset_id: payload.adset_id,
    ad_id: payload.ad_id,
    placement: payload.placement,
    source: payload.source,
    medium: payload.medium,
    device: payload.device,
    keyword: payload.keyword,
    matchtype: payload.matchtype,
    network: payload.network,
    page_path: payload.pagePath,
    page_url: payload.pageUrl,
    referrer: payload.referrer,
    language: payload.language,
    source_platform: payload.sourcePlatform
  };
}

function buildMetaLeadPayload(payload: LeadCapturePayload) {
  return {
    client_name: payload.clientName,
    client_slug: payload.clientSlug,
    whatsapp_number: payload.whatsappNumber,
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
    fbc: payload.fbclid ? readCookie("_fbc") || payload.fbclid : "",
    fbp: readCookie("_fbp"),
    source_platform: payload.sourcePlatform
  };
}

export type TrackingConfig = {
  gtmId?: string;
  metaPixelId?: string;
  ga4Id?: string;
  googleAdsId?: string;
  googleAdsConversionLabel?: string;
};

export function trackFormLead(config: TrackingConfig, data: {
  formName: string;
  clientSlug: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmContent?: string;
  utmTerm?: string;
  gclid?: string;
  fbclid?: string;
}) {
  try {
    ensureDataLayer();

    // Standard GA4 generate_lead event — can be imported as conversion in Google Ads
    window.dataLayer.push({
      event: "generate_lead",
      form_name: data.formName,
      client_slug: data.clientSlug,
      utm_source: data.utmSource,
      utm_medium: data.utmMedium,
      utm_campaign: data.utmCampaign,
      utm_content: data.utmContent,
      utm_term: data.utmTerm,
      gclid: data.gclid,
    });

    if (config.ga4Id && window.gtag) {
      window.gtag("event", "generate_lead", {
        form_name: data.formName,
        client_slug: data.clientSlug,
        utm_source: data.utmSource,
        utm_medium: data.utmMedium,
        utm_campaign: data.utmCampaign,
        utm_content: data.utmContent,
        utm_term: data.utmTerm,
        gclid: data.gclid,
      });
    }

    if (config.googleAdsId && config.googleAdsConversionLabel && window.gtag) {
      window.gtag("event", "conversion", {
        send_to: `${config.googleAdsId}/${config.googleAdsConversionLabel}`,
      });
    }

    if (config.metaPixelId && window.fbq) {
      window.fbq("track", "Lead", {
        form_name: data.formName,
        utm_source: data.utmSource,
        utm_campaign: data.utmCampaign,
        fbclid: data.fbclid,
      });
    }
  } catch {
    // Tracking é sempre best-effort.
  }
}

export function initializeTrackingConfig(config: TrackingConfig) {
  try {
    ensureDataLayer();
    bootstrapGtm(config.gtmId);
    bootstrapMetaPixel(config.metaPixelId);
    bootstrapGoogleTag({ ga4Id: config.ga4Id, googleAdsId: config.googleAdsId });
  } catch {
    // Falhas de scripts externos não podem bloquear o fluxo.
  }
}

export function initializeTracking(client: ResolvedClientConfig) {
  try {
    ensureDataLayer();
    bootstrapGtm(client.gtmId);
    bootstrapMetaPixel(client.metaPixelId);
    bootstrapGoogleTag({
      ga4Id: client.ga4Id,
      googleAdsId: client.googleAdsId
    });
  } catch {
    // Falhas de scripts externos não podem bloquear o fluxo.
  }
}

export function trackRedirectPageView(
  client: ResolvedClientConfig,
  payload: LeadCapturePayload
) {
  try {
    const eventPayload = buildSharedEventPayload(payload);

    window.dataLayer.push({
      event: "whatsapp_redirect_page_view",
      ...eventPayload
    });

    if (client.metaPixelId && window.fbq) {
      window.fbq("track", "PageView");
      window.fbq("trackCustom", "whatsapp_redirect_page_view", {
        client_name: payload.clientName,
        client_slug: payload.clientSlug,
        whatsapp_number: payload.whatsappNumber,
        utm_source: payload.utm_source,
        utm_medium: payload.utm_medium,
        utm_campaign: payload.utm_campaign,
        utm_content: payload.utm_content,
        utm_term: payload.utm_term,
        fbclid: payload.fbclid,
        source_platform: payload.sourcePlatform
      });
    }

    if (client.ga4Id && window.gtag) {
      window.gtag("event", "whatsapp_redirect_page_view", {
        client_name: payload.clientName,
        client_slug: payload.clientSlug,
        whatsapp_number: payload.whatsappNumber,
        utm_source: payload.utm_source,
        utm_medium: payload.utm_medium,
        utm_campaign: payload.utm_campaign,
        utm_content: payload.utm_content,
        utm_term: payload.utm_term,
        gclid: payload.gclid,
        source_platform: payload.sourcePlatform
      });
    }
  } catch {
    // Tracking é sempre best-effort.
  }
}

export function trackRedirectEvent(
  client: ResolvedClientConfig,
  payload: LeadCapturePayload
) {
  try {
    const eventPayload = buildSharedEventPayload(payload);

    window.dataLayer.push({
      event: "whatsapp_redirect",
      event_category: "lead",
      event_action: "redirect_to_whatsapp",
      // Include conversion IDs so GTM tags can reference them via DL variables
      google_conversion_id: client.googleAdsId || undefined,
      google_conversion_label: client.googleAdsConversionLabel || undefined,
      ...eventPayload
    });

    if (client.metaPixelId && window.fbq) {
      window.fbq(
        "track",
        "Lead",
        buildMetaLeadPayload(payload),
        {
          eventID: payload.eventId
        }
      );
      window.fbq("trackCustom", "whatsapp_lead_click", {
        ...buildMetaLeadPayload(payload)
      });
    }

    if (client.ga4Id && window.gtag) {
      window.gtag("event", "whatsapp_lead_click", {
        client_name: payload.clientName,
        client_slug: payload.clientSlug,
        whatsapp_number: payload.whatsappNumber,
        utm_source: payload.utm_source,
        utm_medium: payload.utm_medium,
        utm_campaign: payload.utm_campaign,
        utm_content: payload.utm_content,
        utm_term: payload.utm_term,
        gclid: payload.gclid,
        source_platform: payload.sourcePlatform
      });
    }

    if (
      client.googleAdsId &&
      client.googleAdsConversionLabel &&
      window.gtag
    ) {
      window.gtag("event", "conversion", {
        send_to: `${client.googleAdsId}/${client.googleAdsConversionLabel}`
      });
    }
  } catch {
    // Falhas de terceiros não interrompem o redirecionamento.
  }
}
