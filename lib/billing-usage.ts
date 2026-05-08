import { queryDb, hasDatabaseConfig } from "@/lib/db";
import { PLANS, getPlanByKey, PlanKey } from "@/lib/plans";

function currentBillingMonth(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
}

// ─── Record billable lead (called from all 3 lead creation points) ────────────

export async function recordBillableLead(params: {
  clientSlug: string;
  leadId: number;
  source: "whatsapp" | "form" | "meta" | "manual" | "other";
}): Promise<void> {
  if (!hasDatabaseConfig() || !params.leadId) return;
  try {
    await queryDb(
      `INSERT INTO billing_usage_events (client_slug, lead_id, event_type, source, billing_month)
       VALUES ($1, $2, 'billable_lead', $3, $4)
       ON CONFLICT (client_slug, lead_id, event_type) DO NOTHING`,
      [params.clientSlug, params.leadId, params.source, currentBillingMonth()]
    );
  } catch {
    // non-blocking — never crash lead creation over billing
  }
}

// ─── Full workspace usage ─────────────────────────────────────────────────────

export type WorkspaceBillingUsage = {
  planKey: string | null;
  planName: string;
  // Clients
  clientsUsed: number;
  clientsIncluded: number | null;
  // Leads
  billableLeadsUsedThisMonth: number;
  billableLeadsIncluded: number;
  leadOverageCount: number;
  estimatedLeadOverageAmount: number;
  leadOveragePrice: number;
  // Forms
  formsUsed: number;
  formsIncluded: number | null;
  extraFormsActive: number;
  totalFormsAllowed: number | null;
  // WhatsApps
  whatsappsActive: number;
  whatsappsIncluded: number | null;
  extraWhatsappsActive: number;
  totalWhatsappsAllowed: number | null;
  // Period
  billingMonth: string;
};

export async function getWorkspaceBillingUsage(
  workspaceSlug: string | null,
  planKey: string | null
): Promise<WorkspaceBillingUsage> {
  const plan = getPlanByKey(planKey) ?? PLANS.starter;
  const monthStr = currentBillingMonth();

  let clientsUsed = 0;
  let billableLeadsUsedThisMonth = 0;
  let formsUsed = 0;
  let whatsappsActive = 0;
  let extraFormsActive = 0;
  let extraWhatsappsActive = 0;

  if (hasDatabaseConfig()) {
    try {
      const [r1, r2, r3, r4, r5] = await Promise.all([
        // Clients in workspace
        queryDb<{ cnt: string }>(
          `SELECT COUNT(*) AS cnt FROM clients
           WHERE workspace_slug IS NOT DISTINCT FROM $1 AND is_active = true`,
          [workspaceSlug]
        ),
        // Billable leads this month
        queryDb<{ cnt: string }>(
          `SELECT COUNT(bue.id) AS cnt
           FROM billing_usage_events bue
           JOIN clients c ON c.client_slug = bue.client_slug
           WHERE c.workspace_slug IS NOT DISTINCT FROM $1
             AND bue.billing_month = $2
             AND bue.event_type = 'billable_lead'`,
          [workspaceSlug, monthStr]
        ),
        // Forms in workspace (active or inactive — not deleted)
        queryDb<{ cnt: string }>(
          `SELECT COUNT(lf.id) AS cnt
           FROM lead_forms lf
           JOIN clients c ON c.client_slug = lf.client_slug
           WHERE c.workspace_slug IS NOT DISTINCT FROM $1`,
          [workspaceSlug]
        ),
        // Active WhatsApp connections
        queryDb<{ cnt: string }>(
          `SELECT COUNT(wc.id) AS cnt
           FROM whatsapp_connections wc
           JOIN clients c ON c.client_slug = wc.client_slug
           WHERE c.workspace_slug IS NOT DISTINCT FROM $1
             AND wc.is_active = true`,
          [workspaceSlug]
        ),
        // Active add-ons
        queryDb<{ addon_type: string; total_qty: string }>(
          `SELECT addon_type, COALESCE(SUM(quantity), 0) AS total_qty
           FROM billing_addons
           WHERE workspace_slug = $1 AND status = 'active'
           GROUP BY addon_type`,
          [workspaceSlug ?? ""]
        ),
      ]);

      clientsUsed                = parseInt(r1.rows[0]?.cnt ?? "0", 10);
      billableLeadsUsedThisMonth = parseInt(r2.rows[0]?.cnt ?? "0", 10);
      formsUsed                  = parseInt(r3.rows[0]?.cnt ?? "0", 10);
      whatsappsActive            = parseInt(r4.rows[0]?.cnt ?? "0", 10);

      for (const row of r5.rows) {
        if (row.addon_type === "extra_form")
          extraFormsActive = parseInt(row.total_qty ?? "0", 10);
        else if (row.addon_type === "extra_whatsapp")
          extraWhatsappsActive = parseInt(row.total_qty ?? "0", 10);
      }
    } catch {
      // non-critical — return zeroes
    }
  }

  const leadOverageCount = Math.max(0, billableLeadsUsedThisMonth - plan.billableLeadsIncluded);
  const estimatedLeadOverageAmount =
    Math.round(leadOverageCount * plan.leadOveragePrice * 100) / 100;

  const totalFormsAllowed =
    plan.leadFormsIncluded === null ? null : plan.leadFormsIncluded + extraFormsActive;
  const totalWhatsappsAllowed =
    plan.activeWhatsappsIncluded === null ? null : plan.activeWhatsappsIncluded + extraWhatsappsActive;

  return {
    planKey: plan.key,
    planName: plan.name,
    clientsUsed,
    clientsIncluded: plan.clientsIncluded,
    billableLeadsUsedThisMonth,
    billableLeadsIncluded: plan.billableLeadsIncluded,
    leadOverageCount,
    estimatedLeadOverageAmount,
    leadOveragePrice: plan.leadOveragePrice,
    formsUsed,
    formsIncluded: plan.leadFormsIncluded,
    extraFormsActive,
    totalFormsAllowed,
    whatsappsActive,
    whatsappsIncluded: plan.activeWhatsappsIncluded,
    extraWhatsappsActive,
    totalWhatsappsAllowed,
    billingMonth: monthStr.slice(0, 7),
  };
}

