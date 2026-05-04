import { NextResponse } from "next/server";
import {
  createAppUser,
  authenticateAppUser,
  createDashboardLoginResponse,
} from "@/lib/dashboard-auth";
import { hasDatabaseConfig } from "@/lib/db";

export const runtime = "nodejs";

function redirectErr(base: string, msg: string) {
  return NextResponse.redirect(
    new URL(`/register?error=${encodeURIComponent(msg)}`, base),
    303
  );
}

export async function POST(request: Request) {
  const base = new URL(request.url).origin;

  if (!hasDatabaseConfig()) {
    return redirectErr(base, "Sistema não configurado. Tente novamente em instantes.");
  }

  let name: string, email: string, password: string, agencyName: string;
  try {
    const fd = await request.formData();
    name       = String(fd.get("name")        || "").trim();
    email      = String(fd.get("email")       || "").trim().toLowerCase();
    password   = String(fd.get("password")    || "").trim();
    agencyName = String(fd.get("agency_name") || "").trim();
  } catch {
    return redirectErr(base, "Erro ao ler os dados do formulário.");
  }

  if (!name)       return redirectErr(base, "Informe seu nome completo.");
  if (!email)      return redirectErr(base, "Informe um e-mail válido.");
  if (!agencyName) return redirectErr(base, "Informe o nome da sua agência ou empresa.");
  if (password.length < 6) return redirectErr(base, "A senha precisa ter pelo menos 6 caracteres.");

  try {
    await createAppUser({
      email,
      password,
      role: "agency_admin",
      name,
      agencyName,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Erro ao criar conta.";
    // Friendly message for duplicate email
    if (msg.toLowerCase().includes("conflict") || msg.toLowerCase().includes("duplicate") || msg.toLowerCase().includes("already")) {
      return redirectErr(base, "Este e-mail já está cadastrado. Faça login.");
    }
    return redirectErr(base, msg);
  }

  // Immediately authenticate and set session cookie
  const session = await authenticateAppUser(email, password);
  if (!session) {
    // User created but login failed — send to login page
    return NextResponse.redirect(new URL("/login?registered=1", base), 303);
  }

  return createDashboardLoginResponse(session, "/dashboard", request.url);
}
