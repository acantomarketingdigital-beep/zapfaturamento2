import {
  DEFAULT_KOMMO_CUSTOM_FIELDS,
  DEFAULT_REDIRECT_DELAY,
  getAllClientSlugs as getStaticClientSlugs,
  getClientConfig as getStaticClientConfig,
  type ClientConfig,
  type KommoCustomFieldMap,
  type ResolvedClientConfig
} from "@/lib/clients";
import {
  MANAGED_KOMMO_FIELDS,
  buildClinicUrl,
  buildGoogleExampleUrl,
  buildMetaExampleUrl,
  getKommoCustomFieldDefinitions,
  slugifyClinicName
} from "@/lib/clinic-shared";
import { hasDatabaseConfig, queryDb } from "@/lib/db";
import { normalizeLogoUrl } from "@/lib/logo";

export type ManagedClinicRecord = ResolvedClientConfig & {
  id: string;
  createdAt?: string;
  updatedAt?: string;
  isActive: boolean;
  source: "database" | "static";
  workspaceSlug?: string | null;
};

export type ManagedClinicServerRecord = ManagedClinicRecord & {
  metaCapiAccessToken?: string;
  kommoAccessToken?: string;
};

export type ManagedClinicListItem = ManagedClinicRecord & {
  totalLeads: number;
  leadsToday: number;
  lastLeadAt: string | null;
};

export type ManagedClinicInput = {
  existingSlug?: string;
  clientSlug: string;
  clientName: string;
  logoUrl?: string;
  whatsappNumber: string;
  whatsappMessage: string;
  redirectDelay: number;
  metaPixelId?: string;
  metaTestEventCode?: string;
  metaCapiAccessToken?: string;
  preserveMetaCapiAccessToken?: boolean;
  gtmId?: string;
  ga4Id?: string;
  googleAdsId?: string;
  googleAdsConversionLabel?: string;
  kommoEnabled: boolean;
  kommoPipelineId?: number;
  kommoStatusId?: number;
  kommoCustomFields: KommoCustomFieldMap;
  kommoSubdomain?: string;
  kommoAccessToken?: string;
  preserveKommoAccessToken?: boolean;
  isActive: boolean;
  messengerUrl?: string;
};

export type ManagedClinicFormValues = ManagedClinicInput & {
  source: "database" | "static";
  metaCapiConfigured: boolean;
  metaCapiAccessTokenConfigured: boolean;
  kommoAccessTokenConfigured: boolean;
};

type DatabaseClinicRow = {
  id: string;
  created_at: string;
  updated_at: string;
  client_slug: string;
  client_name: string;
  logo_url: string | null;
  whatsapp_number: string;
  whatsapp_message: string;
  redirect_delay: number;
  meta_pixel_id: string | null;
  meta_capi_access_token: string | null;
  meta_test_event_code: string | null;
  gtm_id: string | null;
  ga4_id: string | null;
  google_ads_id: string | null;
  google_ads_conversion_label: string | null;
  kommo_enabled: boolean | null;
  kommo_pipeline_id: string | number | null;
  kommo_status_id: string | number | null;
  kommo_custom_fields: KommoCustomFieldMap | string | null;
  kommo_subdomain: string | null;
  kommo_access_token: string | null;
  is_active: boolean;
  workspace_slug: string | null;
  messenger_url: string | null;
};

type ClinicMetricsRow = {
  client_slug: string;
  total_leads: string;
  leads_today: string;
  last_lead_at: string | null;
};

function cleanText(value?: string | null) {
  const normalized = value?.trim() || "";
  return normalized || undefined;
}

function cleanLogoUrl(value?: string | null) {
  const normalized = normalizeLogoUrl(value);
  return normalized || undefined;
}

function normalizeSlug(value: string) {
  return slugifyClinicName(value);
}

function toOptionalNumber(value?: string | number | null) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }

  return undefined;
}

function normalizeDelay(value?: number | null) {
  if (!value || !Number.isFinite(value)) {
    return DEFAULT_REDIRECT_DELAY;
  }

  return Math.max(3000, Math.min(5000, value));
}

