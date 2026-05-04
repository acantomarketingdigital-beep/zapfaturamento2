import { NextResponse } from "next/server";
import { getSafeDashboardRedirect } from "@/lib/app-url";
import { getCurrentUser, isAgencyAdmin } from "@/lib/dashboard-auth";
import { deleteManagedClinic } from "@/lib/clinics";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.redirect(new URL("/login", request.url), 303);
  }

  const formData = await request.formData();
  const redirectPath = getSafeDashboardRedirect(
    formData.get("redirectTo"),
    "/dashboard/clinicas"
  );

  if (!isAgencyAdmin(user)) {
    const redirectUrl = new URL(redirectPath, request.url);
    redirectUrl.searchParams.set("status", "error");
    redirectUrl.searchParams.set(
      "message",
      "Apenas agency_admin pode remover clientes."
    );
    return NextResponse.redirect(redirectUrl, 303);
  }

  try {
    const slug = String(formData.get("slug") || "");

    await deleteManagedClinic(slug);

    const redirectUrl = new URL(redirectPath, request.url);
    redirectUrl.searchParams.set("status", "deleted");

    return NextResponse.redirect(redirectUrl, 303);
  } catch (error) {
    const redirectUrl = new URL(redirectPath, request.url);

    redirectUrl.searchParams.set("status", "error");
    redirectUrl.searchParams.set(
      "message",
      error instanceof Error ? error.message : "Falha ao remover o cliente."
    );

    return NextResponse.redirect(redirectUrl, 303);
  }
}
