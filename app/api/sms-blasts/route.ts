import { NextResponse } from "next/server";
import { listSmsBlasts, saveSmsBlast, type SmsBlastInput } from "@/lib/sms-blasts";
import { canAccessClient, getCurrentUser } from "@/lib/dashboard-auth";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Nao autenticado." }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const clientSlug = searchParams.get("clientSlug") || "";
  if (!clientSlug) return NextResponse.json({ error: "clientSlug e obrigatorio." }, { status: 400 });
  if (!(await canAccessClient(user, clientSlug))) return NextResponse.json({ error: "Sem permissao." }, { status: 403 });

  const blasts = await listSmsBlasts(clientSlug);
  return NextResponse.json({ blasts });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Nao autenticado." }, { status: 401 });

  try {
    const body = await request.json() as Record<string, unknown>;
    const { clientSlug, name, promoImageAspect, promoTitle, promoDescription,
            smsTemplate, ctaText, whatsappNumber, whatsappMessage } = body;

    if (typeof clientSlug !== "string" || !clientSlug)
      return NextResponse.json({ error: "clientSlug e obrigatorio." }, { status: 400 });
    if (!(await canAccessClient(user, clientSlug)))
      return NextResponse.json({ error: "Sem permissao." }, { status: 403 });

    const input: SmsBlastInput = {
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
    return NextResponse.json({ blast }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Erro ao criar promo." }, { status: 400 });
  }
}