function normalizeCustomFieldMap(
  input?: KommoCustomFieldMap | string | null
) {
  let parsed: KommoCustomFieldMap = {};

  if (typeof input === "string" && input.trim()) {
    try {
      parsed = JSON.parse(input) as KommoCustomFieldMap;
    } catch {
      parsed = {};
    }
  } else if (input && typeof input === "object") {
    parsed = input;
  }

  const normalized: KommoCustomFieldMap = {
    ...DEFAULT_KOMMO_CUSTOM_FIELDS
  };

  for (const key of Object.keys(DEFAULT_KOMMO_CUSTOM_FIELDS) as Array<
    keyof KommoCustomFieldMap
  >) {
    normalized[key] = toOptionalNumber(parsed[key]) ?? null;
  }

  return normalized;
}

function resolveClientConfig(
  client: ClientConfig,
  source: "database" | "static",
  metadata?: Pick<
    ManagedClinicRecord,
    "id" | "createdAt" | "updatedAt" | "isActive"
  >,
  meta?: {
    metaCapiConfigured?: boolean;
  }
): ManagedClinicRecord {
  return {
    ...client,
    clientSlug: client.clientSlug,
    clientName: client.clientName,
    logoUrl: cleanLogoUrl(client.logoUrl),
    whatsappNumber: client.whatsappNumber,
    whatsappMessage: client.whatsappMessage,
    redirectDelay: normalizeDelay(client.redirectDelay),
    metaPixelId: cleanText(client.metaPixelId),
    metaTestEventCode: cleanText(client.metaTestEventCode),
    gtmId: cleanText(client.gtmId),
    ga4Id: cleanText(client.ga4Id),
    googleAdsId: cleanText(client.googleAdsId),
    googleAdsConversionLabel: cleanText(client.googleAdsConversionLabel),
    kommoEnabled: client.kommoEnabled ?? true,
    metaCapiConfigured: Boolean(meta?.metaCapiConfigured),
    kommoPipelineId: toOptionalNumber(client.kommoPipelineId),
    kommoStatusId: toOptionalNumber(client.kommoStatusId),
    kommoCustomFields: normalizeCustomFieldMap(client.kommoCustomFields),
    kommoSubdomain: cleanText(client.kommoSubdomain),
    messengerUrl: cleanText(client.messengerUrl),
    id: metadata?.id || client.clientSlug,
    createdAt: metadata?.createdAt,
    updatedAt: metadata?.updatedAt,
    isActive: metadata?.isActive ?? true,
    source
  };
}

function mapDatabaseRow(
  row: DatabaseClinicRow,
  options?: { includeSecrets?: boolean }
): ManagedClinicRecord | ManagedClinicServerRecord {
  const resolved = resolveClientConfig(
    {
      clientSlug: row.client_slug,
      clientName: row.client_name,
      logoUrl: row.logo_url || undefined,
      whatsappNumber: row.whatsapp_number,
      whatsappMessage: row.whatsapp_message,
      redirectDelay: row.redirect_delay,
      metaPixelId: row.meta_pixel_id || undefined,
      metaTestEventCode: row.meta_test_event_code || undefined,
      gtmId: row.gtm_id || undefined,
      ga4Id: row.ga4_id || undefined,
      googleAdsId: row.google_ads_id || undefined,
      googleAdsConversionLabel: row.google_ads_conversion_label || undefined,
      kommoEnabled: row.kommo_enabled ?? true,
      kommoPipelineId: toOptionalNumber(row.kommo_pipeline_id),
      kommoStatusId: toOptionalNumber(row.kommo_status_id),
      kommoCustomFields: normalizeCustomFieldMap(row.kommo_custom_fields),
      kommoSubdomain: row.kommo_subdomain || undefined,
      messengerUrl: row.messenger_url || undefined
    },
    "database",
    {
      id: row.id,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      isActive: row.is_active
    },
    {
      metaCapiConfigured: Boolean(
        cleanText(row.meta_pixel_id) && cleanText(row.meta_capi_access_token)
      )
    }
  );

  const withWorkspace = { ...resolved, workspaceSlug: row.workspace_slug ?? null };

  if (options?.includeSecrets) {
    return {
      ...withWorkspace,
      metaCapiAccessToken: cleanText(row.meta_capi_access_token),
      kommoAccessToken: cleanText(row.kommo_access_token)
    };
  }

  return withWorkspace;
}

