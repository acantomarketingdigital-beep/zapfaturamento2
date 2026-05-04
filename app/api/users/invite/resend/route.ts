import { NextResponse } from "next/server";
import { getCurrentUser, isAgencyAdmin } from "@/lib/dashboard-auth";
import { resendInvite } from "@/lib/invites";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user || !isAgencyAdmin(user)) {
    return NextResponse.json({ error: "Sem permissao." }, { status: 403 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Body invalido." }, { status: 400 });
  }

  const userId = String(body.userId || "").trim();
  if (!userId) return NextResponse.json({ error: "userId obrigatorio." }, { status: 400 });

  try {
    const { inviteUrl, phone } = await resendInvite(userId);
    return NextResponse.json({ inviteUrl, phone });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erro ao reenviar." },
      { status: 400 }
    );
  }
}
