"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { ResolvedClientConfig } from "@/lib/clients";
import {
  buildLeadCapturePayload,
  buildWhatsAppUrl,
  type LeadCapturePayload
} from "@/lib/utm";
import {
  initializeTracking,
  trackRedirectEvent,
  trackRedirectPageView
} from "@/lib/tracking";
import { WhatsAppRedirectScreen } from "./WhatsAppRedirectScreen";

type CampaignContext = {
  id: string;
  slug: string;
  name: string;
  defaultMessage: string;
};

type CreativeContext = {
  id: string;
  slug: string;
};

type WhatsAppRedirectFlowProps = {
  client: ResolvedClientConfig;
  campaign?: CampaignContext;
  creative?: CreativeContext;
};

function wait(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

const isDevelopment = process.env.NODE_ENV === "development";

function debugLog(label: string, payload: unknown) {
  if (!isDevelopment) return;
  console.info(`[whatsapp-redirect] ${label}`, payload);
}

function createEventId() {
  if (typeof window !== "undefined" && window.crypto?.randomUUID) {
    return window.crypto.randomUUID();
  }
  return `zf-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

async function sendLeadToBackend(payload: LeadCapturePayload) {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), 2000);

  try {
    const response = await fetch("/api/kommo/create-lead", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: controller.signal
    });

    const data = await response.json().catch(() => null);
    return { ok: response.ok, status: response.status, data };
  } catch (error) {
    return {
      ok: false,
      status: 0,
      error: error instanceof Error ? error.message : "unknown_error"
    };
  } finally {
    window.clearTimeout(timeoutId);
  }
}

export function WhatsAppRedirectFlow({ client, campaign, creative }: WhatsAppRedirectFlowProps) {
  const router = useRouter();
  const [statusText, setStatusText] = useState("Preparando seu atendimento...");
  const [whatsappUrl, setWhatsappUrl] = useState<string | undefined>(undefined);

  const stableDelay = useMemo(() => {
    const candidate = client.redirectDelay;
    if (candidate < 1500) return 1500;
    if (candidate > 5000) return 5000;
    return candidate;
  }, [client.redirectDelay]);

  useEffect(() => {
    let cancelled = false;

    const url = new URL(window.location.href);
    const eventId = createEventId();

    const basePayload = buildLeadCapturePayload({
      client,
      url,
      redirectUrl: "",
      referrer: document.referrer,
      userAgent: navigator.userAgent,
      language: navigator.language,
      eventId,
      campaign,
      creative
    });

    // Clean URL bar so the lead doesn't see UTMs — data already captured above
    history.replaceState(null, "", window.location.pathname);

    const resolvedWhatsappUrl = buildWhatsAppUrl(
      client.whatsappNumber,
      basePayload.whatsappMessage
    );

    const payload: LeadCapturePayload = {
      ...basePayload,
      redirectUrl: resolvedWhatsappUrl
    };

    setWhatsappUrl(resolvedWhatsappUrl);

    debugLog("Cliente identificado pelo slug", {
      slug: client.clientSlug,
      clientName: client.clientName,
      kommoEnabled: client.kommoEnabled,
      eventId
    });
    debugLog("UTMs capturadas", {
      utm_source: payload.utm_source,
      utm_medium: payload.utm_medium,
      utm_campaign: payload.utm_campaign,
      utm_content: payload.utm_content,
      utm_term: payload.utm_term,
      fbclid: payload.fbclid,
      gclid: payload.gclid,
      campaign_id: payload.campaign_id,
      adset_id: payload.adset_id,
      ad_id: payload.ad_id,
      placement: payload.placement,
      device: payload.device,
      keyword: payload.keyword,
      matchtype: payload.matchtype,
      network: payload.network
    });
    debugLog("URL final do WhatsApp", resolvedWhatsappUrl);

    initializeTracking(client);
    trackRedirectPageView(client, payload);

    const capturePromise = sendLeadToBackend(payload).then((result) => {
      debugLog("Resposta da API de captura", result);
      return result;
    });

    void (async () => {
      await Promise.allSettled([
        wait(stableDelay),
        Promise.race([capturePromise, wait(2000)])
      ]);

      if (cancelled) return;

      setStatusText("Abrindo o WhatsApp...");
      trackRedirectEvent(client, payload);
      await wait(120);

      if (!cancelled) {
        window.location.href = resolvedWhatsappUrl;
      }
    })();

    const midTimer = window.setTimeout(() => {
      if (!cancelled) {
        setStatusText("Quase la! Abrindo o WhatsApp...");
      }
    }, 700);

    const lateTimer = window.setTimeout(() => {
      if (!cancelled) {
        setStatusText("Abrindo a conversa...");
      }
    }, Math.max(stableDelay - 500, 1000));

    return () => {
      cancelled = true;
      window.clearTimeout(midTimer);
      window.clearTimeout(lateTimer);
    };
  }, [client, campaign, creative, stableDelay, router]);

  return (
    <WhatsAppRedirectScreen
      clientName={client.clientName}
      logoUrl={client.logoUrl}
      title="Estamos te conectando com um especialista agora"
      description="Seu atendimento esta sendo preparado. Em poucos segundos voce sera direcionado para o WhatsApp."
      statusText={statusText}
      whatsappUrl={whatsappUrl}
    />
  );
}
