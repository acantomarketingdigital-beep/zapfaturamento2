import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/dashboard-auth";
import { setLeadFollowUp } from "@/lib/kanban";
import { hasDatabaseConfig } from "@/lib/db";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: RouteContext) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Nao autenticado." }, { status: 401 });
  if (!hasDatabaseConfig()) return NextResponse.json({ error: "DB nao configurado." }, { status: 503 });

  const { id } = await params;
  const leadId = parseInt(id, 10);
  if (isNaN(leadId)) return NextResponse.json({ error: "ID invalido." }, { status: 400 });

  const body = (await request.json()) as {
    followUpAt?: string | null;
    followUpNote?: string | null;
    followUpDone?: boolean;
  };

  await setLeadFollowUp(leadId, {
    followUpAt: body.followUpAt,
    followUpNote: body.followUpNote,
    followUpDone: body.followUpDone,
    scopeClientSlug: user.clientSlug,
  });
  return NextResponse.json({ ok: true });
}
