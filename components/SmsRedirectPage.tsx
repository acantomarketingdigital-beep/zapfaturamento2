"use client";

import { useEffect, useRef, useState } from "react";
import type { ResolvedClientConfig } from "@/lib/clients";
import { buildLeadCapturePayload } from "@/lib/utm";
import { initializeTracking, trackRedirectEvent, trackRedirectPageView } from "@/lib/tracking";

type CampaignContext = {
  id: string;
  slug: string;
  name: string;
  defaultMessage: string;
  media1Url?: string | null;
  media1Type?: "image" | "video" | null;
  media2Url?: string | null;
  media2Type?: "image" | "video" | null;
};

type CreativeContext = {
  id: string;
  slug: string;
};

type Props = {
  client: ResolvedClientConfig;
  campaign?: CampaignContext;
  creative?: CreativeContext;
  smsPhone: string;
  smsMessage: string;
};

function createEventId() {
  if (typeof window !== "undefined" && window.crypto?.randomUUID) {
    return window.crypto.randomUUID();
  }
  return `sms-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

async function sendLeadToBackend(payload: Record<string, unknown>) {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), 2000);
  try {
    await fetch("/api/kommo/create-lead", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...payload, skipCapi: true }),
      signal: controller.signal,
    });
  } catch {
    // best-effort
  } finally {
    window.clearTimeout(timeoutId);
  }
}

function MediaSlot({ url, type }: { url: string; type: "image" | "video" | null }) {
  if (!url) return null;
  if (type === "video") {
    return (
      <video
        src={url}
        autoPlay
        muted
        loop
        playsInline
        style={{ width: "100%", maxHeight: 360, objectFit: "cover", borderRadius: 12, display: "block" }}
      />
    );
  }
  return (
    <img
      src={url}
      alt="Mídia da campanha"
      style={{ width: "100%", maxHeight: 360, objectFit: "cover", borderRadius: 12, display: "block" }}
    />
  );
}

export function SmsRedirectPage({ client, campaign, creative, smsPhone, smsMessage }: Props) {
  const [clicked, setClicked] = useState(false);
  const payloadRef = useRef<Record<string, unknown> | null>(null);

  const smsUrl = `sms:${smsPhone}${smsMessage ? `?body=${encodeURIComponent(smsMessage)}` : ""}`;

  const media1Url = campaign?.media1Url ?? null;
  const media1Type = campaign?.media1Type ?? null;
  const media2Url = campaign?.media2Url ?? null;
  const media2Type = campaign?.media2Type ?? null;
  const hasMedia = !!(media1Url || media2Url);

  useEffect(() => {
    const url = new URL(window.location.href);
    const eventId = createEventId();

    const base = buildLeadCapturePayload({
      client,
      url,
      redirectUrl: smsUrl,
      referrer: document.referrer,
      userAgent: navigator.userAgent,
      language: navigator.language,
      eventId,
      campaign,
      creative,
    });

    const payload = { ...base, redirectUrl: smsUrl };
    payloadRef.current = payload as unknown as Record<string, unknown>;

    history.replaceState(null, "", window.location.pathname);

    initializeTracking(client);
    trackRedirectPageView(client, base);
    void sendLeadToBackend(payload as unknown as Record<string, unknown>);
  }, [client, campaign, creative, smsUrl]);

  function handleClick() {
    if (payloadRef.current) {
      trackRedirectEvent(client, payloadRef.current as Parameters<typeof trackRedirectEvent>[1]);
    }
    setClicked(true);
    window.location.href = smsUrl;
  }

  const displayPhone = smsPhone.startsWith("+") ? smsPhone : `+${smsPhone}`;

  return (
    <main className="smart-shell">
      {/* Header */}
      <header className="smart-header">
        <div className="smart-header__inner">
          {client.logoUrl ? (
            <img src={client.logoUrl} alt={client.clientName} className="smart-logo" />
          ) : (
            <div className="smart-logo--placeholder">
              {client.clientName.charAt(0).toUpperCase()}
            </div>
          )}
          <span className="smart-client-name">{client.clientName}</span>
        </div>
      </header>

      {/* Layout com sidebars (igual à SmartRedirectPage) */}
      <div className="smart-layout">
        {/* Sidebar esquerda */}
        {hasMedia && (
          <aside className="smart-sidebar smart-sidebar--left" aria-label="Mídia principal">
            {media1Url && <MediaSlot url={media1Url} type={media1Type} />}
          </aside>
        )}

        {/* Conteúdo central */}
        <section className="smart-content">
          {/* Imagem no mobile (acima do conteúdo) */}
          {hasMedia && (
            <div className="smart-media-mobile" style={{ marginBottom: 20 }}>
              {media1Url && <MediaSlot url={media1Url} type={media1Type} />}
            </div>
          )}

          <div style={{ textAlign: "center" }}>
            <h1 style={{
              fontSize: "clamp(1.3rem, 4vw, 1.8rem)",
              fontWeight: 800,
              color: "var(--text, #111827)",
              lineHeight: 1.2,
              margin: "0 0 10px",
            }}>
              {client.clientName}
            </h1>

            <h2 style={{
              fontSize: "clamp(1rem, 3vw, 1.3rem)",
              fontWeight: 600,
              color: "var(--text, #111827)",
              lineHeight: 1.3,
              margin: "0 0 8px",
            }}>
              Fale com a gente via SMS
            </h2>

            <h3 style={{
              fontSize: "0.95rem",
              fontWeight: 400,
              color: "var(--text-muted, #6b7280)",
              lineHeight: 1.6,
              margin: "0 0 8px",
            }}>
              Toque no botão abaixo para abrir o seu app de SMS e iniciar uma conversa com <strong>{client.clientName}</strong>.
            </h3>

            <p style={{ fontSize: "0.85rem", color: "var(--text-muted, #9ca3af)", margin: "0 0 28px" }}>
              {displayPhone}
            </p>

            <button
              type="button"
              onClick={handleClick}
              disabled={clicked}
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 10,
                width: "100%",
                maxWidth: 380,
                height: 60,
                background: clicked ? "#6b7280" : "#2563eb",
                color: "#fff",
                fontSize: "1.08rem",
                fontWeight: 700,
                border: "none",
                borderRadius: 14,
                cursor: clicked ? "default" : "pointer",
                transition: "background 0.15s, box-shadow 0.15s",
                boxShadow: clicked ? "none" : "0 4px 14px rgba(37,99,235,0.35)",
                marginBottom: 14,
              }}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
              {clicked ? "Abrindo app de SMS..." : "Enviar mensagem"}
            </button>

            <p style={{ fontSize: "0.78rem", color: "var(--text-muted, #9ca3af)", margin: 0 }}>
              🔒 Gratuito e sem compromisso — tarifas padrão da sua operadora podem ser aplicadas
            </p>
          </div>
        </section>

        {/* Sidebar direita */}
        {hasMedia && (
          <aside className="smart-sidebar smart-sidebar--right" aria-label="Mídia secundária">
            {media2Url && <MediaSlot url={media2Url} type={media2Type} />}
            {!media2Url && media1Url && <MediaSlot url={media1Url} type={media1Type} />}
          </aside>
        )}
      </div>
    </main>
  );
}
