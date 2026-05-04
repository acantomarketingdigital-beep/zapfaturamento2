import { createHash } from "node:crypto";

type MetaUserData = {
  client_ip_address?: string;
  client_user_agent?: string;
  fbc?: string;
  fbp?: string;
  external_id?: string;
  em?: string;
  ph?: string;
};

type MetaCustomData = Record<string, string | number | boolean | null | undefined>;

type SendMetaCapiEventParams = {
  pixelId: string;
  accessToken: string;
  testEventCode?: string;
  eventName: string;
  eventId: string;
  eventTime: number;
  actionSource: "website";
  eventSourceUrl: string;
  userData: MetaUserData;
  customData: MetaCustomData;
};

type MetaApiResponse = {
  events_received?: number;
  fbtrace_id?: string;
  messages?: string[];
};

function cleanText(value?: string | null) {
  return value?.trim() || "";
}

function normalizeUserData(userData: MetaUserData) {
  const normalizedEntries = Object.entries(userData).filter(([, value]) => cleanText(value));
  return Object.fromEntries(normalizedEntries);
}

function normalizeCustomData(customData: MetaCustomData) {
  const normalizedEntries = Object.entries(customData).filter(([, value]) => {
    if (value === null || value === undefined) {
      return false;
    }

    if (typeof value === "string") {
      return Boolean(value.trim());
    }

    return true;
  });

  return Object.fromEntries(normalizedEntries);
}

export function buildMetaExternalId(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

export function buildMetaFbc(fbclid?: string | null) {
  const normalized = cleanText(fbclid);

  if (!normalized) {
    return "";
  }

  return `fb.1.${Date.now()}.${normalized}`;
}

export async function sendMetaCapiEvent({
  pixelId,
  accessToken,
  testEventCode,
  eventName,
  eventId,
  eventTime,
  actionSource,
  eventSourceUrl,
  userData,
  customData
}: SendMetaCapiEventParams) {
  const response = await fetch(
    `https://graph.facebook.com/v18.0/${encodeURIComponent(pixelId)}/events`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        data: [
          {
            event_name: eventName,
            event_time: eventTime,
            event_id: eventId,
            action_source: actionSource,
            event_source_url: eventSourceUrl,
            user_data: normalizeUserData(userData),
            custom_data: normalizeCustomData(customData)
          }
        ],
        test_event_code: cleanText(testEventCode) || undefined,
        access_token: accessToken
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(1500)
    }
  );

  const data = (await response.json().catch(() => null)) as MetaApiResponse | null;

  if (!response.ok) {
    const message =
      data?.messages?.join(", ") ||
      `Meta CAPI ${response.status}`;
    throw new Error(message);
  }

  return data;
}
