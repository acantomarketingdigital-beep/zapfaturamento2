import { NextResponse } from "next/server";
import { getCurrentUser, isAgencyAdmin, canAccessClient } from "@/lib/dashboard-auth";
import { getLeadFormById, saveLeadForm, deleteLeadForm, toggleLeadFormStatus } from "@/lib/lead-forms";
import { slugifyClinicName } from "@/lib/clinic-shared";

export const runtime = "nodejs";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: RouteParams) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Nao autenticado." }, { status: 401 });

  const { id } = await params;
  const form = await getLeadFormById(id);
  if (!form) return NextResponse.json({ error: "Formulario nao encontrado." }, { status: 404 });
  if (!(await canAccessClient(user, form.clientSlug))) {
    return NextResponse.json({ error: "Sem permissao." }, { status: 403 });
  }

  return NextResponse.json({ form });
}

export async function PATCH(request: Request, { params }: RouteParams) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Nao autenticado." }, { status: 401 });

  const { id } = await params;
  const form = await getLeadFormById(id);
  if (!form) return NextResponse.json({ error: "Formulario nao encontrado." }, { status: 404 });
  if (!(await canAccessClient(user, form.clientSlug))) {
    return NextResponse.json({ error: "Sem permissao." }, { status: 403 });
  }

  // Toggle only
  const url = new URL(request.url);
  if (url.pathname.endsWith("/toggle")) {
    const updated = await toggleLeadFormStatus(id, form.clientSlug);
    return NextResponse.json({ form: updated });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Body invalido." }, { status: 400 });
  }

  const name = String(body.name || form.name).trim();
  const rawSlug = String(body.slug || "").trim();
  const slug = rawSlug || slugifyClinicName(name);

  try {
    const updated = await saveLeadForm(
      {
        clientSlug: form.clientSlug,
        name,
        slug,
        title: String(body.title ?? form.title).trim(),
        subtitle: String(body.subtitle ?? form.subtitle).trim(),
        buttonText: String(body.buttonText ?? form.buttonText).trim() || "Enviar",
        logoUrl: body.logoUrl !== undefined ? (String(body.logoUrl).trim() || null) : form.logoUrl,
        imageUrl: body.imageUrl !== undefined ? (String(body.imageUrl).trim() || null) : form.imageUrl,
        primaryColor: String(body.primaryColor ?? form.primaryColor).trim() || "#16a34a",
        backgroundColor: String(body.backgroundColor ?? form.backgroundColor).trim() || "#f0fdf4",
        status: body.status === "inactive" ? "inactive" : body.status === "active" ? "active" : form.status,
        successMessage: String(body.successMessage ?? form.successMessage).trim(),
        showEmail: body.showEmail !== undefined ? Boolean(body.showEmail) : form.showEmail,
        showProcedure: body.showProcedure !== undefined ? Boolean(body.showProcedure) : form.showProcedure,
        showCity: body.showCity !== undefined ? Boolean(body.showCity) : form.showCity,
        showObservation: body.showObservation !== undefined ? Boolean(body.showObservation) : form.showObservation,
      },
      id
    );
    return NextResponse.json({ form: updated });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erro ao salvar formulario." },
      { status: 400 }
    );
  }
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Nao autenticado." }, { status: 401 });
  if (!isAgencyAdmin(user)) return NextResponse.json({ error: "Sem permissao." }, { status: 403 });

  const { id } = await params;
  const form = await getLeadFormById(id);
  if (!form) return NextResponse.json({ error: "Formulario nao encontrado." }, { status: 404 });
  if (!(await canAccessClient(user, form.clientSlug))) {
    return NextResponse.json({ error: "Sem permissao." }, { status: 403 });
  }

  const deleted = await deleteLeadForm(id, form.clientSlug);
  if (!deleted) return NextResponse.json({ error: "Nao foi possivel remover." }, { status: 400 });
  return NextResponse.json({ ok: true });
}
