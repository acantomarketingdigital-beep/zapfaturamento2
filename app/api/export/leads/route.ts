import { NextResponse } from "next/server";
import { canAccessClient, getCurrentUser } from "@/lib/dashboard-auth";
import { generateMetaCsv, getExportableLeads } from "@/lib/export";
import { EXPORTABLE_STATUSES } from "@/lib/export-shared";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Nao autenticado." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const clientSlug = searchParams.get("clientSlug") || null;
  const campaignSlug = searchParams.get("campaignSlug") || null;
  const statusParam = searchParams.get("statuses") || "";
  const period = searchParams.get("period") as "today" | "7d" | "30d" | "90d" | "all" | null;

  const scopedClientSlug =
    user.role === "client_user" ? user.clientSlug : clientSlug;

  if (scopedClientSlug && !canAccessClient(user, scopedClientSlug)) {
    return NextResponse.json({ error: "Sem permissao para este cliente." }, { status: 403 });
  }

  // "all_leads" sentinel: exportar todos os leads sem filtro de status
  const isAllLeads = statusParam === "all_leads";
  const statuses: string[] | null = isAllLeads
    ? null
    : statusParam
      ? statusParam.split(",").filter((s) => (EXPORTABLE_STATUSES as readonly string[]).includes(s))
      : [...EXPORTABLE_STATUSES];

  const leads = await getExportableLeads({
    clientSlug: scopedClientSlug,
    campaignSlug,
    statuses,
    period: period ?? "all"
  });

  const csv = generateMetaCsv(leads);
  const tag = isAllLeads ? "todos" : "qualificados";
  const filename = `leads-${tag}-${new Date().toISOString().slice(0, 10)}.csv`;

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`
    }
  });
}
