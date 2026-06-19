import { NextResponse } from "next/server";
import { deleteSmsBlast, saveSmsBlast, type SmsBlastInput } from "@/lib/sms-blasts";
import { canAccessClient, getCurrentUser } from "@/lib/dashboard-auth";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }> };

export async function PUT(request: Request, { params }: Ctx) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Nao autenticado." }, { status: 401 });

  const { id } = await params;
  try {
    const body = await request.json() as Record<string, unknown>;
    const { clientSlug, name, promoImageAspect, promoTitle, promoDescription,
            smsTemplate, ctaText, whatsappNumber, whatsappMessage } = body;

    if (typeof clientSlug !== "string" || !clientSlug)
      return NextResponse.json({ error: "clientSlug e obrigatorio." }, { status: 400 });
    if (!(await canAccessClient(user, clientSlug)))
      return NextResponse.json({ error: "Sem permissao." }, { status: 403 });

    const input: SmsBlastInput = {
      id,
      clientSlug,
      name: typeof name === "string" ? name : "",
      promoImageAspect: typeof promoImageAspect === "string" ? promoImageAspect as import("@/lib/sms-blasts").PromoAspect : "1:1",
      promoTitle: typeof promoTitle === "string" ? promoTitle : null,
      promoDescription: typeof promoDescription === "string" ? promoDescription : null,
      smsTemplate: typeof smsTemplate === "string" ? smsTemplate : null,
      ctaText: typeof ctaText === "string" ? ctaText : "Saiba mais",
      whatsappNumber: typeof whatsappNumber === "string" ? whatsappNumber : "",
      whatsappMessage: typeof whatsappMessage === "string" ? whatsappMessage : "Vim da promoção",
    };

    const blast = await saveSmsBlast(input);
    return NextResponse.json({ blast });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Erro ao atualizar." }, { status: 400 });
  }
}

export async function DELETE(request: Request, { params }: Ctx) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Nao autenticado." }, { status: 401 });

  const { id } = await params;
  try {
    const body = await request.json() as Record<string, unknown>;
    const { clientSlug } = body;
    if (typeof clientSlug !== "string" || !clientSlug)
      return NextResponse.json({ error: "clientSlug e obrigatorio." }, { status: 400 });
    if (!(await canAccessClient(user, clientSlug)))
      return NextResponse.json({ error: "Sem permissao." }, { status: 403 });

    await deleteSmsBlast(id, clientSlug);
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Erro ao remover." }, { status: 400 });
  }
}
