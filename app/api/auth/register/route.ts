import { NextResponse } from "next/server";
import {
  createAppUser,
  authenticateAppUser,
  createDashboardLoginResponse,
} from "@/lib/dashboard-auth";
import { hasDatabaseConfig, queryDb } from "@/lib/db";

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

  let name: string, email: string, password: string, agencyName: string, plan: string, phone: string, cpfCnpj: string;
  try {
    const fd = await request.formData();
    name       = String(fd.get("name")        || "").trim();
    email      = String(fd.get("email")       || "").trim().toLowerCase();
    password   = String(fd.get("password")    || "").trim();
    agencyName = String(fd.get("agency_name") || "").trim();
    plan       = String(fd.get("plan")        || "").trim().toLowerCase();
    phone      = String(fd.get("phone")       || "").trim();
    cpfCnpj    = String(fd.get("cpf_cnpj")    || "").replace(/\D/g, "");
  } catch {
    return redirectErr(base, "Erro ao ler os dados do formulário.");
  }

  if (!name)       return redirectErr(base, "Informe seu nome completo.");
  if (!email)      return redirectErr(base, "Informe um e-mail válido.");
  if (!agencyName) return redirectErr(base, "Informe o nome da sua agência ou empresa.");
  if (!phone || phone.replace(/\D/g, "").length < 10) return redirectErr(base, "Informe um celular válido com DDD.");
  if (!cpfCnpj || (cpfCnpj.length !== 11 && cpfCnpj.length !== 14)) return redirectErr(base, "Informe um CPF (11 dígitos) ou CNPJ (14 dígitos) válido.");
  if (password.length < 6) return redirectErr(base, "A senha precisa ter pelo menos 6 caracteres.");

  const isCrmSignup = plan === "crm";

  try {
    await createAppUser({
      email,
      password,
      role: "agency_admin",
      name,
      agencyName,
      phone,
      cpfCnpj,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Erro ao criar conta.";
    // Friendly message for duplicate email
    if (msg.toLowerCase().includes("conflict") || msg.toLowerCase().includes("duplicate") || msg.toLowerCase().includes("already")) {
      return redirectErr(base, "Este e-mail já está cadastrado. Faça login.");
    }
    return redirectErr(base, msg);
  }

  // CRM signup: tag user with subscription_plan = 'crm'
  if (isCrmSignup) {
    try {
      await queryDb(
        `UPDATE users SET subscription_plan = 'crm' WHERE LOWER(email) = $1`,
        [email]
      );
    } catch {
      // non-blocking — trial still works even without this
    }
  }

  // Immediately authenticate and set session cookie
  const session = await authenticateAppUser(email, password);
  if (!session) {
    // User created but login failed — send to login page
    return NextResponse.redirect(new URL("/login?registered=1", base), 303);
  }

  // CRM users land on Kanban — their primary workspace
  const redirectTo = isCrmSignup ? "/dashboard/kanban" : "/dashboard";
  return createDashboardLoginResponse(session, redirectTo, request.url);
}
