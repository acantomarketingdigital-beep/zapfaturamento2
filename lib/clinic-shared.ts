import type { KommoCustomFieldMap } from "@/lib/clients";

export const MANAGED_KOMMO_FIELDS: Array<{
  key: keyof KommoCustomFieldMap;
  label: string;
  description: string;
}> = [
  {
    key: "clientName",
    label: "Nome da clinica",
    description: "Campo da Kommo para identificar o nome da clinica."
  },
  {
    key: "whatsappNumber",
    label: "WhatsApp",
    description: "Campo para gravar o numero do WhatsApp."
  },
  {
    key: "sourcePlatform",
    label: "Origem",
    description: "Campo para Meta Ads, Google Ads ou Outro."
  },
  {
    key: "utmCampaign",
    label: "Campanha",
    description: "Campo para utm_campaign."
  },
  {
    key: "utmContent",
    label: "Criativo",
    description: "Campo para utm_content."
  },
  {
    key: "utmTerm",
    label: "Publico",
    description: "Campo para utm_term."
  },
  {
    key: "fbclid",
    label: "fbclid",
    description: "Campo para o click ID do Meta."
  },
  {
    key: "gclid",
    label: "gclid",
    description: "Campo para o click ID do Google."
  },
  {
    key: "pageUrl",
    label: "Pagina acessada",
    description: "Campo para a URL completa visitada."
  }
];

export function getKommoCustomFieldDefinitions() {
  return MANAGED_KOMMO_FIELDS;
}

export function slugifyClinicName(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function buildClinicUrl(baseUrl: string, slug: string) {
  return `${baseUrl}/w/${encodeURIComponent(slug)}`;
}

export function buildMetaExampleUrl(baseUrl: string, slug: string) {
  const encodedSlug = encodeURIComponent(slug);
  return `${baseUrl}/w/${encodedSlug}?utm_source=facebook&utm_medium=cpc&utm_campaign={{campaign.name}}&utm_content={{ad.name}}&utm_term={{adset.name}}&campaign_id={{campaign.id}}&adset_id={{adset.id}}&ad_id={{ad.id}}&placement={{placement}}`;
}

export function buildGoogleExampleUrl(baseUrl: string, slug: string) {
  const encodedSlug = encodeURIComponent(slug);
  return `${baseUrl}/w/${encodedSlug}?utm_source=google&utm_medium=cpc&utm_campaign={campaignid}&utm_content={creative}&utm_term={keyword}&gclid={gclid}&device={device}&network={network}&matchtype={matchtype}`;
}

export function buildCampaignUrl(baseUrl: string, clientSlug: string, campaignSlug: string) {
  return `${baseUrl}/w/${encodeURIComponent(clientSlug)}/${encodeURIComponent(campaignSlug)}`;
}

export function buildCampaignMetaUrl(baseUrl: string, clientSlug: string, campaignSlug: string) {
  const path = `${encodeURIComponent(clientSlug)}/${encodeURIComponent(campaignSlug)}`;
  return `${baseUrl}/w/${path}?utm_source=facebook&utm_medium=cpc&utm_campaign={{campaign.name}}&utm_content={{ad.name}}&utm_term={{adset.name}}&campaign_id={{campaign.id}}&adset_id={{adset.id}}&ad_id={{ad.id}}&placement={{placement}}`;
}

export function buildCampaignGoogleUrl(baseUrl: string, clientSlug: string, campaignSlug: string) {
  const path = `${encodeURIComponent(clientSlug)}/${encodeURIComponent(campaignSlug)}`;
  return `${baseUrl}/w/${path}?utm_source=google&utm_medium=cpc&utm_campaign={campaignid}&utm_content={creative}&utm_term={keyword}&gclid={gclid}&device={device}&network={network}&matchtype={matchtype}`;
}
