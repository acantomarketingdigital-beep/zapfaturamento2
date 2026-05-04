export type Currency = "BRL" | "USD" | "EUR";

const CURRENCY_CONFIG: Record<Currency, { locale: string; code: string }> = {
  BRL: { locale: "pt-BR", code: "BRL" },
  USD: { locale: "en-US", code: "USD" },
  EUR: { locale: "de-DE", code: "EUR" },
};

/**
 * Format a value already in major units (e.g. 10.50) as a currency string.
 * formatCurrency(1000, "BRL") → "R$ 1.000,00"
 * formatCurrency(1000, "USD") → "$1,000.00"
 * formatCurrency(1000, "EUR") → "1.000,00 €"
 */
export function formatCurrency(value: number, currency: Currency | string = "BRL"): string {
  const cfg = CURRENCY_CONFIG[currency as Currency] ?? CURRENCY_CONFIG.BRL;
  return new Intl.NumberFormat(cfg.locale, {
    style: "currency",
    currency: cfg.code,
  }).format(value || 0);
}

/**
 * Format a value stored in cents as a currency string.
 * Accepts an optional currency code (defaults to "BRL").
 */
export function formatCurrencyFromCents(valueInCents: number, currency: Currency | string = "BRL"): string {
  return formatCurrency((valueInCents || 0) / 100, currency);
}

export function formatPercent(value: number) {
  return `${Number(value || 0).toFixed(1)}%`;
}

export function formatDateTime(value?: string | null) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}
