import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/dashboard-auth";
import { updateLeadStatus } from "@/lib/kanban";
import { normalizeLeadStatus } from "@/lib/kanban-shared";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ success: false, error: "Nao autenticado." }, { status: 401 });
  }

  const body = (await request.json()) as {
    leadId?: number;
    status?: string;
    paidAmountCents?: number | null;
    leadEmail?: string | null;
    leadName?: string | null;
  };

  if (!body.leadId || !body.status) {
    return NextResponse.json({ success: false, error: "Dados invalidos." }, { status: 400 });
  }

  await updateLeadStatus(body.leadId, normalizeLeadStatus(body.status), {
    paidAmountCents: body.paidAmountCents ?? null,
    scopeClientSlug: user.clientSlug,
    leadEmail: body.leadEmail ?? null,
    leadName: body.leadName ?? null,
    changedBy: user.email
  });

  return NextResponse.json({ success: true });
}
