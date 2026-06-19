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

export function SmsRedirectPage({ client, campaign, creative, smsPhone, smsMessage }: Props) {
  const [clicked, setClicked] = useState(false);
  const payloadRef = useRef<Record<string, unknown> | null>(null);

  const smsUrl = `sms:${smsPhone}${smsMessage ? `?body=${encodeURIComponent(smsMessage)}` : ""}`;

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
      <header className="smart-header">
        <div className="smart-header__inner">
          {client.logoUrl ? (
            <img
              src={client.logoUrl}
              alt={client.clientName}
              className="smart-logo"
            />
          ) : (
            <div className="smart-logo--placeholder">
              {client.clientName.charAt(0).toUpperCase()}
            </div>
          )}
          <span className="smart-client-name">{client.clientName}</span>
        </div>
      </header>

      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 24px" }}>
        <div style={{ maxWidth: 480, width: "100%", textAlign: "center" }}>
          <div style={{ fontSize: "3rem", lineHeight: 1, marginBottom: 16 }}>💬</div>

          <h1 style={{ fontSize: "clamp(1.4rem, 5vw, 1.9rem)", fontWeight: 800, color: "#111827", lineHeight: 1.2, margin: "0 0 12px" }}>
            Send us a text message
          </h1>

          <p style={{ fontSize: "1rem", color: "#6b7280", lineHeight: 1.65, margin: "0 0 8px" }}>
            Tap the button below to open your SMS app and start a conversation with <strong>{client.clientName}</strong>.
          </p>

          <p style={{ fontSize: "0.88rem", color: "#9ca3af", margin: "0 0 32px" }}>
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
              transition: "background 0.15s, transform 0.1s, box-shadow 0.15s",
              boxShadow: clicked ? "none" : "0 4px 14px rgba(37,99,235,0.35)",
              marginBottom: 16,
            }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            {clicked ? "Opening SMS app..." : "Send us a text"}
          </button>

          <p style={{ fontSize: "0.78rem", color: "#9ca3af", margin: 0 }}>
            🔒 Free, no commitment — your carrier&apos;s standard SMS rates apply
          </p>
        </div>
      </div>
    </main>
  );
}
