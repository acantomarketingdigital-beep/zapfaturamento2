import {
  type KommoCustomFieldMap,
  type ResolvedClientConfig
} from "@/lib/clients";
import type { LeadCapturePayload } from "@/lib/utm";

type KommoLeadResult = {
  success: true;
  leadId: number;
  noteCreated: boolean;
};

type KommoLeadApiResponse = {
  _embedded?: {
    leads?: Array<{
      id: number;
    }>;
  };
};

function toOptionalNumber(value?: number | string | null) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }

  return undefined;
}

function resolveKommoBaseUrl(client: ResolvedClientConfig) {
  const subdomain = (client as { kommoSubdomain?: string }).kommoSubdomain?.trim();

  if (subdomain) {
    return `https://${subdomain}.kommo.com`;
  }

  const envBaseUrl = process.env.KOMMO_BASE_URL?.trim();
  if (envBaseUrl) {
    return envBaseUrl.replace(/\/+$/, "");
  }

  const envSubdomain = process.env.KOMMO_SUBDOMAIN?.trim();
  if (envSubdomain) {
    return `https://${envSubdomain}.kommo.com`;
  }

  throw new Error("Kommo: configure o Subdomínio no cadastro do cliente.");
}

function resolveKommoToken(client: ResolvedClientConfig) {
  const perClientToken = (client as { kommoAccessToken?: string }).kommoAccessToken?.trim();
  if (perClientToken) return perClientToken;

  const envToken = process.env.KOMMO_LONG_LIVED_TOKEN?.trim();
  if (envToken) return envToken;

  throw new Error("Kommo: configure o Token de Acesso no cadastro do cliente.");
}

async function kommoFetch<T>(path: string, init: RequestInit, client: ResolvedClientConfig) {
  const response = await fetch(`${resolveKommoBaseUrl(client)}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${resolveKommoToken(client)}`,
      "Content-Type": "application/json",
      Accept: "application/json",
      ...(init.headers || {})
    },
    signal: AbortSignal.timeout(10000),
    cache: "no-store"
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Kommo ${response.status}: ${errorText}`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

function addCustomFieldValue(
  target: Array<{ field_id: number; values: Array<{ value: string }> }>,
  fieldId: number | null | undefined,
  value: string
) {
  if (!fieldId || !value) {
    return;
  }

  target.push({
    field_id: fieldId,
    values: [{ value }]
  });
}

function buildCustomFields(
  payload: LeadCapturePayload,
  mapping: KommoCustomFieldMap
) {
  const fields: Array<{ field_id: number; values: Array<{ value: string }> }> = [];

  addCustomFieldValue(fields, mapping.clientName, payload.clientName);
  addCustomFieldValue(fields, mapping.whatsappNumber, payload.whatsappNumber);
  addCustomFieldValue(fields, mapping.sourcePlatform, payload.sourcePlatform);
  addCustomFieldValue(fields, mapping.utmSource, payload.utm_source);
  addCustomFieldValue(fields, mapping.utmMedium, payload.utm_medium);
  addCustomFieldValue(fields, mapping.utmCampaign, payload.utm_campaign);
  addCustomFieldValue(fields, mapping.utmContent, payload.utm_content);
  addCustomFieldValue(fields, mapping.utmTerm, payload.utm_term);
  addCustomFieldValue(fields, mapping.fbclid, payload.fbclid);
  addCustomFieldValue(fields, mapping.gclid, payload.gclid);
  addCustomFieldValue(fields, mapping.campaignId, payload.campaign_id);
  addCustomFieldValue(fields, mapping.adsetId, payload.adset_id);
  addCustomFieldValue(fields, mapping.adId, payload.ad_id);
  addCustomFieldValue(fields, mapping.placement, payload.placement);
  addCustomFieldValue(fields, mapping.device, payload.device);
  addCustomFieldValue(fields, mapping.keyword, payload.keyword);
  addCustomFieldValue(fields, mapping.matchtype, payload.matchtype);
  addCustomFieldValue(fields, mapping.network, payload.network);
  addCustomFieldValue(fields, mapping.pageUrl, payload.pageUrl);
  addCustomFieldValue(fields, mapping.referrer, payload.referrer);
  addCustomFieldValue(fields, mapping.userAgent, payload.userAgent);
  addCustomFieldValue(fields, mapping.timestamp, payload.timestamp);

  return fields;
}

function buildLeadNote(payload: LeadCapturePayload) {
  return [
    "Lead capturado pela página intermediária de redirecionamento para WhatsApp.",
    "",
    `Clínica: ${payload.clientName}`,
    `Origem estimada: ${payload.sourcePlatform}`,
    `WhatsApp: ${payload.whatsappNumber}`,
    `Página: ${payload.pageUrl}`,
    `Referrer: ${payload.referrer || "Direto"}`,
    "",
    "UTMs:",
    `utm_source: ${payload.utm_source || "-"}`,
    `utm_medium: ${payload.utm_medium || "-"}`,
    `utm_campaign: ${payload.utm_campaign || "-"}`,
    `utm_content: ${payload.utm_content || "-"}`,
    `utm_term: ${payload.utm_term || "-"}`,
    "",
    "IDs de clique:",
    `fbclid: ${payload.fbclid || "-"}`,
    `gclid: ${payload.gclid || "-"}`,
    "",
    "Campanha:",
    `campaign_id: ${payload.campaign_id || "-"}`,
    `adset_id: ${payload.adset_id || "-"}`,
    `ad_id: ${payload.ad_id || "-"}`,
    `placement: ${payload.placement || "-"}`,
    `device: ${payload.device || "-"}`,
    `keyword: ${payload.keyword || "-"}`,
    `matchtype: ${payload.matchtype || "-"}`,
    `network: ${payload.network || "-"}`,
    "",
    `Data/hora: ${payload.timestamp}`,
    `Idioma: ${payload.language || "-"}`,
    `User Agent: ${payload.userAgent || "-"}`
  ].join("\n");
}

export async function createKommoLead(
  payload: LeadCapturePayload,
  client: ResolvedClientConfig
): Promise<KommoLeadResult> {
  const pipelineId =
    toOptionalNumber(client.kommoPipelineId) ??
    toOptionalNumber(process.env.DEFAULT_KOMMO_PIPELINE_ID);
  const statusId =
    toOptionalNumber(client.kommoStatusId) ??
    toOptionalNumber(process.env.DEFAULT_KOMMO_STATUS_ID);
  const customFields = buildCustomFields(payload, client.kommoCustomFields);

  const leadBody: Record<string, unknown> = {
    name: `Lead WhatsApp - ${client.clientName}`
  };

  if (pipelineId) {
    leadBody.pipeline_id = pipelineId;
  }

  if (statusId) {
    leadBody.status_id = statusId;
  }

  if (customFields.length) {
    leadBody.custom_fields_values = customFields;
  }

  const leadResponse = await kommoFetch<KommoLeadApiResponse>("/api/v4/leads", {
    method: "POST",
    body: JSON.stringify([leadBody])
  }, client);

  const leadId = leadResponse?._embedded?.leads?.[0]?.id;

  if (!leadId) {
    throw new Error("A Kommo não retornou o ID do lead criado.");
  }

  let noteCreated = false;

  try {
    await kommoFetch("/api/v4/leads/notes", {
      method: "POST",
      body: JSON.stringify([
        {
          entity_id: leadId,
          note_type: "common",
          params: {
            text: buildLeadNote(payload)
          }
        }
      ])
    }, client);
    noteCreated = true;
  } catch {
    noteCreated = false;
  }

  return {
    success: true,
    leadId,
    noteCreated
  };
}
