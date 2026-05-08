export type PlanKey = "starter" | "agency" | "scale" | "enterprise";

export type Plan = {
  key: PlanKey;
  name: string;
  priceMonthly: number;
  clientsIncluded: number | null;
  billableLeadsIncluded: number;
  leadFormsIncluded: number | null;
  activeWhatsappsIncluded: number | null;
  leadOveragePrice: number;
  extraFormPriceMonthly: number | null;
  extraWhatsappPriceMonthly: number | null;
  fullSystemIncluded: true;
  badge?: string;
  featured?: boolean;
};

export const PLANS: Record<PlanKey, Plan> = {
  starter: {
    key: "starter",
    name: "Starter",
    priceMonthly: 97,
    clientsIncluded: 3,
    billableLeadsIncluded: 2000,
    leadFormsIncluded: 3,
    activeWhatsappsIncluded: 3,
    leadOveragePrice: 0.05,
    extraFormPriceMonthly: 19,
    extraWhatsappPriceMonthly: 29,
    fullSystemIncluded: true,
  },
  agency: {
    key: "agency",
    name: "Agency",
    priceMonthly: 197,
    clientsIncluded: 10,
    billableLeadsIncluded: 5000,
    leadFormsIncluded: 6,
    activeWhatsappsIncluded: 10,
    leadOveragePrice: 0.04,
    extraFormPriceMonthly: 15,
    extraWhatsappPriceMonthly: 25,
    fullSystemIncluded: true,
    badge: "Mais popular",
    featured: true,
  },
  scale: {
    key: "scale",
    name: "Scale",
    priceMonthly: 297,
    clientsIncluded: 25,
    billableLeadsIncluded: 10000,
    leadFormsIncluded: 15,
    activeWhatsappsIncluded: 25,
    leadOveragePrice: 0.03,
    extraFormPriceMonthly: 10,
    extraWhatsappPriceMonthly: 20,
    fullSystemIncluded: true,
  },
  enterprise: {
    key: "enterprise",
    name: "Enterprise",
    priceMonthly: 497,
    clientsIncluded: null,
    billableLeadsIncluded: 30000,
    leadFormsIncluded: null,
    activeWhatsappsIncluded: null,
    leadOveragePrice: 0.02,
    extraFormPriceMonthly: null,
    extraWhatsappPriceMonthly: null,
    fullSystemIncluded: true,
  },
};

export const PLAN_LIST: Plan[] = [
  PLANS.starter,
  PLANS.agency,
  PLANS.scale,
  PLANS.enterprise,
];

export function getPlanByKey(key: string | null | undefined): Plan | null {
  if (!key) return null;
  return PLANS[key as PlanKey] ?? null;
}

// Backward-compat aliases
export type PlanId = PlanKey;
export const getPlanById = getPlanByKey;

export function fmtLimit(n: number | null, unit = ""): string {
  if (n === null) return "Ilimitado";
  return n.toLocaleString("pt-BR") + (unit ? ` ${unit}` : "");
}

export function fmtPrice(n: number): string {
  return `R$${n.toFixed(2).replace(".", ",").replace(/,00$/, "")}`;
}
