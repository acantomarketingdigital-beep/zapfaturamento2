import Stripe from "stripe";
import { PLANS, type PlanKey } from "./plans";

// Lazy singleton — doesn't crash at build time when env var is absent
let _client: Stripe | null = null;

export function getStripe(): Stripe {
  if (!_client) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error("STRIPE_SECRET_KEY not configured.");
    }
    _client = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2026-04-22.dahlia",
    });
  }
  return _client;
}

export const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET ?? "";

export type BillingCycle = "monthly" | "yearly";

export function getPriceIdForPlan(planKey: string, billing: BillingCycle = "monthly"): string {
  const plan = PLANS[planKey as PlanKey];
  if (!plan) return "";
  return billing === "yearly" ? plan.stripePriceYearlyId : plan.stripePriceMonthlyId;
}

export function getPlanFromPriceId(priceId: string): string {
  for (const plan of Object.values(PLANS)) {
    if (plan.stripePriceMonthlyId === priceId || plan.stripePriceYearlyId === priceId) {
      return plan.key;
    }
  }
  return "starter"; // safe default for unrecognized price IDs
}

export function getBillingCycleFromPriceId(priceId: string): BillingCycle {
  for (const plan of Object.values(PLANS)) {
    if (plan.stripePriceYearlyId === priceId) return "yearly";
    if (plan.stripePriceMonthlyId === priceId) return "monthly";
  }
  return "monthly"; // safe default
}

export function isStripeConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

export function getBaseUrl(): string {
  let url = (process.env.NEXT_PUBLIC_BASE_URL ?? "").trim().replace(/\/$/, "");
  if (!url) url = "https://zapfaturamento.com.br";
  if (!url.startsWith("http")) url = "https://" + url;
  return url;
}
