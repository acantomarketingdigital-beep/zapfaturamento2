import { NextResponse } from "next/server";
import { getCurrentUser, isAgencyAdmin } from "@/lib/dashboard-auth";
import { getConnectionBySessionId, listConnections } from "@/lib/whatsapp-connections";

function apiUrl() {
  return (process.env.EVOLUTION_API_URL ?? "").replace(/\/$/, "");
}
function apiHeaders() {
  return { "Content-Type": "application/json", apikey: process.env.EVOLUTION_API_KEY ?? "" };
}

export async function GET() {
  const user = await getCurrentUser();
  if (!user || !isAgencyAdmin(user)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const webhookUrl = (
    process.env.EVOLUTION_WEBHOOK_URL ??
    `${(process.env.NEXT_PUBLIC_BASE_URL ?? "").trim().replace(/\/$/, "")}/api/whatsapp/webhook`
  ).trim();

  const connections = await listConnections();
  const results = await Promise.all(
    connections.map(async (conn) => {
      let webhookConfig: unknown = null;
      let instanceState: unknown = null;
      // Try to trigger a webhook send via Evolution API's built-in test
      let pingResult: unknown = null;
      try {
        const [wRes, sRes] = await Promise.all([
          fetch(`${apiUrl()}/webhook/find/${conn.session_id}`, { headers: apiHeaders() }),
          fetch(`${apiUrl()}/instance/connectionState/${conn.session_id}`, { headers: apiHeaders() })
        ]);
        webhookConfig = wRes.ok ? await wRes.json() : { error: wRes.status };
        instanceState = sRes.ok ? await sRes.json() : { error: sRes.status };

        // Fetch all chats to verify connection is actually live
        const chatsRes = await fetch(
          `${apiUrl()}/chat/findChats/${conn.session_id}`,
          { method: "POST", headers: apiHeaders(), body: JSON.stringify({}) }
        );
        pingResult = {
          status: chatsRes.status,
          ok: chatsRes.ok,
          body: await chatsRes.text().then(t => t.slice(0, 300))
        };
      } catch (e) {
        webhookConfig = { error: String(e) };
      }
      return {
        id: conn.id,
        name: conn.connection_name,
        session_id: conn.session_id,
        db_status: conn.status,
        webhookConfig,
        instanceState,
        pingResult
      };
    })
  );

  return NextResponse.json({ results, webhookUrl });
}

// POST /api/whatsapp/debug — sends a fake MESSAGES_UPSERT to our own webhook to test the pipeline
export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user || !isAgencyAdmin(user)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = (await request.json()) as { session_id?: string };
  const sessionId = body.session_id;
  if (!sessionId) return NextResponse.json({ error: "session_id required" }, { status: 400 });

  const connection = await getConnectionBySessionId(sessionId);
  if (!connection) return NextResponse.json({ error: "Connection not found" }, { status: 404 });

  const fakePayload = {
    event: "messages.upsert",
    instance: sessionId,
    data: {
      key: {
        remoteJid: "5511900000000@s.whatsapp.net",
        fromMe: false,
        id: `TEST_${Date.now()}`
      },
      message: { conversation: "[TESTE DEBUG] mensagem automatica de verificacao" },
      pushName: "Teste Debug",
      messageTimestamp: Math.floor(Date.now() / 1000),
      messageType: "conversation"
    }
  };

  const webhookUrl = (
    process.env.EVOLUTION_WEBHOOK_URL ??
    `${(process.env.NEXT_PUBLIC_BASE_URL ?? "").trim().replace(/\/$/, "")}/api/whatsapp/webhook`
  ).trim();

  try {
    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(fakePayload)
    });
    const text = await res.text();
    return NextResponse.json({ ok: res.ok, status: res.status, webhookUrl, body: text.slice(0, 500) });
  } catch (e) {
    return NextResponse.json({ error: String(e), webhookUrl }, { status: 500 });
  }
}
