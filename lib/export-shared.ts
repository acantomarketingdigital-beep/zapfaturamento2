export const EXPORTABLE_STATUSES = [
  "agendado",
  "compareceu",
  "negociacao",
  "pago",
  "finalizado"
] as const;

export type ExportableStatus = (typeof EXPORTABLE_STATUSES)[number];

export function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("55") && digits.length >= 12) return digits;
  if (digits.length >= 10 && digits.length <= 11) return `55${digits}`;
  return digits;
}

export function buildWhatsAppWebUrl(phone: string, message?: string): string {
  const normalized = normalizePhone(phone);
  const base = `https://web.whatsapp.com/send?phone=${normalized}`;
  return message ? `${base}&text=${encodeURIComponent(message)}` : base;
}
