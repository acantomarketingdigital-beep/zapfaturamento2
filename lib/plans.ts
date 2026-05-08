export type PlanId = "starter" | "agency" | "scale" | "enterprise";

export type Plan = {
  id: PlanId;
  name: string;
  monthlyPrice: number;
  clientsLimit: number | null;
  leadsLimit: number;
  overagePerLead: number;
  description: string;
  badge?: string;
  featured?: boolean;
  features: string[];
};

export const PLANS: Record<PlanId, Plan> = {
  starter: {
    id: "starter",
    name: "Starter",
    monthlyPrice: 97,
    clientsLimit: 3,
    leadsLimit: 2000,
    overagePerLead: 0.05,
    description: "Para quem está começando",
    features: [
      "Até 3 clientes",
      "2.000 leads/mês inclusos",
      "Rastreamento Google Ads + Meta",
      "Lead Express (formulários)",
      "Kanban de leads e vendas",
      "Relatórios de performance",
    ],
  },
  agency: {
    id: "agency",
    name: "Agency",
    monthlyPrice: 197,
    clientsLimit: 10,
    leadsLimit: 5000,
    overagePerLead: 0.04,
    description: "Para agências em crescimento",
    badge: "Mais popular",
    featured: true,
    features: [
      "Até 10 clientes",
      "5.000 leads/mês inclusos",
      "Tudo do Starter",
      "Inbox WhatsApp nativo",
      "Múltiplos números por cliente",
      "Exportação Meta Lookalike",
    ],
  },
  scale: {
    id: "scale",
    name: "Scale",
    monthlyPrice: 297,
    clientsLimit: 25,
    leadsLimit: 10000,
    overagePerLead: 0.03,
    description: "Para operações consolidadas",
    features: [
      "Até 25 clientes",
      "10.000 leads/mês inclusos",
      "Tudo do Agency",
      "CPL e ROAS por campanha",
      "Kanban multi-cliente",
      "Suporte prioritário via WhatsApp",
    ],
  },
  enterprise: {
    id: "enterprise",
    name: "Enterprise",
    monthlyPrice: 497,
    clientsLimit: null,
    leadsLimit: 30000,
    overagePerLead: 0.02,
    description: "Para grandes agências",
    features: [
      "Clientes ilimitados",
      "30.000 leads/mês inclusos",
      "Tudo do Scale",
      "Onboarding dedicado",
      "SLA de suporte garantido",
      "Menor custo por lead excedente",
    ],
  },
};

export const PLAN_LIST: Plan[] = [
  PLANS.starter,
  PLANS.agency,
  PLANS.scale,
  PLANS.enterprise,
];

export function formatLeadsLimit(n: number): string {
  return n.toLocaleString("pt-BR");
}

export function getPlanById(id: string | null | undefined): Plan | null {
  if (!id) return null;
  return PLANS[id as PlanId] ?? null;
}
