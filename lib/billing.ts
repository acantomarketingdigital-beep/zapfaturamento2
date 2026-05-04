import { cache } from "react";
import { queryDb } from "@/lib/db";

export const TRIAL_DAYS = 7;

export type PlanType = "trial" | "pro" | "inactive";

export type BillingStatus = {
  isBlocked: boolean;
  planType: PlanType;
  trialExpiresAt: Date | null;
  planExpiresAt: Date | null;
  daysLeft: number | null;
  subscriptionStatus: string | null;
  subscriptionPlan: "monthly" | "yearly" | null;
  stripeCustomerId: string | null;
  paidAccess: boolean | null;
};

async function fetchUserBillingStatus(userId: string): Promise<BillingStatus> {
  const result = await queryDb<{
    plan_type: string;
    is_active: boolean;
    trial_expires_at: string | null;
    plan_expires_at: string | null;
    subscription_status: string | null;
    subscription_plan: string | null;
    stripe_customer_id: string | null;
    paid_access: boolean | null;
  }>(
    `SELECT plan_type, is_active, trial_expires_at, plan_expires_at,
            subscription_status, subscription_plan,
            stripe_customer_id, paid_access
     FROM users WHERE id = $1 LIMIT 1`,
    [userId]
  );

  const row = result.rows[0];

  const emptyMeta = {
    subscriptionStatus: null as string | null,
    subscriptionPlan:   null as "monthly" | "yearly" | null,
    stripeCustomerId:   null as string | null,
    paidAccess:         null as boolean | null,
  };

  if (!row) {
    return {
      isBlocked: true,
      planType: "inactive",
      trialExpiresAt: null,
      planExpiresAt: null,
      daysLeft: null,
      ...emptyMeta,
    };
  }

  const now        = new Date();
  const planType   = (row.plan_type ?? "inactive") as PlanType;
  const trialExpAt = row.trial_expires_at ? new Date(row.trial_expires_at) : null;
  const planExpAt  = row.plan_expires_at  ? new Date(row.plan_expires_at)  : null;
  const subStatus  = row.subscription_status ?? null;
  const subPlan    = (row.subscription_plan ?? null) as "monthly" | "yearly" | null;
  const stripeCid  = row.stripe_customer_id  ?? null;
  const paidAccess = row.paid_access ?? null;

  const meta = {
    subscriptionStatus: subStatus,
    subscriptionPlan:   subPlan,
    stripeCustomerId:   stripeCid,
    paidAccess,
  };

  // If paid_access is explicitly set by Stripe webhook, use it as source of truth
  if (paidAccess !== null) {
    const daysLeft = !paidAccess && trialExpAt && trialExpAt > now
      ? Math.ceil((trialExpAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      : null;
    return {
      isBlocked: !paidAccess,
      planType,
      trialExpiresAt: trialExpAt,
      planExpiresAt:  planExpAt,
      daysLeft,
      ...meta,
    };
  }

  // Fallback: compute from plan_type / trial (for grandfathered users without paid_access set)
  if (!row.is_active || subStatus === "canceled") {
    return { isBlocked: true, planType, trialExpiresAt: trialExpAt, planExpiresAt: planExpAt, daysLeft: null, ...meta };
  }

  if (planType === "pro") {
    if (planExpAt && planExpAt < now) {
      return { isBlocked: true, planType, trialExpiresAt: trialExpAt, planExpiresAt: planExpAt, daysLeft: null, ...meta };
    }
    return { isBlocked: false, planType, trialExpiresAt: trialExpAt, planExpiresAt: planExpAt, daysLeft: null, ...meta };
  }

  if (planType === "trial") {
    if (!trialExpAt || trialExpAt < now) {
      return { isBlocked: true, planType, trialExpiresAt: trialExpAt, planExpiresAt: planExpAt, daysLeft: null, ...meta };
    }
    const msLeft   = trialExpAt.getTime() - now.getTime();
    const daysLeft = Math.ceil(msLeft / (1000 * 60 * 60 * 24));
    return { isBlocked: false, planType, trialExpiresAt: trialExpAt, planExpiresAt: planExpAt, daysLeft, ...meta };
  }

  return { isBlocked: true, planType, trialExpiresAt: trialExpAt, planExpiresAt: planExpAt, daysLeft: null, ...meta };
}

export const getCachedBillingStatus = cache(fetchUserBillingStatus);

export function normalizeBillingPhone(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (digits.length >= 10 && digits.length <= 11 && !digits.startsWith("55")) {
    return `55${digits}`;
  }
  return digits;
}

export async function startTrial(userId: string): Promise<void> {
  await queryDb(
    `UPDATE users
     SET plan_type = 'trial',
         trial_started_at = NOW(),
         trial_expires_at = NOW() + INTERVAL '${TRIAL_DAYS} days'
     WHERE id = $1 AND trial_started_at IS NULL`,
    [userId]
  );
}
