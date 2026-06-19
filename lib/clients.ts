export type KommoCustomFieldMap = {
  clientName?: number | null;
  whatsappNumber?: number | null;
  sourcePlatform?: number | null;
  utmSource?: number | null;
  utmMedium?: number | null;
  utmCampaign?: number | null;
  utmContent?: number | null;
  utmTerm?: number | null;
  fbclid?: number | null;
  gclid?: number | null;
  campaignId?: number | null;
  adsetId?: number | null;
  adId?: number | null;
  placement?: number | null;
  device?: number | null;
  keyword?: number | null;
  matchtype?: number | null;
  network?: number | null;
  pageUrl?: number | null;
  referrer?: number | null;
  userAgent?: number | null;
  timestamp?: number | null;
};

export type ClientConfig = {
  clientSlug: string;
  clientName: string;
  logoUrl?: string;
  whatsappNumber: string;
  whatsappMessage: string;
  redirectDelay?: number;
  metaPixelId?: string;
  metaTestEventCode?: string;
  gtmId?: string;
  ga4Id?: string;
  googleAdsId?: string;
  googleAdsConversionLabel?: string;
  kommoEnabled?: boolean;
  kommoPipelineId?: number;
  kommoStatusId?: number;
  kommoCustomFields?: KommoCustomFieldMap;
  kommoSubdomain?: string;
  messengerUrl?: string;
};

export type ResolvedClientConfig = Required<
  Pick<
    ClientConfig,
    | "clientSlug"
    | "clientName"
    | "whatsappNumber"
    | "whatsappMessage"
    | "redirectDelay"
    | "kommoEnabled"
  >
> &
  Omit<
    ClientConfig,
    | "clientSlug"
    | "clientName"
    | "whatsappNumber"
    | "whatsappMessage"
    | "redirectDelay"
    | "kommoEnabled"
  > & {
    kommoCustomFields: KommoCustomFieldMap;
    metaCapiConfigured: boolean;
  };

export const DEFAULT_REDIRECT_DELAY = 2000;

export const DEFAULT_KOMMO_CUSTOM_FIELDS: KommoCustomFieldMap = {
  clientName: null,
  whatsappNumber: null,
  sourcePlatform: null,
  utmSource: null,
  utmMedium: null,
  utmCampaign: null,
  utmContent: null,
  utmTerm: null,
  fbclid: null,
  gclid: null,
  campaignId: null,
  adsetId: null,
  adId: null,
  placement: null,
  device: null,
  keyword: null,
  matchtype: null,
  network: null,
  pageUrl: null,
  referrer: null,
  userAgent: null,
  timestamp: null
};

export const clients: Record<string, ClientConfig> = {};

function normalizeOptionalString(value?: string) {
  return value?.trim() || undefined;
}

export function getClientConfig(slug: string): ResolvedClientConfig | null {
  const client = clients[slug];

  if (!client) {
    return null;
  }

  return {
    ...client,
    clientSlug: client.clientSlug,
    clientName: client.clientName,
    logoUrl: normalizeOptionalString(client.logoUrl),
    whatsappNumber: client.whatsappNumber,
    whatsappMessage: client.whatsappMessage,
    redirectDelay: client.redirectDelay ?? DEFAULT_REDIRECT_DELAY,
    metaPixelId: normalizeOptionalString(client.metaPixelId),
    metaTestEventCode: normalizeOptionalString(client.metaTestEventCode),
    gtmId: normalizeOptionalString(client.gtmId),
    ga4Id: normalizeOptionalString(client.ga4Id),
    googleAdsId: normalizeOptionalString(client.googleAdsId),
    googleAdsConversionLabel: normalizeOptionalString(
      client.googleAdsConversionLabel
    ),
    kommoEnabled: client.kommoEnabled ?? true,
    metaCapiConfigured: false,
    kommoCustomFields: {
      ...DEFAULT_KOMMO_CUSTOM_FIELDS,
      ...client.kommoCustomFields
    }
  };
}

export function getAllClientSlugs() {
  return Object.keys(clients);
}
