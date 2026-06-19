import { NextResponse } from "next/server";
import { toggleSmsBlast } from "@/lib/sms-blasts";
import { canAccessClient, getCurrentUser } from "@/lib/dashboard-auth";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Ctx) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Nao autenticado." }, { status: 401 });

  const { id } = await params;
  const body = await request.json() as Record<string, unknown>;
  const { clientSlug, isActive } = body;

  if (typeof clientSlug !== "string" || !clientSlug)
    return NextResponse.json({ error: "clientSlug e obrigatorio." }, { status: 400 });
  if (!(await canAccessClient(user, clientSlug)))
    return NextResponse.json({ error: "Sem permissao." }, { status: 403 });

  const blast = await toggleSmsBlast(id, clientSlug, isActive === true);
  return NextResponse.json({ blast });
}
