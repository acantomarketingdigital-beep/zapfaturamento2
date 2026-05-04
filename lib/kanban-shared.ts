export const LEAD_STATUS_LABELS = {
  novo_lead: "Novo lead",
  em_atendimento: "Em atendimento",
  agendado: "Agendado",
  compareceu: "Compareceu",
  negociacao: "Negociacao",
  pagamento_pendente: "Pagamento pendente",
  pago: "Pago",
  finalizado: "Finalizado",
  perdido: "Perdido"
} as const;

export type LeadStatus = keyof typeof LEAD_STATUS_LABELS;

export function normalizeLeadStatus(value?: string | null): LeadStatus {
  const normalized = (value || "").trim().toLowerCase();

  if (normalized in LEAD_STATUS_LABELS) {
    return normalized as LeadStatus;
  }

  return "novo_lead";
}
