"use client";

import { useEffect, useRef, useState } from "react";

type Props = {
  clientSlug: string;
  campaignSlug: string;
  campaignName: string;
  clientName: string;
  groupUrl: string;
  logoUrl?: string | null;
  pixelId?: string | null;
};

function createEventId() {
  if (typeof window !== "undefined" && window.crypto?.randomUUID) {
    return window.crypto.randomUUID();
  }
  return `gzf-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function getUtmParams() {
  if (typeof window === "undefined") return {};
  const p = new URLSearchParams(window.location.search);
  return {
    utm_source: p.get("utm_source"),
    utm_medium: p.get("utm_medium"),
    utm_campaign: p.get("utm_campaign"),
    utm_content: p.get("utm_content"),
    utm_term: p.get("utm_term"),
    meta_campaign_id: p.get("campaign_id"),
    meta_adset_id: p.get("adset_id"),
    meta_ad_id: p.get("ad_id"),
    placement: p.get("placement"),
    fbclid: p.get("fbclid")
  };
}

function getFbCookies() {
  if (typeof document === "undefined") return { fbp: null, fbc: null };
  const cookies = Object.fromEntries(
    document.cookie.split("; ").map((c) => c.split("="))
  );
  return { fbp: cookies["_fbp"] ?? null, fbc: cookies["_fbc"] ?? null };
}

function fireFbqEvent(
  pixelId: string | null | undefined,
  eventName: string,
  eventId: string
) {
  if (typeof window === "undefined") return;
  const w = window as unknown as { fbq?: (...args: unknown[]) => void };
  if (!w.fbq || !pixelId) return;
  w.fbq("track", eventName, { content_name: "group_whatsapp" }, { eventID: eventId });
}

async function trackEvent(
  clientSlug: string,
  trackingSlug: string,
  eventName: string,
  eventId: string,
  pixelId?: string | null
) {
  const utms = getUtmParams();
  const { fbp, fbc } = getFbCookies();

  if (pixelId) {
    fireFbqEvent(pixelId, "Lead", eventId);
  }

  try {
    await fetch("/api/group/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_slug: clientSlug,
        tracking_slug: trackingSlug,
        event_name: eventName,
        event_id: eventId,
        ...utms,
        fbp,
        fbc,
        user_agent: navigator.userAgent,
        event_source_url: window.location.href
      })
    });
  } catch {
    // non-fatal
  }
}

export function GroupJoinPage({
  clientSlug,
  campaignSlug,
  campaignName,
  clientName,
  groupUrl,
  logoUrl,
  pixelId
}: Props) {
  const [joining, setJoining] = useState(false);
  const trackedView = useRef(false);

  useEffect(() => {
    if (trackedView.current) return;
    trackedView.current = true;
    const eventId = createEventId();
    void trackEvent(clientSlug, campaignSlug, "group_page_view", eventId, null);
  }, [clientSlug, campaignSlug]);

  const handleJoin = async () => {
    if (joining) return;
    setJoining(true);
    const eventId = createEventId();
    await trackEvent(clientSlug, campaignSlug, "group_join_click", eventId, pixelId);
    window.location.href = groupUrl;
  };

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      background: "linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)",
      padding: "24px 16px",
      fontFamily: "system-ui, -apple-system, sans-serif"
    }}>
      <div style={{
        background: "#fff",
        borderRadius: 20,
        padding: "40px 32px",
        maxWidth: 420,
        width: "100%",
        boxShadow: "0 4px 24px rgba(0,0,0,0.10)",
        textAlign: "center"
      }}>
        {logoUrl ? (
          <img
            src={logoUrl}
            alt={clientName}
            style={{ height: 64, objectFit: "contain", marginBottom: 20, borderRadius: 8 }}
          />
        ) : (
          <div style={{
            width: 64, height: 64, borderRadius: "50%",
            background: "#25D366", display: "flex", alignItems: "center",
            justifyContent: "center", margin: "0 auto 20px",
            fontSize: 28
          }}>
            👥
          </div>
        )}

        <h1 style={{ fontSize: "1.3rem", fontWeight: 700, color: "#111827", margin: "0 0 8px" }}>
          {clientName}
        </h1>
        <p style={{ fontSize: "0.95rem", color: "#6b7280", margin: "0 0 6px" }}>
          {campaignName}
        </p>
        <p style={{ fontSize: "0.85rem", color: "#9ca3af", margin: "0 0 28px" }}>
          Clique no botao abaixo para entrar no grupo exclusivo no WhatsApp.
        </p>

        <button
          id="join-btn"
          onClick={() => void handleJoin()}
          disabled={joining}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
            width: "100%",
            height: 54,
            borderRadius: 12,
            background: joining ? "#86efac" : "#25D366",
            color: "#fff",
            fontWeight: 700,
            fontSize: "1rem",
            border: "none",
            cursor: joining ? "default" : "pointer",
            transition: "background 0.2s",
            boxShadow: "0 2px 8px rgba(37,211,102,0.35)"
          }}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
          </svg>
          {joining ? "Redirecionando..." : "Entrar no grupo"}
        </button>

        <p style={{
          fontSize: "0.72rem",
          color: "#9ca3af",
          marginTop: 20,
          lineHeight: 1.5,
          borderTop: "1px solid #f3f4f6",
          paddingTop: 16
        }}>
          O Zap Faturamento rastreia quem clicou para entrar no grupo.
          O WhatsApp nao informa automaticamente quem entrou apos o clique.
        </p>
      </div>
    </div>
  );
}
