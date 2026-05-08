import { NextResponse } from "next/server";
import { getSafeDashboardRedirect } from "@/lib/app-url";
import { getCurrentUser, isAgencyAdmin } from "@/lib/dashboard-auth";
import { parseClinicFormData, saveClinic } from "@/lib/clinics";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.redirect(new URL("/login", request.url), 303);
  }

  const formData = await request.formData();
  const fallback = getSafeDashboardRedirect(
    formData.get("redirectTo"),
    "/dashboard/clinicas"
  );

  if (!isAgencyAdmin(user)) {
    const redirectUrl = new URL(fallback, request.url);
    redirectUrl.searchParams.set("status", "error");
    redirectUrl.searchParams.set(
      "message",
      "Apenas agency_admin pode salvar clientes."
    );
    return NextResponse.redirect(redirectUrl, 303);
  }

  try {
    const intent = String(formData.get("intent") || "save");
    const input = parseClinicFormData(formData);
    const clinic = await saveClinic(input, user.clientSlug ?? null);
    const redirectPath =
      intent === "save-copy"
        ? `/dashboard/clinicas/${encodeURIComponent(clinic.clientSlug)}?copy=base`
        : `/dashboard/clinicas/${encodeURIComponent(clinic.clientSlug)}`;
    const redirectUrl = new URL(redirectPath, request.url);

    redirectUrl.searchParams.set("status", "saved");

    return NextResponse.redirect(redirectUrl, 303);
  } catch (error) {
    const redirectUrl = new URL(fallback, request.url);

    redirectUrl.searchParams.set("status", "error");
    redirectUrl.searchParams.set(
      "message",
      error instanceof Error ? error.message : "Falha ao salvar o cliente."
    );

    return NextResponse.redirect(redirectUrl, 303);
  }
}
