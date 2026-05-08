import { queryDb, hasDatabaseConfig } from "@/lib/db";
import { PLANS, PlanId } from "@/lib/plans";

function currentBillingMonth(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
}

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

export type WorkspaceUsage = {
  billingMonth: string;
  billableLeads: number;
  clientsActive: number;
  leadsLimit: number;
  clientsLimit: number | null;
  leadsPercent: number;
  estimatedOverage: number;
  overagePerLead: number;
};

export async function getWorkspaceUsage(
  workspaceSlug: string | null,
  planId: string | null
): Promise<WorkspaceUsage> {
  const plan = PLANS[planId as PlanId] ?? PLANS.starter;
  const monthStr = currentBillingMonth();

  let billableLeads = 0;
  let clientsActive = 0;

  if (hasDatabaseConfig()) {
    try {
      const result = await queryDb<{ leads: string; clients: string }>(
        `SELECT
           COUNT(bue.id)                    AS leads,
           COUNT(DISTINCT bue.client_slug)  AS clients
         FROM billing_usage_events bue
         JOIN clients c ON c.client_slug = bue.client_slug
         WHERE c.workspace_slug IS NOT DISTINCT FROM $1
           AND bue.billing_month = $2
           AND bue.event_type = 'billable_lead'`,
        [workspaceSlug, monthStr]
      );
      billableLeads = parseInt(result.rows[0]?.leads ?? "0", 10);
      clientsActive = parseInt(result.rows[0]?.clients ?? "0", 10);
    } catch {
      // ignore — non-critical display
    }
  }

  const leadsPercent = Math.min(100, Math.round((billableLeads / plan.leadsLimit) * 100));
  const overageLeads = Math.max(0, billableLeads - plan.leadsLimit);
  const estimatedOverage = Math.round(overageLeads * plan.overagePerLead * 100) / 100;

  return {
    billingMonth: monthStr.slice(0, 7),
    billableLeads,
    clientsActive,
    leadsLimit: plan.leadsLimit,
    clientsLimit: plan.clientsLimit,
    leadsPercent,
    estimatedOverage,
    overagePerLead: plan.overagePerLead,
  };
}
