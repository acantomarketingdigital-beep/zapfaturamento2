import { getCurrentUser } from "@/lib/dashboard-auth";
import { NextResponse } from "next/server";

const TIPO_LABELS: Record<string, string> = {
  duvida: "Duvida",
  problema: "Problema tecnico",
  sugestao: "Sugestao",
  financeiro: "Financeiro"
};

export async function POST(request: Request) {
  const sessionUser = await getCurrentUser();

  const formData = await request.formData();
  const type = (formData.get("type") as string | null) ?? "duvida";
  const message = (formData.get("message") as string | null) ?? "";
  const formEmail = (formData.get("userEmail") as string | null) ?? "";
  const attachment = formData.get("attachment") as File | null;

  const senderEmail = sessionUser?.email ?? formEmail ?? "desconhecido";
  const tipoLabel = TIPO_LABELS[type] ?? type;
  const now = new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });

  const resendKey = process.env.RESEND_API_KEY;
  const supportTo = process.env.SUPPORT_EMAIL_TO ?? "suporte@zapfaturamento.com.br";

  if (!resendKey) {
    console.log("[support] RESEND_API_KEY nao configurado. Ticket recebido:", {
      from: senderEmail,
      type: tipoLabel,
      message,
      date: now
    });
    return NextResponse.json({ ok: true });
  }

  let attachments: Array<{ filename: string; content: string }> = [];
  if (attachment && attachment.size > 0) {
    const bytes = await attachment.arrayBuffer();
    const base64 = Buffer.from(bytes).toString("base64");
    attachments = [{ filename: attachment.name, content: base64 }];
  }

  const html = `
    <h2>Nova solicitacao de suporte</h2>
    <table cellpadding="6" style="border-collapse:collapse;font-family:sans-serif;font-size:14px;">
      <tr><td><strong>Usuario:</strong></td><td>${senderEmail}</td></tr>
      <tr><td><strong>Tipo:</strong></td><td>${tipoLabel}</td></tr>
      <tr><td><strong>Data:</strong></td><td>${now}</td></tr>
    </table>
    <hr/>
    <p style="white-space:pre-wrap">${message}</p>
  `;

  const body = {
    from: "ZapFaturamento Suporte <suporte@zapfaturamento.com.br>",
    to: [supportTo],
    reply_to: senderEmail !== "desconhecido" ? senderEmail : undefined,
    subject: `[Suporte] ${tipoLabel} — ${senderEmail}`,
    html,
    ...(attachments.length > 0 ? { attachments } : {})
  };

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });

  if (!res.ok) {
    const err = await res.text();
    console.error("[support] Resend error:", err);
  }

  return NextResponse.json({ ok: true });
}