async function fetchDatabaseClinicBySlug(
  slug: string,
  options?: { includeSecrets?: boolean }
) {
  if (!hasDatabaseConfig()) {
    return null;
  }

  const result = await queryDb<DatabaseClinicRow>(
    `
      SELECT
        id,
        created_at,
        updated_at,
        client_slug,
        client_name,
        logo_url,
        whatsapp_number,
        whatsapp_message,
        redirect_delay,
        meta_pixel_id,
        meta_capi_access_token,
        meta_test_event_code,
        gtm_id,
        ga4_id,
        google_ads_id,
        google_ads_conversion_label,
        kommo_enabled,
        kommo_pipeline_id,
        kommo_status_id,
        kommo_custom_fields,
        kommo_subdomain,
        kommo_access_token,
        is_active,
        workspace_slug,
        messenger_url
      FROM clients
      WHERE client_slug = $1
      LIMIT 1
    `,
    [slug]
  );

  return result.rows[0] ? mapDatabaseRow(result.rows[0], options) : null;
}

async function fetchDatabaseClinicByIdOrSlug(value: string) {
  if (!hasDatabaseConfig()) {
    return null;
  }

  const result = await queryDb<DatabaseClinicRow>(
    `
      SELECT
        id,
        created_at,
        updated_at,
        client_slug,
        client_name,
        logo_url,
        whatsapp_number,
        whatsapp_message,
        redirect_delay,
        meta_pixel_id,
        meta_capi_access_token,
        meta_test_event_code,
        gtm_id,
        ga4_id,
        google_ads_id,
        google_ads_conversion_label,
        kommo_enabled,
        kommo_pipeline_id,
        kommo_status_id,
        kommo_custom_fields,
        is_active,
        workspace_slug,
        messenger_url
      FROM clients
      WHERE id::text = $1 OR client_slug = $1
      ORDER BY CASE WHEN client_slug = $1 THEN 0 ELSE 1 END
      LIMIT 1
    `,
    [value]
  );

  return result.rows[0] ? mapDatabaseRow(result.rows[0]) : null;
}

function getStaticClinicRecord(slug: string) {
  const clinic = getStaticClientConfig(slug);

  if (!clinic) {
    return null;
  }

  return {
    ...clinic,
    id: clinic.clientSlug,
    isActive: true,
    source: "static" as const,
    workspaceSlug: null as string | null
  };
}

async function getClinicMetricsMap() {
  const metrics = new Map<
    string,
    { totalLeads: number; leadsToday: number; lastLeadAt: string | null }
  >();

  if (!hasDatabaseConfig()) {
    return metrics;
  }

  try {
    const result = await queryDb<ClinicMetricsRow>(
      `
        SELECT
          client_slug,
          COUNT(*)::int AS total_leads,
          COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE)::int AS leads_today,
          MAX(created_at)::text AS last_lead_at
        FROM whatsapp_leads
        GROUP BY client_slug
      `
    );

    for (const row of result.rows) {
      metrics.set(row.client_slug, {
        totalLeads: Number(row.total_leads || 0),
        leadsToday: Number(row.leads_today || 0),
        lastLeadAt: row.last_lead_at || null
      });
    }
  } catch {
    return metrics;
  }

  return metrics;
}

export async function getClinicBySlug(slug: string) {
  const normalizedSlug = normalizeSlug(slug);

  try {
    const databaseClinic = await fetchDatabaseClinicBySlug(normalizedSlug);

    if (databaseClinic) {
      return databaseClinic as ManagedClinicRecord;
    }
  } catch {
    return getStaticClinicRecord(normalizedSlug);
  }

  return getStaticClinicRecord(normalizedSlug);
}

