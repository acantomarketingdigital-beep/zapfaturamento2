import { NextResponse } from "next/server";
import { activateAccount } from "@/lib/invites";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const formData = await request.formData();
  const token = String(formData.get("token") || "").trim();
  const password = String(formData.get("password") || "").trim();
  const confirmPassword = String(formData.get("confirmPassword") || "").trim();

  const base = new URL(request.url);
  const redirectBase = `/ativar?token=${encodeURIComponent(token)}`;

  if (password !== confirmPassword) {
    return NextResponse.redirect(
      new URL(`${redirectBase}&error=${encodeURIComponent("As senhas nao conferem.")}`, base),
      303
    );
  }

  const result = await activateAccount(token, password);

  if (!result.ok) {
    return NextResponse.redirect(
      new URL(`${redirectBase}&error=${encodeURIComponent(result.error ?? "Erro ao ativar.")}`, base),
      303
    );
  }

  return NextResponse.redirect(new URL("/ativar?success=1", base), 303);
}
