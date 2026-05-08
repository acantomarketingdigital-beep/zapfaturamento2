import { NextResponse } from "next/server";
import { getCurrentUser, isAgencyAdmin } from "@/lib/dashboard-auth";
import { createInvite, type UserPermissions } from "@/lib/invites";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const user = await getCurrentUser();

  if (!user || (!isAgencyAdmin(user) && user.clientSlug !== null)) {
    return NextResponse.redirect(new URL("/dashboard/usuarios", request.url), 303);
  }

  const formData = await request.formData();
  const email = String(formData.get("email") || "").trim();
  const role = String(formData.get("role") || "client_owner");
  const rawClientSlug = String(formData.get("clientSlug") || "").trim() || null;

  // Scoped users can only invite into their own workspace
  const clientSlug =
    user.clientSlug !== null ? user.clientSlug : rawClientSlug;
  const phone = String(formData.get("phone") || "").trim() || null;

  const permKeys: (keyof UserPermissions)[] = [
    "dashboard", "kanban", "performance", "relatorio", "criativos",
    "investimentos", "exportar", "clientes", "usuarios", "conexoes",
    "campanhas_view", "campanhas_create", "campanhas_edit",
    "criativos_view", "criativos_create", "criativos_edit",
    "grupos_view", "grupos_create", "grupos_edit",
    "disparos",
  ];
  const permissions: Partial<UserPermissions> = {};
  for (const key of permKeys) {
    permissions[key] = formData.get(`perm_${key}`) === "1";
  }

  try {
    const { inviteUrl } = await createInvite({
      email,
      role,
      clientSlug,
      permissions,
      phone
    });

    const redirect = new URL("/dashboard/usuarios", request.url);
    redirect.searchParams.set("inviteUrl", inviteUrl);
    return NextResponse.redirect(redirect, 303);
  } catch {
    return NextResponse.redirect(new URL("/dashboard/usuarios", request.url), 303);
  }
}
