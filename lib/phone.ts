export type PhoneInfo = {
  digits: string;
  display: string;
  country: string;
  flag: string;
  waUrl: string;
};

export function formatLeadPhone(phone: string): PhoneInfo {
  const digits = phone.replace(/\D/g, "");

  if (!digits) {
    return { digits: "", display: phone || "-", country: "Internacional", flag: "🌍", waUrl: "" };
  }

  // Brazil: DDI 55 — total 12 (8-digit landline) or 13 (9-digit mobile)
  if (digits.startsWith("55") && (digits.length === 12 || digits.length === 13)) {
    const ddd = digits.slice(2, 4);
    const num = digits.slice(4);
    const display =
      num.length === 9
        ? `+55 (${ddd}) ${num.slice(0, 5)}-${num.slice(5)}`
        : `+55 (${ddd}) ${num.slice(0, 4)}-${num.slice(4)}`;
    return { digits, display, country: "Brasil", flag: "🇧🇷", waUrl: `https://wa.me/${digits}` };
  }

  // Portugal: DDI 351 — total 12 (9-digit local)
  if (digits.startsWith("351") && digits.length === 12) {
    const num = digits.slice(3);
    const display = `+351 ${num.slice(0, 3)} ${num.slice(3, 6)} ${num.slice(6)}`;
    return { digits, display, country: "Portugal", flag: "🇵🇹", waUrl: `https://wa.me/${digits}` };
  }

  // USA / Canada: DDI 1 — total 11
  if (digits.startsWith("1") && digits.length === 11) {
    const area = digits.slice(1, 4);
    const num = digits.slice(4);
    const display = `+1 (${area}) ${num.slice(0, 3)}-${num.slice(3)}`;
    return { digits, display, country: "EUA", flag: "🇺🇸", waUrl: `https://wa.me/${digits}` };
  }

  // Fallback: unknown DDI — show digits with leading +
  return {
    digits,
    display: `+${digits}`,
    country: "Internacional",
    flag: "🌍",
    waUrl: `https://wa.me/${digits}`,
  };
}
