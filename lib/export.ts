import { hasDatabaseConfig, queryDb } from "@/lib/db";
export { EXPORTABLE_STATUSES, normalizePhone } from "@/lib/export-shared";
export type { ExportableStatus } from "@/lib/export-shared";
import { EXPORTABLE_STATUSES, normalizePhone } from "@/lib/export-shared";

export type ExportLead = {
  id: number;
  whatsapp_number: string;
  lead_phone: string | null;
  lead_email: string | null;
  lead_name: string | null;
  lead_status: string;
  client_slug: string;
  utm_campaign: string | null;
  internal_campaign_slug: string | null;
  created_at: string;
  scheduled_at: string | null;
};

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizeEmail(email));
}

/**
 * statuses: null  → todos os leads (sem filtro de status)
 * statuses: [...] → apenas leads com esses status
 */
export async function getExportableLeads(options: {
  clientSlug?: string | null;
  statuses?: string[] | null;
  campaignSlug?: string | null;
  period?: "today" | "7d" | "30d" | "90d" | "all";
}): Promise<ExportLead[]> {
  if (!hasDatabaseConfig()) return [];

  const values: unknown[] = [];
  const whereClauses: string[] = ["(is_test IS FALSE OR is_test IS NULL)"];

  if (options.statuses !== null && options.statuses !== undefined) {
    const statuses = options.statuses.length
      ? options.statuses.filter((s) => (EXPORTABLE_STATUSES as readonly string[]).includes(s))
      : [...EXPORTABLE_STATUSES];
    if (statuses.length === 0) return [];
    const placeholders = statuses.map((_, i) => `$${values.length + i + 1}`).join(", ");
    values.push(...statuses);
    whereClauses.push(`lead_status IN (${placeholders})`);
  } else {
    whereClauses.push("(lead_phone IS NOT NULL OR lead_email IS NOT NULL)");
  }

  if (options.clientSlug) {
    values.push(options.clientSlug);
    whereClauses.push(`client_slug = $${values.length}`);
  }

  if (options.campaignSlug) {
    values.push(options.campaignSlug);
    whereClauses.push(`internal_campaign_slug = $${values.length}`);
  }

  if (options.period === "today") {
    whereClauses.push("created_at >= CURRENT_DATE");
  } else if (options.period === "7d") {
    whereClauses.push("created_at >= NOW() - INTERVAL '7 days'");
  } else if (options.period === "30d") {
    whereClauses.push("created_at >= NOW() - INTERVAL '30 days'");
  } else if (options.period === "90d") {
    whereClauses.push("created_at >= NOW() - INTERVAL '90 days'");
  }

  const result = await queryDb<ExportLead>(
    `SELECT id, whatsapp_number, lead_phone, lead_email, lead_name, lead_status,
            client_slug, utm_campaign, internal_campaign_slug, created_at, scheduled_at
     FROM whatsapp_leads
     WHERE ${whereClauses.join(" AND ")}
     ORDER BY created_at DESC
     LIMIT 10000`,
    values
  );

  return result.rows;
}

function csvCell(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function deduplicateLeads(leads: ExportLead[]): ExportLead[] {
  const seenPhones = new Set<string>();
  const seenEmails = new Set<string>();
  const result: ExportLead[] = [];

  for (const lead of leads) {
    const rawPhone = lead.lead_phone || lead.whatsapp_number || "";
    const phone = rawPhone.replace(/\D/g, "");
    const email = lead.lead_email ? normalizeEmail(lead.lead_email) : "";

    if (phone) {
      if (seenPhones.has(phone)) continue;
      seenPhones.add(phone);
    } else if (email && isValidEmail(email)) {
      if (seenEmails.has(email)) continue;
      seenEmails.add(email);
    } else {
      continue;
    }

    if (email && isValidEmail(email)) seenEmails.add(email);
    result.push(lead);
  }

  return result;
}

export function generateMetaCsv(leads: ExportLead[]): string {
  const header = "phone,email,fn,ln,ct,st,country,zip,external_id";

  const deduped = deduplicateLeads(leads);

  const rows = deduped.map((lead) => {
    const rawPhone = lead.lead_phone || lead.whatsapp_number || "";
    const phone = normalizePhone(rawPhone);
    const email = lead.lead_email && isValidEmail(lead.lead_email)
      ? normalizeEmail(lead.lead_email)
      : "";
    const nameParts = (lead.lead_name || "").trim().split(/\s+/);
    const fn = nameParts[0] || "";
    const ln = nameParts.slice(1).join(" ") || "";

    return [
      csvCell(phone),
      csvCell(email),
      csvCell(fn),
      csvCell(ln),
      "",
      "",
      "br",
      "",
      csvCell(String(lead.id))
    ].join(",");
  });

  return [header, ...rows].join("\n");
}
