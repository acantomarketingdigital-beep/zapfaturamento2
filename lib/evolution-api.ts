export type EvolutionConnectionState = "open" | "close" | "connecting";

export interface EvolutionQRResponse {
  base64?: string;
  code?: string;
  count?: number;
}

export interface EvolutionStateResponse {
  instance: {
    instanceName: string;
    state: EvolutionConnectionState;
  };
}

export interface EvolutionWebhookPayload {
  event: string;
  instance: string;
  data: Record<string, unknown>;
  server_url?: string;
  date_time?: string;
  sender?: string;
  apikey?: string;
}

function apiUrl() {
  return (process.env.EVOLUTION_API_URL ?? "").replace(/\/$/, "");
}

function apiHeaders() {
  return {
    "Content-Type": "application/json",
    apikey: process.env.EVOLUTION_API_KEY ?? ""
  };
}

export function isEvolutionConfigured() {
  return Boolean(process.env.EVOLUTION_API_URL?.trim() && process.env.EVOLUTION_API_KEY?.trim());
}

export async function createEvolutionInstance(instanceName: string): Promise<void> {
  const webhookUrl = (
    process.env.EVOLUTION_WEBHOOK_URL ??
    `${(process.env.NEXT_PUBLIC_BASE_URL ?? "").replace(/\/$/, "")}/api/whatsapp/webhook`
  ).trim();

  const payload: Record<string, unknown> = {
    instanceName,
    qrcode: true,
    integration: "WHATSAPP-BAILEYS",
  };

  if (webhookUrl) {
    payload.webhook = {
      url: webhookUrl,
      byEvents: false,
      base64: false,
      events: ["MESSAGES_UPSERT", "CONNECTION_UPDATE"],
    };
  }

  const res = await fetch(`${apiUrl()}/instance/create`, {
    method: "POST",
    headers: apiHeaders(),
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Evolution API create instance failed (${res.status}): ${text}`);
  }
}

export async function getEvolutionQRCode(instanceName: string): Promise<EvolutionQRResponse> {
  const res = await fetch(`${apiUrl()}/instance/connect/${instanceName}`, {
    headers: apiHeaders()
  });
  if (!res.ok) {
    throw new Error(`Evolution API get QR failed (${res.status})`);
  }
  return res.json() as Promise<EvolutionQRResponse>;
}

export async function getEvolutionConnectionState(
  instanceName: string
): Promise<EvolutionConnectionState | null> {
  try {
    const res = await fetch(`${apiUrl()}/instance/connectionState/${instanceName}`, {
      headers: apiHeaders()
    });
    if (!res.ok) return null;
    const data = (await res.json()) as EvolutionStateResponse;
    return data.instance?.state ?? null;
  } catch {
    return null;
  }
}

export async function logoutEvolutionInstance(instanceName: string): Promise<boolean> {
  try {
    const res = await fetch(`${apiUrl()}/instance/logout/${instanceName}`, {
      method: "DELETE",
      headers: apiHeaders()
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function deleteEvolutionInstance(instanceName: string): Promise<boolean> {
  try {
    const abort = new AbortController();
    const timer = setTimeout(() => abort.abort(), 5000);
    const res = await fetch(`${apiUrl()}/instance/delete/${instanceName}`, {
      method: "DELETE",
      headers: apiHeaders(),
      signal: abort.signal
    });
    clearTimeout(timer);
    return res.ok;
  } catch {
    return false;
  }
}

export async function setEvolutionWebhook(instanceName: string): Promise<void> {
  const webhookUrl = (
    process.env.EVOLUTION_WEBHOOK_URL ??
    `${(process.env.NEXT_PUBLIC_BASE_URL ?? "").replace(/\/$/, "")}/api/whatsapp/webhook`
  ).trim();
  if (!webhookUrl) return;
  try {
    const res = await fetch(`${apiUrl()}/webhook/set/${instanceName}`, {
      method: "POST",
      headers: apiHeaders(),
      body: JSON.stringify({
        webhook: {
          enabled: true,
          url: webhookUrl,
          byEvents: false,
          base64: false,
          events: ["MESSAGES_UPSERT", "CONNECTION_UPDATE"]
        }
      })
    });
    const text = await res.text();
    console.log("[EVO WEBHOOK SET]", instanceName, res.status, text.slice(0, 200));
  } catch (err) {
    console.error("[EVO WEBHOOK SET] error", String(err));
  }
}

export async function sendEvolutionTextMessage(
  instanceName: string,
  phone: string,
  text: string
): Promise<void> {
  const res = await fetch(`${apiUrl()}/message/sendText/${instanceName}`, {
    method: "POST",
    headers: apiHeaders(),
    body: JSON.stringify({ number: phone, text })
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Evolution API send message failed (${res.status}): ${body}`);
  }
}
