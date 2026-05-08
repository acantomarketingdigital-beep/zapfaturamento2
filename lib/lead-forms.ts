import { hasDatabaseConfig, queryDb } from "@/lib/db";
import { recordBillableLead } from "@/lib/billing-usage";

export const MAX_FORMS_PER_CLIENT = 3;

// ── Types ────────────────────────────────────────────────────────────────────

export type LeadForm = {
  id: string;
  clientSlug: string;
  name: string;
  slug: string;
  title: string;
  subtitle: string;
  buttonText: string;
  logoUrl: string | null;
  imageUrl: string | null;
  primaryColor: string;
  backgroundColor: string;
  status: "active" | "inactive";
  successMessage: string;
  showEmail: boolean;
  showProcedure: boolean;
  showCity: boolean;
  showObservation: boolean;
  createdAt: string;
  updatedAt: string;
};

type LeadFormRow = {
  id: string;
  client_slug: string;
  name: string;
  slug: string;
  title: string;
  subtitle: string;
  button_text: string;
  logo_url: string | null;
  image_url: string | null;
  primary_color: string;
  background_color: string;
  status: string;
  success_message: string;
  show_email: boolean;
  show_procedure: boolean;
  show_city: boolean;
  show_observation: boolean;
  created_at: string;
  updated_at: string;
};

export type SaveLeadFormInput = {
  clientSlug: string;
  name: string;
  slug: string;
  title: string;
  subtitle: string;
  buttonText: string;
  logoUrl: string | null;
  imageUrl: string | null;
  primaryColor: string;
  backgroundColor: string;
  status: "active" | "inactive";
  successMessage: string;
  showEmail: boolean;
  showProcedure: boolean;
  showCity: boolean;
  showObservation: boolean;
};

export type CreateSubmissionInput = {
  formId: string;
  clientSlug: string;
  leadName: string;
  leadPhone: string;
  leadEmail?: string;
  leadProcedure?: string;
  leadCity?: string;
  leadObservation?: string;
  whatsappLeadId?: number | null;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmContent?: string;
  utmTerm?: string;
  fbclid?: string;
  gclid?: string;
  fbp?: string;
  fbc?: string;
  ipAddress?: string;
  userAgent?: string;
  pageUrl?: string;
};

// ── Mappers ──────────────────────────────────────────────────────────────────

