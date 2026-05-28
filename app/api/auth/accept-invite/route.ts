import { NextResponse } from "next/server";
import { createDashboardLoginResponse, type AppSession } from "@/lib/dashboard-auth";
import { acceptInviteWithCredentials } from "@/lib/invites";

export const runtime = "nodejs";

function redirectErr(base: string, token: string, msg: string) {
  return NextResponse.redirect(
    new URL(`/invite/${encodeURIComponent(token)}?error=${encodeURIComponent(msg)}`, base),
    303
  );
}

export async function POST(request: Request) {
  const base = new URL(request.url).origin;
  const formData = await request.formData();
  const token    = String(formData.get("token")    || "").trim();
  const name     = String(formData.get("name")     || "").trim();
  const password = String(formData.get("password") || "").trim();
  const phone    = String(formData.get("phone")    || "").trim();
  const cpfCnpj  = String(formData.get("cpf_cnpj") || "").replace(/\D/g, "");

  if (!token) {
    return NextResponse.redirect(new URL("/login?error=magic_invalid", base), 303);
  }

  if (!password || password.length < 6) {
    return redirectErr(base, token, "Crie uma senha com pelo menos 6 caracteres.");
  }

  if (!phone || phone.replace(/\D/g, "").length < 10) {
    return redirectErr(base, token, "Informe seu celular com DDD.");
  }

  if (!cpfCnpj || (cpfCnpj.length !== 11 && cpfCnpj.length !== 14)) {
    return redirectErr(base, token, "Informe um CPF (11 dígitos) ou CNPJ (14 dígitos) válido.");
  }

  const result = await acceptInviteWithCredentials(token, { name, password, phone, cpfCnpj });

  if (!result.ok || !result.session) {
    return redirectErr(base, token, result.error ?? "Erro desconhecido.");
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
