// Pure utility functions safe to import in client components

export function normalizeForWhatsApp(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (!digits) return "";
  if (digits.length <= 11) return "55" + digits;
  return digits;
}

export function buildWhatsAppInviteUrl(phone: string, inviteUrl: string): string {
  const norm = normalizeForWhatsApp(phone);
  if (!norm) return "";
  const text = encodeURIComponent(
    `Ola! Voce foi convidado para acessar o Zap Faturamento.\n\nClique no link abaixo para entrar:\n${inviteUrl}\n\nEsse link expira em 48 horas.`
  );
  return `https://wa.me/${norm}?text=${text}`;
}

export function buildWhatsAppMagicUrl(phone: string, magicUrl: string): string {
  const norm = normalizeForWhatsApp(phone);
  if (!norm) return "";
  const text = encodeURIComponent(
    `Ola! Aqui esta seu link de acesso ao Zap Faturamento (valido por 15 minutos):\n\n${magicUrl}`
  );
  return `https://wa.me/${norm}?text=${text}`;
}
