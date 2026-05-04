import { queryDb } from "@/lib/db";

// ─── Config ──────────────────────────────────────────────────────────────────

export const DEFAULT_MONTHLY_PRICE = 97; // R$ — change when pricing changes

// ─── Types ───────────────────────────────────────────────────────────────────

export type TrialStatus = "ativo" | "expirando" | "expirado" | "convertido";
export type SubStatus   = "trial" | "active" | "past_due" | "canceled" | "expired" | "inactive";
export type Period      = "7d" | "30d" | "this_month" | "last_month";

export const PERIOD_LABELS: Record<string, string> = {
  "7d":         "Últimos 7 dias",
  "30d":        "Últimos 30 dias",
  "this_month": "Este mês",
  "last_month": "Mês passado",
};

export type TrialRow = {
  id: string;
  email: string;
  phone: string | null;
  plan_type: string;
  is_active: boolean;
  status: string | null;
  invite_token: string | null;
  trial_started_at: string | null;
  trial_expires_at: string | null;
  created_at: string;
  days_left: number | null;
  trial_status: TrialStatus;
};

export type SubscriptionRow = {
  id: string;
  email: string;
  phone: string | null;
  plan_type: string;
  is_active: boolean;
  plan_expires_at: string | null;
  subscription_id: string | null;
  subscription_status: string | null;
  subscription_started_at: string | null;
  subscription_canceled_at: string | null;
  monthly_price: number | null;
  last_payment_at: string | null;
  next_payment_at: string | null;
  created_at: string;
  sub_status: SubStatus;
};

export type BusinessMetrics = {
  totalUsers: number;
  trialsAtivos: number;
  trialsExpirados: number;
  clientesAtivos: number;
  assinaturasAtivas: number;
  mrr: number;
  newUsersInPeriod: number;
  churnRate: string;
  conversionRate: string;
};

