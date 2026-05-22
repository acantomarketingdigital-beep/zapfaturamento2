import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { getLeadFormBySlug, createFormSubmission, insertFormLeadToWhatsappLeads } from "@/lib/lead-forms";
import { getClinicBackendConfigBySlug } from "@/lib/clinics";
import { sendMetaCapiEvent } from "@/lib/meta-capi";
import { buildMetaFbc, buildMetaExternalId } from "@/lib/meta-capi";
import { hasDatabaseConfig } from "@/lib/db";

export const runtime = "nodejs";

function normalizePhone(raw: string): string {
  return raw.replace(/\D/g, "");
}

function getClientIp(headersList: Awaited<ReturnType<typeof headers>>): string {
  return (
    headersList.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    headersList.get("x-real-ip") ||
    ""
  );
}

export async function POST(request: Request) {
  if (!hasDatabaseConfig()) {
    return NextResponse.json({ error: "Servico indisponivel." }, { status: 503 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Body invalido." }, { status: 400 });
  }

  const clientSlug = String(body.clientSlug || "").trim();
  const formSlug   = String(body.formSlug   || "").trim();
  const leadName   = String(body.leadName   || "").trim();
  const rawPhone   = String(body.leadPhone  || "").trim();

  if (!clientSlug || !formSlug)  return NextResponse.json({ error: "Formulario invalido." },    { status: 400 });
  if (!leadName)                 return NextResponse.json({ error: "Nome obrigatorio." },        { status: 400 });
  if (!rawPhone)                 return NextResponse.json({ error: "WhatsApp obrigatorio." },   { status: 400 });

  const leadPhone = normalizePhone(rawPhone);
  if (leadPhone.length < 10)    return NextResponse.json({ error: "WhatsApp invalido." },       { status: 400 });

  const [form, client] = await Promise.all([
    getLeadFormBySlug(clientSlug, formSlug),
    getClinicBackendConfigBySlug(clientSlug),
  ]);

  if (!form || !client) return NextResponse.json({ error: "Formulario nao encontrado." }, { status: 404 });

  const headersList = await headers();
  const ipAddress   = getClientIp(headersList);
  const userAgent   = headersList.get("user-agent") || "";

  const utmSource   = String(body.utmSource   || "").trim() || undefined;
  const utmMedium   = String(body.utmMedium   || "").trim() || undefined;
  const utmCampaign = String(body.utmCampaign || "").trim() || undefined;
  const utmContent  = String(body.utmContent  || "").trim() || undefined;
  const utmTerm     = String(body.utmTerm     || "").trim() || undefined;
  const fbclid      = String(body.fbclid      || "").trim() || undefined;
  const gclid       = String(body.gclid       || "").trim() || undefined;
  const fbp         = String(body.fbp         || "").trim() || undefined;
  const pageUrl     = String(body.pageUrl     || "").trim() || `https://zapfaturamento.com.br/f/${clientSlug}/${formSlug}`;

  const leadEmail     = form.showEmail     ? String(body.leadEmail     || "").trim() || undefined : undefined;
  const leadProcedure = form.showProcedure ? String(body.leadProcedure || "").trim() || undefined : undefined;
  const leadCity      = form.showCity      ? String(body.leadCity      || "").trim() || undefined : undefined;
  const leadObservation = form.showObservation ? String(body.leadObservation || "").trim() || undefined : undefined;

  const rawAnswers = body.customAnswers;
  const customAnswers =
    rawAnswers && typeof rawAnswers === "object" && !Array.isArray(rawAnswers)
      ? (rawAnswers as Record<string, string>)
      : undefined;

  // Insert into whatsapp_leads
  const whatsappLeadId = await insertFormLeadToWhatsappLeads({
    clientSlug,
    clientName: client.clientName,
    clientWhatsappNumber: client.whatsappNumber || "",
    leadName,
    leadPhone,
    leadEmail,
    pageUrl,
    utmSource,
    utmMedium,
    utmCampaign,
    utmContent,
    utmTerm,
    fbclid,
    gclid,
    userAgent,
  });

  // Insert into lead_form_submissions
  await createFormSubmission({
    formId: form.id,
    clientSlug,
    leadName,
    leadPhone,
    leadEmail,
    leadProcedure,
    leadCity,
    leadObservation,
    customAnswers,
    whatsappLeadId,
    utmSource,
    utmMedium,
    utmCampaign,
    utmContent,
    utmTerm,
    fbclid,
    gclid,
    fbp,
    fbc: fbclid ? buildMetaFbc(fbclid) : undefined,
    ipAddress,
    userAgent,
    pageUrl,
  });

  // Fire Meta CAPI Lead event (fire-and-forget)
  const metaToken = "metaCapiAccessToken" in client ? client.metaCapiAccessToken : undefined;
  if (client.metaPixelId && metaToken) {
    const eventId = `form-${form.id}-${Date.now()}`;
    const fbc = fbclid ? buildMetaFbc(fbclid) : undefined;

    sendMetaCapiEvent({
      pixelId: client.metaPixelId,
      accessToken: metaToken,
      eventName: "Lead",
      eventId,
      eventTime: Math.floor(Date.now() / 1000),
      actionSource: "website",
      eventSourceUrl: pageUrl,
      userData: {
        client_ip_address: ipAddress || undefined,
        client_user_agent: userAgent || undefined,
        fbc: fbc || undefined,
        fbp: fbp || undefined,
        ph: leadPhone ? buildMetaExternalId(leadPhone) : undefined,
        em: leadEmail ? buildMetaExternalId(leadEmail) : undefined,
      },
      customData: {
        lead_event_source: "Lead Express",
        form_name: form.name,
        content_name: utmCampaign || form.name,
      },
    }).catch(() => {});
  }

  return NextResponse.json({ ok: true });
}