function mapRow(row: LeadFormRow): LeadForm {
  return {
    id: row.id,
    clientSlug: row.client_slug,
    name: row.name,
    slug: row.slug,
    title: row.title,
    subtitle: row.subtitle,
    buttonText: row.button_text,
    logoUrl: row.logo_url,
    imageUrl: row.image_url,
    primaryColor: row.primary_color,
    backgroundColor: row.background_color,
    status: row.status === "active" ? "active" : "inactive",
    successMessage: row.success_message,
    showEmail: Boolean(row.show_email),
    showProcedure: Boolean(row.show_procedure),
    showCity: Boolean(row.show_city),
    showObservation: Boolean(row.show_observation),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// ── Queries ──────────────────────────────────────────────────────────────────

export async function listLeadForms(clientSlug: string): Promise<LeadForm[]> {
  if (!hasDatabaseConfig()) return [];
  const result = await queryDb<LeadFormRow>(
    `SELECT * FROM lead_forms WHERE client_slug = $1 ORDER BY created_at DESC`,
    [clientSlug]
  );
  return result.rows.map(mapRow);
}

export async function getLeadFormBySlug(
  clientSlug: string,
  slug: string
): Promise<LeadForm | null> {
  if (!hasDatabaseConfig()) return null;
  const result = await queryDb<LeadFormRow>(
    `SELECT * FROM lead_forms WHERE client_slug = $1 AND slug = $2 AND status = 'active' LIMIT 1`,
    [clientSlug, slug]
  );
  return result.rows[0] ? mapRow(result.rows[0]) : null;
}

export async function getLeadFormById(id: string): Promise<LeadForm | null> {
  if (!hasDatabaseConfig()) return null;
  const result = await queryDb<LeadFormRow>(
    `SELECT * FROM lead_forms WHERE id = $1 LIMIT 1`,
    [id]
  );
  return result.rows[0] ? mapRow(result.rows[0]) : null;
}

export async function countLeadForms(clientSlug: string): Promise<number> {
  if (!hasDatabaseConfig()) return 0;
  const result = await queryDb<{ count: string }>(
    `SELECT COUNT(*)::text AS count FROM lead_forms WHERE client_slug = $1`,
    [clientSlug]
  );
  return parseInt(result.rows[0]?.count ?? "0", 10);
}

export async function saveLeadForm(
  input: SaveLeadFormInput,
  id?: string
): Promise<LeadForm> {
  const fields = [
    input.name,             // $1
    input.slug,             // $2
    input.title,            // $3
    input.subtitle,         // $4
    input.buttonText,       // $5
    input.logoUrl,          // $6
    input.imageUrl,         // $7
    input.primaryColor,     // $8
    input.backgroundColor,  // $9
    input.status,           // $10
    input.successMessage,   // $11
    input.showEmail,        // $12
    input.showProcedure,    // $13
    input.showCity,         // $14
    input.showObservation,  // $15
  ];

  let result: { rows: LeadFormRow[] };

  if (id) {
    result = await queryDb<LeadFormRow>(
      `UPDATE lead_forms
       SET name=$1, slug=$2, title=$3, subtitle=$4, button_text=$5,
           logo_url=$6, image_url=$7, primary_color=$8, background_color=$9,
           status=$10, success_message=$11,
           show_email=$12, show_procedure=$13, show_city=$14, show_observation=$15,
           updated_at=NOW()
       WHERE id=$16 AND client_slug=$17
       RETURNING *`,
      [...fields, id, input.clientSlug]
    );
  } else {
    const count = await countLeadForms(input.clientSlug);
    if (count >= MAX_FORMS_PER_CLIENT) {
      throw new Error(`Limite de ${MAX_FORMS_PER_CLIENT} formularios atingido.`);
    }
    result = await queryDb<LeadFormRow>(
      `INSERT INTO lead_forms (
         client_slug, name, slug, title, subtitle, button_text,
         logo_url, image_url, primary_color, background_color,
         status, success_message, show_email, show_procedure, show_city, show_observation
       ) VALUES ($16, $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
       RETURNING *`,
      [...fields, input.clientSlug]
    );
  }

  if (!result.rows[0]) throw new Error("Formulario nao encontrado ou sem permissao.");
  return mapRow(result.rows[0]);
}

export async function toggleLeadFormStatus(
  id: string,
  clientSlug: string
): Promise<LeadForm | null> {
  if (!hasDatabaseConfig()) return null;
  const result = await queryDb<LeadFormRow>(
    `UPDATE lead_forms
     SET status = CASE WHEN status = 'active' THEN 'inactive' ELSE 'active' END,
         updated_at = NOW()
     WHERE id = $1 AND client_slug = $2
     RETURNING *`,
    [id, clientSlug]
  );
  return result.rows[0] ? mapRow(result.rows[0]) : null;
}

export async function deleteLeadForm(
  id: string,
  clientSlug: string
): Promise<boolean> {
  if (!hasDatabaseConfig()) return false;
  const result = await queryDb<{ id: string }>(
    `DELETE FROM lead_forms WHERE id = $1 AND client_slug = $2 RETURNING id`,
    [id, clientSlug]
  );
  return result.rows.length > 0;
}

// ── Submission ───────────────────────────────────────────────────────────────

export async function createFormSubmission(
  input: CreateSubmissionInput
): Promise<string> {
  const result = await queryDb<{ id: string }>(
    `INSERT INTO lead_form_submissions (
       form_id, client_slug, lead_name, lead_phone, lead_email,
       lead_procedure, lead_city, lead_observation, whatsapp_lead_id,
       utm_source, utm_medium, utm_campaign, utm_content, utm_term,
       fbclid, gclid, fbp, fbc, ip_address, user_agent, page_url
     ) VALUES (
       $1, $2, $3, $4, $5, $6, $7, $8, $9,
       $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21
     ) RETURNING id`,
    [
      input.formId,
      input.clientSlug,
      input.leadName,
      input.leadPhone,
      input.leadEmail ?? null,
      input.leadProcedure ?? null,
      input.leadCity ?? null,
      input.leadObservation ?? null,
      input.whatsappLeadId ?? null,
      input.utmSource ?? null,
      input.utmMedium ?? null,
      input.utmCampaign ?? null,
      input.utmContent ?? null,
      input.utmTerm ?? null,
      input.fbclid ?? null,
      input.gclid ?? null,
      input.fbp ?? null,
      input.fbc ?? null,
      input.ipAddress ?? null,
      input.userAgent ?? null,
      input.pageUrl ?? null,
    ]
  );
  return result.rows[0]?.id ?? "";
}

export async function insertFormLeadToWhatsappLeads(params: {
  clientSlug: string;
  clientName: string;
  clientWhatsappNumber: string;
  leadName: string;
  leadPhone: string;
  leadEmail?: string;
  pageUrl: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmContent?: string;
  utmTerm?: string;
  fbclid?: string;
  gclid?: string;
  userAgent?: string;
}): Promise<number | null> {
  if (!hasDatabaseConfig()) return null;

  let pagePath = "/";
  try {
    pagePath = new URL(params.pageUrl).pathname;
  } catch {
    pagePath = params.pageUrl;
  }

  const result = await queryDb<{ id: number }>(
    `INSERT INTO whatsapp_leads (
       client_slug, client_name, whatsapp_number, source_platform,
       lead_name, lead_phone, lead_email,
       utm_source, utm_medium, utm_campaign, utm_content, utm_term,
       fbclid, gclid,
       page_url, page_path, redirect_url,
       referrer, user_agent,
       kommo_enabled, kommo_success, kommo_status, kommo_lead_id, kommo_error,
       meta_capi_success, meta_capi_event_id, meta_capi_error,
       is_test, duplicate
     ) VALUES (
       $1, $2, $3, 'form',
       $4, $5, $6,
       $7, $8, $9, $10, $11,
       $12, $13,
       $14, $15, '',
       null, $16,
       false, null, 'disabled', null, null,
       null, null, null,
       false, false
     ) RETURNING id`,
    [
      params.clientSlug,
      params.clientName,
      params.clientWhatsappNumber || "",
      params.leadName,
      params.leadPhone,
      params.leadEmail ?? null,
      params.utmSource ?? null,
      params.utmMedium ?? null,
      params.utmCampaign ?? null,
      params.utmContent ?? null,
      params.utmTerm ?? null,
      params.fbclid ?? null,
      params.gclid ?? null,
      params.pageUrl,
      pagePath,
      params.userAgent ?? null,
    ]
  );
  const leadId = result.rows[0]?.id ?? null;
  if (leadId) {
    recordBillableLead({ clientSlug: params.clientSlug, leadId, source: "form" }).catch(() => {});
  }
  return leadId;
}

export async function trackFormView(params: {
  formId: string;
  clientSlug: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmContent?: string;
  utmTerm?: string;
  fbclid?: string;
  gclid?: string;
  ipAddress?: string;
  userAgent?: string;
}): Promise<void> {
  if (!hasDatabaseConfig()) return;
  await queryDb(
    `INSERT INTO lead_form_views (
       form_id, client_slug, utm_source, utm_medium, utm_campaign,
       utm_content, utm_term, fbclid, gclid, ip_address, user_agent
     ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
    [
      params.formId,
      params.clientSlug,
      params.utmSource ?? null,
      params.utmMedium ?? null,
      params.utmCampaign ?? null,
      params.utmContent ?? null,
      params.utmTerm ?? null,
      params.fbclid ?? null,
      params.gclid ?? null,
      params.ipAddress ?? null,
      params.userAgent ?? null,
    ]
  );
}
