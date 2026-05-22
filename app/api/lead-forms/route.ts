import { NextResponse } from "next/server";
import { getCurrentUser, isAgencyAdmin } from "@/lib/dashboard-auth";
import { canAccessClient } from "@/lib/dashboard-auth";
import { getUserPermissions } from "@/lib/permissions";
import { listLeadForms, saveLeadForm, MAX_FORMS_PER_CLIENT, type CustomQuestion } from "@/lib/lead-forms";
import { slugifyClinicName } from "@/lib/clinic-shared";
import { getCachedBillingStatus } from "@/lib/billing";
import { checkFormLimit } from "@/lib/billing-usage";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Nao autenticado." }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const clientSlug = searchParams.get("clientSlug") || "";

  if (!clientSlug) return NextResponse.json({ error: "clientSlug obrigatorio." }, { status: 400 });
  if (!(await canAccessClient(user, clientSlug))) {
    return NextResponse.json({ error: "Sem permissao." }, { status: 403 });
  }

  const forms = await listLeadForms(clientSlug);
  return NextResponse.json({ forms, limit: MAX_FORMS_PER_CLIENT });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Nao autenticado." }, { status: 401 });

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Body invalido." }, { status: 400 });
  }

  const clientSlug = String(body.clientSlug || "").trim();
  if (!clientSlug) return NextResponse.json({ error: "clientSlug obrigatorio." }, { status: 400 });
  if (!(await canAccessClient(user, clientSlug))) {
    return NextResponse.json({ error: "Sem permissao." }, { status: 403 });
  }

  const perms = await getUserPermissions(user.id, user.role);
  if (!perms.formularios_create && !isAgencyAdmin(user)) {
    return NextResponse.json({ error: "Sem permissao para criar formularios." }, { status: 403 });
  }

  // Workspace-level form limit check (skip for env_admin)
  if (user.kind !== "env_admin") {
    try {
      const billing = await getCachedBillingStatus(user.id);
      const planKey = billing?.subscriptionPlan ?? null;
      const { allowed } = await checkFormLimit(user.clientSlug, planKey);
      if (!allowed) {
        return NextResponse.json(
          {
            error:
              "Você atingiu a quantidade de formulários Lead Express incluídos no seu plano. Adicione formulários extras ou faça upgrade para continuar.",
          },
          { status: 403 }
        );
      }
    } catch {
      // fail-open: never block on billing check error
    }
  }

  const name = String(body.name || "").trim();
  const rawSlug = String(body.slug || "").trim();
  const slug = rawSlug || slugifyClinicName(name);

  try {
    const form = await saveLeadForm({
      clientSlug,
      name,
      slug,
      title: String(body.title || "").trim(),
      subtitle: String(body.subtitle || "").trim(),
      buttonText: String(body.buttonText || "Enviar").trim() || "Enviar",
      logoUrl: String(body.logoUrl || "").trim() || null,
      imageUrl: String(body.imageUrl || "").trim() || null,
      primaryColor: String(body.primaryColor || "#16a34a").trim() || "#16a34a",
      backgroundColor: String(body.backgroundColor || "#f0fdf4").trim() || "#f0fdf4",
      status: body.status === "inactive" ? "inactive" : "active",
      successMessage: String(
        body.successMessage || "Cadastro enviado! Nossa equipe entrara em contato em breve."
      ).trim(),
      showEmail: Boolean(body.showEmail),
      showProcedure: Boolean(body.showProcedure),
      showCity: Boolean(body.showCity),
      showObservation: Boolean(body.showObservation),
      campaignSource: String(body.campaignSource || "direct"),
      seoKeywords: Array.isArray(body.seoKeywords) ? (body.seoKeywords as string[]) : [],
      seoLocations: Array.isArray(body.seoLocations) ? (body.seoLocations as string[]) : [],
      seoTitle: body.seoTitle ? String(body.seoTitle).trim() || null : null,
      seoDescription: body.seoDescription ? String(body.seoDescription).trim() || null : null,
      seoBullets: Array.isArray(body.seoBullets) ? (body.seoBullets as string[]).filter(Boolean) : null,
      customQuestions: Array.isArray(body.customQuestions) ? (body.customQuestions as CustomQuestion[]) : [],
    });
    return NextResponse.json({ form }, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erro ao criar formulario." },
      { status: 400 }
    );
  }
}