export async function getClinicBackendConfigBySlug(slug: string) {
  const normalizedSlug = normalizeSlug(slug);

  try {
    const databaseClinic = await fetchDatabaseClinicBySlug(normalizedSlug, {
      includeSecrets: true
    });

    if (databaseClinic) {
      return databaseClinic as ManagedClinicServerRecord;
    }
  } catch {
    return getStaticClinicRecord(normalizedSlug);
  }

  return getStaticClinicRecord(normalizedSlug);
}

export async function getClinicByIdOrSlug(value: string) {
  try {
    const databaseClinic = await fetchDatabaseClinicByIdOrSlug(value);

    if (databaseClinic) {
      return databaseClinic;
    }
  } catch {
    return getStaticClinicRecord(normalizeSlug(value));
  }

  return getStaticClinicRecord(normalizeSlug(value));
}

export async function listManagedClinics(query = "", scopeClientSlug?: string | null) {
  const merged = new Map<string, ManagedClinicRecord>();
  const metrics = await getClinicMetricsMap();

  for (const slug of getStaticClientSlugs()) {
    const clinic = getStaticClinicRecord(slug);

    if (clinic) {
      merged.set(slug, clinic);
    }
  }

  if (hasDatabaseConfig()) {
    try {
      const result = await queryDb<DatabaseClinicRow>(
        `
          SELECT
            id,
            created_at,
            updated_at,
            client_slug,
            client_name,
            logo_url,
            whatsapp_number,
            whatsapp_message,
            redirect_delay,
            meta_pixel_id,
            meta_capi_access_token,
            meta_test_event_code,
            gtm_id,
            ga4_id,
            google_ads_id,
            google_ads_conversion_label,
            kommo_enabled,
            kommo_pipeline_id,
            kommo_status_id,
            kommo_custom_fields,
            is_active,
            workspace_slug,
            messenger_url
          FROM clients
          WHERE workspace_slug IS NOT DISTINCT FROM $1
             OR ($1 IS NOT NULL AND $1 = ANY(COALESCE(shared_with_workspaces, '{}'::text[])))
          ORDER BY client_name ASC, client_slug ASC
        `,
        [scopeClientSlug ?? null]
      );

      for (const row of result.rows) {
        const clinic = mapDatabaseRow(row) as ManagedClinicRecord;
        merged.set(clinic.clientSlug, clinic);
      }
    } catch {
      // Mantem fallback silencioso para nao derrubar o painel.
    }
  }

  const normalizedQuery = query.trim().toLowerCase();

  return Array.from(merged.values())
    .map<ManagedClinicListItem>((clinic) => {
      const metric = metrics.get(clinic.clientSlug);

      return {
        ...clinic,
        totalLeads: metric?.totalLeads ?? 0,
        leadsToday: metric?.leadsToday ?? 0,
        lastLeadAt: metric?.lastLeadAt ?? null
      };
    })
    .filter((clinic) => {
      if (!normalizedQuery) {
        return true;
      }

      const haystack = [
        clinic.clientName,
        clinic.clientSlug,
        clinic.whatsappNumber
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(normalizedQuery);
    })
    .sort((left, right) => left.clientName.localeCompare(right.clientName));
}

export async function saveClinic(input: ManagedClinicInput, workspaceSlug?: string | null) {
  if (!hasDatabaseConfig()) {
    throw new Error("DATABASE_URL nao configurada.");
  }

  const clientSlug = normalizeSlug(input.clientSlug);
  const existingSlug = normalizeSlug(input.existingSlug || clientSlug);

  if (!clientSlug) {
    throw new Error("Informe um slug valido.");
  }

  const conflictingClinic = await queryDb<{ id: string; client_slug: string }>(
    `
      SELECT id, client_slug
      FROM clients
      WHERE client_slug = $1
      LIMIT 1
    `,
    [clientSlug]
  );

  if (
    conflictingClinic.rows[0] &&
    conflictingClinic.rows[0].client_slug !== existingSlug
  ) {
    throw new Error("Ja existe outro cliente usando este slug.");
  }

  let metaCapiAccessToken = cleanText(input.metaCapiAccessToken) || null;

  if (!metaCapiAccessToken && input.preserveMetaCapiAccessToken) {
    const existingTokenResult = await queryDb<{ meta_capi_access_token: string | null }>(
      `SELECT meta_capi_access_token FROM clients WHERE client_slug = $1 LIMIT 1`,
      [existingSlug]
    );
    metaCapiAccessToken =
      cleanText(existingTokenResult.rows[0]?.meta_capi_access_token) || null;
  }

  let kommoAccessToken = cleanText(input.kommoAccessToken) || null;

  if (!kommoAccessToken && input.preserveKommoAccessToken) {
    const existingKommoResult = await queryDb<{ kommo_access_token: string | null }>(
      `SELECT kommo_access_token FROM clients WHERE client_slug = $1 LIMIT 1`,
      [existingSlug]
    );
    kommoAccessToken =
      cleanText(existingKommoResult.rows[0]?.kommo_access_token) || null;
  }

  const result = await queryDb<DatabaseClinicRow>(
    `
      INSERT INTO clients (
        client_slug,
        client_name,
        logo_url,
        whatsapp_number,
        whatsapp_message,
        redirect_delay,
        meta_pixel_id,
        meta_capi_access_token,
        meta_test_event_code,
        gtm_id,
        ga4_id,
        google_ads_id,
        google_ads_conversion_label,
        kommo_enabled,
        kommo_pipeline_id,
        kommo_status_id,
        kommo_custom_fields,
        kommo_subdomain,
        kommo_access_token,
        is_active,
        workspace_slug,
        messenger_url
      )
      VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17::jsonb, $18, $19, $20, $21, $22
      )
      ON CONFLICT (client_slug)
      DO UPDATE SET
        client_name = EXCLUDED.client_name,
        logo_url = EXCLUDED.logo_url,
        whatsapp_number = EXCLUDED.whatsapp_number,
        whatsapp_message = EXCLUDED.whatsapp_message,
        redirect_delay = EXCLUDED.redirect_delay,
        meta_pixel_id = EXCLUDED.meta_pixel_id,
        meta_capi_access_token = EXCLUDED.meta_capi_access_token,
        meta_test_event_code = EXCLUDED.meta_test_event_code,
        gtm_id = EXCLUDED.gtm_id,
        ga4_id = EXCLUDED.ga4_id,
        google_ads_id = EXCLUDED.google_ads_id,
        google_ads_conversion_label = EXCLUDED.google_ads_conversion_label,
        kommo_enabled = EXCLUDED.kommo_enabled,
        kommo_pipeline_id = EXCLUDED.kommo_pipeline_id,
        kommo_status_id = EXCLUDED.kommo_status_id,
        kommo_custom_fields = EXCLUDED.kommo_custom_fields,
        kommo_subdomain = EXCLUDED.kommo_subdomain,
        kommo_access_token = EXCLUDED.kommo_access_token,
        is_active = EXCLUDED.is_active,
        workspace_slug = COALESCE(clients.workspace_slug, EXCLUDED.workspace_slug),
        messenger_url = EXCLUDED.messenger_url
      RETURNING
        id,
        created_at,
        updated_at,
        client_slug,
        client_name,
        logo_url,
        whatsapp_number,
        whatsapp_message,
        redirect_delay,
        meta_pixel_id,
        meta_capi_access_token,
        meta_test_event_code,
        gtm_id,
        ga4_id,
        google_ads_id,
        google_ads_conversion_label,
        kommo_enabled,
        kommo_pipeline_id,
        kommo_status_id,
        kommo_custom_fields,
        kommo_subdomain,
        kommo_access_token,
        is_active,
        messenger_url
    `,
    [
      clientSlug,
      input.clientName.trim(),
      cleanLogoUrl(input.logoUrl) || null,
      input.whatsappNumber.trim(),
      input.whatsappMessage.trim(),
      normalizeDelay(input.redirectDelay),
      cleanText(input.metaPixelId) || null,
      metaCapiAccessToken,
      cleanText(input.metaTestEventCode) || null,
      cleanText(input.gtmId) || null,
      cleanText(input.ga4Id) || null,
      cleanText(input.googleAdsId) || null,
      cleanText(input.googleAdsConversionLabel) || null,
      input.kommoEnabled,
      input.kommoEnabled ? toOptionalNumber(input.kommoPipelineId) ?? null : null,
      input.kommoEnabled ? toOptionalNumber(input.kommoStatusId) ?? null : null,
      JSON.stringify(
        input.kommoEnabled
          ? normalizeCustomFieldMap(input.kommoCustomFields)
          : DEFAULT_KOMMO_CUSTOM_FIELDS
      ),
      input.kommoEnabled ? cleanText(input.kommoSubdomain) || null : null,
      input.kommoEnabled ? kommoAccessToken : null,
      input.isActive,
      workspaceSlug ?? null,
      cleanText(input.messengerUrl) || null
    ]
  );

  if (existingSlug !== clientSlug) {
    await queryDb(
      `DELETE FROM clients WHERE client_slug = $1 AND client_slug <> $2`,
      [existingSlug, clientSlug]
    );
  }

  return mapDatabaseRow(result.rows[0]) as ManagedClinicRecord;
}

export async function deleteManagedClinic(slug: string) {
  if (!hasDatabaseConfig()) {
    throw new Error("DATABASE_URL nao configurada.");
  }

  await queryDb(`DELETE FROM clients WHERE client_slug = $1`, [normalizeSlug(slug)]);
}

export async function setClinicActiveStatus(slug: string, isActive: boolean) {
  const clinic = await getClinicBySlug(slug);

  if (!clinic) {
    throw new Error("Cliente nao encontrado.");
  }

  return saveClinic({
    existingSlug: clinic.clientSlug,
    clientSlug: clinic.clientSlug,
    clientName: clinic.clientName,
    logoUrl: clinic.logoUrl,
    whatsappNumber: clinic.whatsappNumber,
    whatsappMessage: clinic.whatsappMessage,
    redirectDelay: clinic.redirectDelay,
    metaPixelId: clinic.metaPixelId,
    metaTestEventCode: clinic.metaTestEventCode,
    preserveMetaCapiAccessToken: clinic.metaCapiConfigured,
    gtmId: clinic.gtmId,
    ga4Id: clinic.ga4Id,
    googleAdsId: clinic.googleAdsId,
    googleAdsConversionLabel: clinic.googleAdsConversionLabel,
    kommoEnabled: clinic.kommoEnabled,
    kommoPipelineId: clinic.kommoPipelineId,
    kommoStatusId: clinic.kommoStatusId,
    kommoCustomFields: clinic.kommoCustomFields,
    isActive,
    messengerUrl: clinic.messengerUrl
  });
}

export function toClinicFormValues(
  clinic?: ManagedClinicRecord | null
): ManagedClinicFormValues {
  return {
    existingSlug: clinic?.clientSlug || "",
    clientSlug: clinic?.clientSlug || "",
    clientName: clinic?.clientName || "",
    logoUrl: clinic?.logoUrl || "",
    whatsappNumber: clinic?.whatsappNumber || "",
    whatsappMessage: clinic?.whatsappMessage || "",
    redirectDelay: clinic?.redirectDelay ?? DEFAULT_REDIRECT_DELAY,
    metaPixelId: clinic?.metaPixelId || "",
    metaTestEventCode: clinic?.metaTestEventCode || "",
    metaCapiAccessToken: "",
    preserveMetaCapiAccessToken: false,
    gtmId: clinic?.gtmId || "",
    ga4Id: clinic?.ga4Id || "",
    googleAdsId: clinic?.googleAdsId || "",
    googleAdsConversionLabel: clinic?.googleAdsConversionLabel || "",
    kommoEnabled: clinic?.kommoEnabled ?? true,
    kommoPipelineId: clinic?.kommoPipelineId,
    kommoStatusId: clinic?.kommoStatusId,
    kommoCustomFields: normalizeCustomFieldMap(clinic?.kommoCustomFields),
    kommoSubdomain: clinic?.kommoSubdomain || "",
    kommoAccessToken: "",
    preserveKommoAccessToken: false,
    isActive: clinic?.isActive ?? true,
    messengerUrl: clinic?.messengerUrl || "",
    source: clinic?.source || "database",
    metaCapiConfigured: clinic?.metaCapiConfigured ?? false,
    metaCapiAccessTokenConfigured: clinic?.metaCapiConfigured ?? false,
    kommoAccessTokenConfigured: Boolean((clinic as ManagedClinicServerRecord)?.kommoAccessToken)
  };
}

export function parseClinicFormData(formData: FormData): ManagedClinicInput {
  const getValue = (name: string) => String(formData.get(name) || "");
  const getNumber = (name: string) => toOptionalNumber(getValue(name));
  const kommoEnabled = getValue("kommoEnabled") === "true";
  const clientName = getValue("clientName").trim();
  const clientSlug = normalizeSlug(getValue("clientSlug") || clientName);

  if (!clientName) {
    throw new Error("Informe o nome do cliente.");
  }

  if (!clientSlug) {
    throw new Error("Informe um slug valido para o cliente.");
  }

  const whatsappNumber = getValue("whatsappNumber").trim();

  if (!whatsappNumber) {
    throw new Error("Informe o numero do WhatsApp.");
  }

  const whatsappMessage = getValue("whatsappMessage").trim();

  const kommoCustomFields: KommoCustomFieldMap = {
    ...DEFAULT_KOMMO_CUSTOM_FIELDS
  };

  for (const field of MANAGED_KOMMO_FIELDS) {
    kommoCustomFields[field.key] =
      getNumber(`kommoCustomFields.${field.key}`) ?? null;
  }

  return {
    existingSlug: normalizeSlug(getValue("existingSlug") || clientSlug),
    clientSlug,
    clientName,
    logoUrl: cleanLogoUrl(getValue("logoUrl")),
    whatsappNumber,
    whatsappMessage,
    redirectDelay: getNumber("redirectDelay") ?? DEFAULT_REDIRECT_DELAY,
    metaPixelId: cleanText(getValue("metaPixelId")),
    metaTestEventCode: cleanText(getValue("metaTestEventCode")),
    metaCapiAccessToken: cleanText(getValue("metaCapiAccessToken")),
    preserveMetaCapiAccessToken:
      getValue("preserveMetaCapiAccessToken") === "true" &&
      !cleanText(getValue("metaCapiAccessToken")),
    gtmId: cleanText(getValue("gtmId")),
    ga4Id: cleanText(getValue("ga4Id")),
    googleAdsId: cleanText(getValue("googleAdsId")),
    googleAdsConversionLabel: cleanText(getValue("googleAdsConversionLabel")),
    kommoEnabled,
    kommoPipelineId: kommoEnabled ? getNumber("kommoPipelineId") : undefined,
    kommoStatusId: kommoEnabled ? getNumber("kommoStatusId") : undefined,
    kommoCustomFields,
    kommoSubdomain: kommoEnabled ? cleanText(getValue("kommoSubdomain")) : undefined,
    kommoAccessToken: kommoEnabled ? cleanText(getValue("kommoAccessToken")) : undefined,
    preserveKommoAccessToken:
      getValue("preserveKommoAccessToken") === "true" &&
      !cleanText(getValue("kommoAccessToken")),
    isActive: formData.get("isActive") === "on",
    messengerUrl: (() => {
      const page = cleanText(getValue("messengerUrl"))?.replace(/^https?:\/\/m\.me\//, "");
      return page ? `https://m.me/${page}` : undefined;
    })()
  };
}

export {
  buildClinicUrl,
  buildGoogleExampleUrl,
  buildMetaExampleUrl,
  getKommoCustomFieldDefinitions,
  slugifyClinicName
};
