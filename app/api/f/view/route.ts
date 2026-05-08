import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { trackFormView } from "@/lib/lead-forms";
import { hasDatabaseConfig } from "@/lib/db";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!hasDatabaseConfig()) return NextResponse.json({ ok: true });

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: true });
  }

  const formId     = String(body.formId     || "").trim();
  const clientSlug = String(body.clientSlug || "").trim();
  if (!formId || !clientSlug) return NextResponse.json({ ok: true });

  const headersList = await headers();
  const ipAddress   = headersList.get("x-forwarded-for")?.split(",")[0]?.trim() || "";
  const userAgent   = headersList.get("user-agent") || "";

  await trackFormView({
    formId,
    clientSlug,
    utmSource:   String(body.utmSource   || "").trim() || undefined,
    utmMedium:   String(body.utmMedium   || "").trim() || undefined,
    utmCampaign: String(body.utmCampaign || "").trim() || undefined,
    utmContent:  String(body.utmContent  || "").trim() || undefined,
    utmTerm:     String(body.utmTerm     || "").trim() || undefined,
    fbclid:      String(body.fbclid      || "").trim() || undefined,
    gclid:       String(body.gclid       || "").trim() || undefined,
    ipAddress:   ipAddress || undefined,
    userAgent:   userAgent || undefined,
  }).catch(() => {});

  return NextResponse.json({ ok: true });
}
