import { NextResponse } from "next/server";
import { getCurrentUser, isAgencyAdmin } from "@/lib/dashboard-auth";
import { resendInvite } from "@/lib/invites";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const user = await getCurrentUser();

  if (!user || !isAgencyAdmin(user)) {
    return NextResponse.redirect(new URL("/dashboard/usuarios", request.url), 303);
  }

  const formData = await request.formData();
  const userId = String(formData.get("userId") || "").trim();

  if (!userId) {
    return NextResponse.redirect(new URL("/dashboard/usuarios", request.url), 303);
  }

  try {
    const { inviteUrl } = await resendInvite(userId);

    const redirect = new URL("/dashboard/usuarios", request.url);
    redirect.searchParams.set("resendUrl", inviteUrl);
    return NextResponse.redirect(redirect, 303);
  } catch (err) {
    const redirect = new URL("/dashboard/usuarios", request.url);
    redirect.searchParams.set("resendError", err instanceof Error ? err.message : "Erro ao reenviar convite.");
    return NextResponse.redirect(redirect, 303);
  }
}