export type BusinessAlerts = {
  expiringToday: TrialRow[];
  expiring2Days: TrialRow[];
  expired: TrialRow[];
  overdueSubscriptions: SubscriptionRow[];
  noPhone: number;
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

export function getPeriodRange(period: string): { start: Date; end: Date } {
  const now = new Date();
  switch (period) {
    case "7d":
      return { start: new Date(now.getTime() - 7 * 86_400_000), end: now };
    case "this_month":
      return { start: new Date(now.getFullYear(), now.getMonth(), 1), end: now };
    case "last_month": {
      const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const end   = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
      return { start, end };
    }
    default: // "30d"
      return { start: new Date(now.getTime() - 30 * 86_400_000), end: now };
  }
}

function computeTrialStatus(row: {
  plan_type: string;
  is_active: boolean;
  trial_expires_at: string | null;
}): { status: TrialStatus; days_left: number | null } {
  if (row.plan_type === "pro") return { status: "convertido", days_left: null };

  const exp     = row.trial_expires_at ? new Date(row.trial_expires_at) : null;
  const now     = new Date();

  if (!row.is_active || !exp || exp < now) return { status: "expirado", days_left: null };

  const days_left = Math.ceil((exp.getTime() - now.getTime()) / 86_400_000);
  return { status: days_left <= 2 ? "expirando" : "ativo", days_left };
}

function computeSubStatus(row: {
  plan_type: string;
  is_active: boolean;
  plan_expires_at: string | null;
  subscription_status: string | null;
}): SubStatus {
  if (row.subscription_status) return row.subscription_status as SubStatus;
  if (!row.is_active)          return "canceled";
  if (row.plan_type === "trial") return "trial";
  if (row.plan_type === "pro") {
    const exp = row.plan_expires_at ? new Date(row.plan_expires_at) : null;
    if (exp && exp < new Date()) return "expired";
    return "active";
  }
  return "inactive";
}

// ─── Queries ─────────────────────────────────────────────────────────────────

export async function getBusinessMetrics(period: string): Promise<BusinessMetrics> {
  const { start, end } = getPeriodRange(period);

  const [totals, newUsers] = await Promise.all([
    queryDb<{
      total_users: string;
      trials_ativos: string;
      trials_expirados: string;
      clientes_ativos: string;
      assinaturas_ativas: string;
      mrr: string;
      converted: string;
      total_trials_ended: string;
      canceled_in_period: string;
    }>(`
      SELECT
        COUNT(*) FILTER (WHERE role != 'agency_admin')                                                                AS total_users,
        COUNT(*) FILTER (WHERE plan_type = 'trial' AND trial_expires_at > NOW() AND is_active = true)                AS trials_ativos,
        COUNT(*) FILTER (WHERE plan_type = 'trial' AND (trial_expires_at <= NOW() OR NOT is_active))                 AS trials_expirados,
        COUNT(*) FILTER (WHERE plan_type = 'pro' AND is_active = true
                           AND (plan_expires_at IS NULL OR plan_expires_at > NOW()))                                  AS clientes_ativos,
        COUNT(*) FILTER (WHERE plan_type = 'pro' AND is_active = true)                                               AS assinaturas_ativas,
        COALESCE(SUM(COALESCE(monthly_price, $1))
          FILTER (WHERE plan_type = 'pro' AND is_active = true), 0)                                                  AS mrr,
        COUNT(*) FILTER (WHERE plan_type = 'pro' AND trial_started_at IS NOT NULL)                                   AS converted,
        COUNT(*) FILTER (WHERE trial_started_at IS NOT NULL
                           AND (plan_type = 'pro' OR trial_expires_at <= NOW()))                                      AS total_trials_ended,
        COUNT(*) FILTER (WHERE NOT is_active AND plan_type = 'pro'
                           AND (subscription_canceled_at >= $2 OR (subscription_canceled_at IS NULL AND plan_expires_at >= $2))
                           AND (subscription_canceled_at <= $3 OR plan_expires_at <= $3))                             AS canceled_in_period
      FROM users
    `, [DEFAULT_MONTHLY_PRICE, start.toISOString(), end.toISOString()]),

    queryDb<{ count: string }>(
      `SELECT COUNT(*) AS count FROM users
       WHERE role != 'agency_admin' AND created_at >= $1 AND created_at <= $2`,
      [start.toISOString(), end.toISOString()]
    ),
  ]);

  const t                = totals.rows[0];
  const assinaturasAtivas = parseInt(t.assinaturas_ativas)  || 0;
  const canceledInPeriod  = parseInt(t.canceled_in_period)  || 0;
  const converted         = parseInt(t.converted)           || 0;
  const totalTrialsEnded  = parseInt(t.total_trials_ended)  || 0;

  const churnRate = (assinaturasAtivas + canceledInPeriod) >= 5
    ? `${Math.round((canceledInPeriod / (assinaturasAtivas + canceledInPeriod)) * 100)}%`
    : "Dados insuficientes";

  const conversionRate = totalTrialsEnded >= 3
    ? `${Math.round((converted / totalTrialsEnded) * 100)}%`
    : "Dados insuficientes";

  return {
    totalUsers:         parseInt(t.total_users)      || 0,
    trialsAtivos:       parseInt(t.trials_ativos)    || 0,
    trialsExpirados:    parseInt(t.trials_expirados) || 0,
    clientesAtivos:     parseInt(t.clientes_ativos)  || 0,
    assinaturasAtivas,
    mrr:                parseInt(t.mrr)              || 0,
    newUsersInPeriod:   parseInt(newUsers.rows[0]?.count ?? "0") || 0,
    churnRate,
    conversionRate,
  };
}

export async function getTrials(): Promise<TrialRow[]> {
  const result = await queryDb<{
    id: string; email: string; phone: string | null; plan_type: string;
    is_active: boolean; status: string | null; invite_token: string | null;
    trial_started_at: string | null; trial_expires_at: string | null; created_at: string;
  }>(`
    SELECT id, email, phone, plan_type, is_active, status, invite_token,
           trial_started_at, trial_expires_at, created_at
    FROM users
    WHERE role != 'agency_admin'
      AND (plan_type = 'trial' OR trial_started_at IS NOT NULL)
    ORDER BY
      CASE
        WHEN plan_type = 'trial' AND is_active = true  THEN 0
        WHEN plan_type = 'trial' AND NOT is_active      THEN 1
        ELSE 2
      END,
      trial_expires_at ASC NULLS LAST
  `);

  return result.rows.map((row) => {
    const { status, days_left } = computeTrialStatus(row);
    return { ...row, trial_status: status, days_left };
  });
}

export async function getSubscriptions(): Promise<SubscriptionRow[]> {
  const result = await queryDb<{
    id: string; email: string; phone: string | null; plan_type: string;
    is_active: boolean; plan_expires_at: string | null; subscription_id: string | null;
    subscription_status: string | null; subscription_started_at: string | null;
    subscription_canceled_at: string | null; monthly_price: number | null;
    last_payment_at: string | null; next_payment_at: string | null; created_at: string;
  }>(`
    SELECT id, email, phone, plan_type, is_active, plan_expires_at,
           subscription_id, subscription_status, subscription_started_at,
           subscription_canceled_at, monthly_price, last_payment_at,
           next_payment_at, created_at
    FROM users
    WHERE role != 'agency_admin'
    ORDER BY
      CASE
        WHEN plan_type = 'pro' AND is_active = true  THEN 0
        WHEN plan_type = 'trial' AND is_active = true THEN 1
        ELSE 2
      END,
      created_at DESC
  `);

  return result.rows.map((row) => ({
    ...row,
    sub_status: computeSubStatus(row),
  }));
}

export async function getAlerts(
  trials: TrialRow[],
  subs: SubscriptionRow[]
): Promise<BusinessAlerts> {
  const now      = new Date();
  const tomorrow = new Date(now.getTime() + 86_400_000);
  const in2Days  = new Date(now.getTime() + 2 * 86_400_000);

  const expiringToday = trials.filter((t) => {
    if (t.trial_status !== "ativo" && t.trial_status !== "expirando") return false;
    const exp = t.trial_expires_at ? new Date(t.trial_expires_at) : null;
    return exp && exp <= tomorrow;
  });

  const expiring2Days = trials.filter((t) => {
    if (t.trial_status !== "ativo" && t.trial_status !== "expirando") return false;
    const exp = t.trial_expires_at ? new Date(t.trial_expires_at) : null;
    return exp && exp > tomorrow && exp <= in2Days;
  });

  const expired              = trials.filter((t) => t.trial_status === "expirado");
  const overdueSubscriptions = subs.filter((s) =>
    s.sub_status === "expired" || s.sub_status === "past_due"
  );

  const noPhoneResult = await queryDb<{ count: string }>(
    `SELECT COUNT(*) AS count FROM users
     WHERE role != 'agency_admin' AND (phone IS NULL OR phone = '')`
  );
  const noPhone = parseInt(noPhoneResult.rows[0]?.count ?? "0") || 0;

  return { expiringToday, expiring2Days, expired, overdueSubscriptions, noPhone };
}
