import { NextResponse } from "next/server";
import { mapKommoStatusToLeadStatus, updateLeadByKommoLeadId } from "@/lib/kanban";

export const runtime = "nodejs";

function parseNumericValue(value?: string | null) {
  if (!value?.trim()) {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function pickFormValue(data: URLSearchParams, candidates: string[]) {
  for (const key of candidates) {
    const value = data.get(key);

    if (value) {
      return value;
    }
  }

  return "";
}

async function parseWebhookPayload(request: Request) {
  const contentType = request.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    const body = (await request.json()) as Record<string, unknown>;
    const leads = Array.isArray(body.leads)
      ? (body.leads as Array<Record<string, unknown>>)
      : [];
    const lead =
      (body.lead as Record<string, unknown> | undefined) ||
      leads[0] ||
      body;

    const kommoLeadId = parseNumericValue(
      String(
        lead.id ||
          lead.lead_id ||
          lead.entity_id ||
          body.id ||
          body.lead_id ||
          ""
      )
    );
    const statusName = String(
      lead.status_name ||
        lead.status ||
        lead.pipeline_status ||
        body.status_name ||
        body.status ||
        ""
    );
    const price = parseNumericValue(
      String(lead.price || lead.sale_value || body.price || body.sale_value || "")
    );

    return { kommoLeadId, statusName, price };
  }

  const raw = await request.text();
  const params = new URLSearchParams(raw);

  return {
    kommoLeadId: parseNumericValue(
      pickFormValue(params, [
        "leads[status][0][id]",
        "leads[add][0][id]",
        "lead[id]",
        "lead_id",
        "id"
      ])
    ),
    statusName: pickFormValue(params, [
      "leads[status][0][status_name]",
      "lead[status_name]",
      "status_name",
      "status"
    ]),
    price: parseNumericValue(
      pickFormValue(params, [
        "leads[status][0][price]",
        "lead[price]",
        "price"
      ])
    )
  };
}

export async function POST() {
  // Kommo integration disabled
  return NextResponse.json({ success: true, disabled: true });
}