// ─── Limit checks (used in API routes) ───────────────────────────────────────

export async function checkFormLimit(
  workspaceSlug: string | null,
  planKey: string | null
): Promise<{ allowed: boolean; formsUsed: number; totalFormsAllowed: number | null }> {
  const plan = getPlanByKey(planKey) ?? PLANS.starter;
  if (plan.leadFormsIncluded === null) return { allowed: true, formsUsed: 0, totalFormsAllowed: null };

  let formsUsed = 0;
  let extraFormsActive = 0;

  if (hasDatabaseConfig()) {
    try {
      const [r1, r2] = await Promise.all([
        queryDb<{ cnt: string }>(
          `SELECT COUNT(lf.id) AS cnt FROM lead_forms lf
           JOIN clients c ON c.client_slug = lf.client_slug
           WHERE c.workspace_slug IS NOT DISTINCT FROM $1`,
          [workspaceSlug]
        ),
        queryDb<{ total_qty: string }>(
          `SELECT COALESCE(SUM(quantity), 0) AS total_qty FROM billing_addons
           WHERE workspace_slug = $1 AND addon_type = 'extra_form' AND status = 'active'`,
          [workspaceSlug ?? ""]
        ),
      ]);
      formsUsed = parseInt(r1.rows[0]?.cnt ?? "0", 10);
      extraFormsActive = parseInt(r2.rows[0]?.total_qty ?? "0", 10);
    } catch {
      return { allowed: true, formsUsed: 0, totalFormsAllowed: null }; // fail-open
    }
  }

  const totalFormsAllowed = plan.leadFormsIncluded + extraFormsActive;
  return { allowed: formsUsed < totalFormsAllowed, formsUsed, totalFormsAllowed };
}

export async function checkWhatsappLimit(
  workspaceSlug: string | null,
  planKey: string | null
): Promise<{ allowed: boolean; whatsappsActive: number; totalWhatsappsAllowed: number | null }> {
  const plan = getPlanByKey(planKey) ?? PLANS.starter;
  if (plan.activeWhatsappsIncluded === null)
    return { allowed: true, whatsappsActive: 0, totalWhatsappsAllowed: null };

  let whatsappsActive = 0;
  let extraWhatsappsActive = 0;

  if (hasDatabaseConfig()) {
    try {
      const [r1, r2] = await Promise.all([
        queryDb<{ cnt: string }>(
          `SELECT COUNT(wc.id) AS cnt FROM whatsapp_connections wc
           JOIN clients c ON c.client_slug = wc.client_slug
           WHERE c.workspace_slug IS NOT DISTINCT FROM $1 AND wc.is_active = true`,
          [workspaceSlug]
        ),
        queryDb<{ total_qty: string }>(
          `SELECT COALESCE(SUM(quantity), 0) AS total_qty FROM billing_addons
           WHERE workspace_slug = $1 AND addon_type = 'extra_whatsapp' AND status = 'active'`,
          [workspaceSlug ?? ""]
        ),
      ]);
      whatsappsActive = parseInt(r1.rows[0]?.cnt ?? "0", 10);
      extraWhatsappsActive = parseInt(r2.rows[0]?.total_qty ?? "0", 10);
    } catch {
      return { allowed: true, whatsappsActive: 0, totalWhatsappsAllowed: null }; // fail-open
    }
  }

  const totalWhatsappsAllowed = plan.activeWhatsappsIncluded + extraWhatsappsActive;
  return { allowed: whatsappsActive < totalWhatsappsAllowed, whatsappsActive, totalWhatsappsAllowed };
}

// ─── Legacy alias used by assinatura page ─────────────────────────────────────
export type WorkspaceUsage = WorkspaceBillingUsage;
export const getWorkspaceUsage = getWorkspaceBillingUsage;
