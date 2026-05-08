import Stripe from "stripe";

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

export const STRIPE_PRICE_MONTHLY  = (process.env.STRIPE_PRICE_MONTHLY ?? "").trim();
export const STRIPE_PRICE_YEARLY   = (process.env.STRIPE_PRICE_YEARLY  ?? "").trim();
export const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET ?? "";

// TODO: add per-plan Stripe price IDs when migrating to new pricing structure
// STRIPE_PRICE_STARTER_MONTHLY, STRIPE_PRICE_AGENCY_MONTHLY, STRIPE_PRICE_SCALE_MONTHLY, STRIPE_PRICE_ENTERPRISE_MONTHLY
// Env vars needed: STRIPE_PRICE_STARTER, STRIPE_PRICE_AGENCY, STRIPE_PRICE_SCALE, STRIPE_PRICE_ENTERPRISE

export type StripePlan = "monthly" | "yearly" | "starter" | "agency" | "scale" | "enterprise";

export function getPriceIdForPlan(plan: string): string {
  // TODO: map new plan IDs to their Stripe price IDs
  // case "starter": return process.env.STRIPE_PRICE_STARTER ?? "";
  // case "agency":  return process.env.STRIPE_PRICE_AGENCY  ?? "";
  // case "scale":   return process.env.STRIPE_PRICE_SCALE   ?? "";
  // case "enterprise": return process.env.STRIPE_PRICE_ENTERPRISE ?? "";
  if (plan === "yearly") return STRIPE_PRICE_YEARLY;
  return STRIPE_PRICE_MONTHLY;
}

export function getPlanFromPriceId(priceId: string): StripePlan {
  if (priceId && priceId === STRIPE_PRICE_YEARLY) return "yearly";
  return "monthly";
}

export function isStripeConfigured(): boolean {
  return Boolean(
    process.env.STRIPE_SECRET_KEY &&
    (STRIPE_PRICE_MONTHLY || STRIPE_PRICE_YEARLY)
  );
}

export function getBaseUrl(): string {
  let url = (process.env.NEXT_PUBLIC_BASE_URL ?? "").trim().replace(/\/$/, "");
  if (!url) url = "https://zapfaturamento.com.br";
  if (!url.startsWith("http")) url = "https://" + url;
  return url;
}
