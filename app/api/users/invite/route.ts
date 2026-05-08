import { NextResponse } from "next/server";
import { getCurrentUser, isAgencyAdmin } from "@/lib/dashboard-auth";
import { createInvite, type UserPermissions } from "@/lib/invites";

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

  const name = String(body.name || "").trim() || null;
  const email = String(body.email || "").trim();
  const role = String(body.role || "client_owner");
  const rawClientSlug = String(body.clientSlug || "").trim() || null;
  const phone = String(body.phone || "").trim() || null;

  // Scoped users can only invite into their own workspace
  const clientSlug = user.clientSlug !== null ? user.clientSlug : rawClientSlug;
  const permissions = (body.permissions ?? {}) as Partial<UserPermissions>;

  try {
    const { inviteUrl, phone: savedPhone } = await createInvite({
      name, email, role, clientSlug, permissions, phone
    });
    return NextResponse.json({ inviteUrl, phone: savedPhone });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erro ao criar convite." },
      { status: 400 }
    );
  }
}
