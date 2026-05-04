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

export type StripePlan = "monthly" | "yearly";

export function getPriceIdForPlan(plan: string): string {
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
