export type PlanKey = "starter" | "agency" | "scale" | "enterprise" | "crm";

export type Plan = {
  key: PlanKey;
  name: string;
  priceMonthly: number;
  priceYearly: number;
  stripePriceMonthlyId: string;
  stripePriceYearlyId: string;
  stripeExtraFormPriceId: string | null;
  stripeExtraWhatsappPriceId: string | null;
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
  crm: {
    key: "crm",
    name: "CRM",
    priceMonthly: 79.90,
    priceYearly: 799,
    stripePriceMonthlyId:       "price_1Ta3T8FvYZaPsKPDszuGDatC",
    stripePriceYearlyId:        "price_1Ta3UTFvYZaPsKPDCmozIgyf",
    stripeExtraFormPriceId:     null,
    stripeExtraWhatsappPriceId: "price_1TYAf7FvYZaPsKPDrtCdgYnU",
    clientsIncluded: 1,
    billableLeadsIncluded: 99999,
    leadFormsIncluded: 0,
    activeWhatsappsIncluded: 1,
    leadOveragePrice: 0,
    extraFormPriceMonthly: null,
    extraWhatsappPriceMonthly: 29,
    fullSystemIncluded: true,
    badge: "Novo",
  },
  starter: {
    key: "starter",
    name: "Starter",
    priceMonthly: 97,
    priceYearly: 970,
    stripePriceMonthlyId:       "price_1TYAPpFvYZaPsKPDOGPhTGbK",
    stripePriceYearlyId:        "price_1TYAQBFvYZaPsKPDu1om3O1Z",
    stripeExtraFormPriceId:     "price_1TYAdzFvYZaPsKPD0jHL1vx8",
    stripeExtraWhatsappPriceId: "price_1TYAf7FvYZaPsKPDrtCdgYnU",
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
    priceYearly: 1970,
    stripePriceMonthlyId:       "price_1TYARRFvYZaPsKPDM1OHOGeG",
    stripePriceYearlyId:        "price_1TYARtFvYZaPsKPDg0SISCXN",
    stripeExtraFormPriceId:     "price_1TYAeOFvYZaPsKPDTZZhcSay",
    stripeExtraWhatsappPriceId: "price_1TYAg1FvYZaPsKPDXLULtrr1",
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
    priceYearly: 2970,
    stripePriceMonthlyId:       "price_1TYATGFvYZaPsKPDgr70EKRW",
    stripePriceYearlyId:        "price_1TYATcFvYZaPsKPDWFW6f1RM",
    stripeExtraFormPriceId:     "price_1TYAeqFvYZaPsKPDRdScDGRL",
    stripeExtraWhatsappPriceId: "price_1TYAgMFvYZaPsKPDj0OCdk3a",
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
    priceYearly: 4970,
    stripePriceMonthlyId:       "price_1TYAUrFvYZaPsKPDJk5mdTRc",
    stripePriceYearlyId:        "price_1TYAVCFvYZaPsKPDv03BlWjg",
    stripeExtraFormPriceId:     null, // ilimitado
    stripeExtraWhatsappPriceId: null, // ilimitado
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

export const CRM_PLAN_LIST: Plan[] = [PLANS.crm];

export function isCrmPlan(plan: string | null | undefined): boolean {
  return plan === "crm";
}

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
