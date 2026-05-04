import { NextResponse } from "next/server";
import { createDashboardLoginResponse, type AppSession } from "@/lib/dashboard-auth";
import { acceptInvitePasswordless } from "@/lib/invites";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const formData = await request.formData();
  const token = String(formData.get("token") || "").trim();
  const name = String(formData.get("name") || "").trim();

  if (!token) {
    return NextResponse.redirect(new URL("/login?error=magic_invalid", request.url), 303);
  }

  const result = await acceptInvitePasswordless(token, name || undefined);

  if (!result.ok || !result.session) {
    return NextResponse.redirect(
      new URL(`/invite/${encodeURIComponent(token)}?error=${encodeURIComponent(result.error ?? "Erro desconhecido.")}`, request.url),
      303
    );
  }

  const session: AppSession = {
    kind: "user",
    id: result.session.id,
    email: result.session.email,
    role: result.session.role as AppSession["role"],
    clientSlug: result.session.clientSlug
  };

  return createDashboardLoginResponse(session, "/dashboard", request.url);
}
