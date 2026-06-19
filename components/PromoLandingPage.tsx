"use client";

import { useEffect, useRef, useState } from "react";

type Props = {
  clientName: string;
  clientLogoUrl: string | null;
  promoImageUrl: string | null;
  promoImageAspect: "1:1" | "3:4" | "9:16";
  promoTitle: string | null;
  promoDescription: string | null;
  ctaText: string;
  whatsappNumber: string;
  whatsappMessage: string;
  shortCode: string;
};

const ASPECT_RATIO: Record<string, string> = {
  "1:1": "1 / 1",
  "3:4": "3 / 4",
  "9:16": "9 / 16",
};

function buildWaUrl(number: string, message: string) {
  const digits = number.replace(/\D/g, "");
  return `https://api.whatsapp.com/send?phone=${digits}&text=${encodeURIComponent(message)}`;
}

function createEventId() {
  if (typeof window !== "undefined" && window.crypto?.randomUUID) return window.crypto.randomUUID();
  return `promo-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

async function registerVisit(shortCode: string, waUrl: string) {
  try {
    const url = new URL(window.location.href);
    await fetch("/api/kommo/create-lead", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        clientSlug: "",
        eventId: createEventId(),
        utm_source: url.searchParams.get("utm_source") ?? "sms",
        utm_medium: url.searchParams.get("utm_medium") ?? "sms",
        utm_campaign: url.searchParams.get("utm_campaign") ?? shortCode,
        utm_content: url.searchParams.get("utm_content") ?? "",
        utm_term: url.searchParams.get("utm_term") ?? "",
        redirectUrl: waUrl,
        referrer: document.referrer,
        userAgent: navigator.userAgent,
        pageUrl: window.location.href,
        pagePath: window.location.pathname,
        skipCapi: true,
        channel: "sms",
        source_platform: "sms_blast",
      }),
      signal: AbortSignal.timeout(2000),
    });
  } catch { /* best-effort */ }
}

export function PromoLandingPage({
  clientName,
  clientLogoUrl,
  promoImageUrl,
  promoImageAspect,
  promoTitle,
  promoDescription,
  ctaText,
  whatsappNumber,
  whatsappMessage,
  shortCode,
}: Props) {
  const [clicked, setClicked] = useState(false);
  const waUrl = buildWaUrl(whatsappNumber, whatsappMessage);
  const registered = useRef(false);

  useEffect(() => {
    if (registered.current) return;
    registered.current = true;
    history.replaceState(null, "", window.location.pathname);
    void registerVisit(shortCode, waUrl);
  }, [shortCode, waUrl]);

  function handleCta() {
    setClicked(true);
    window.location.href = waUrl;
  }

  const aspectRatio = ASPECT_RATIO[promoImageAspect] ?? "1 / 1";

  return (
    <main style={{
      minHeight: "100vh",
      background: "#fff",
      display: "flex",
      flexDirection: "column",
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    }}>
      {/* Header */}
      <header style={{
        padding: "14px 20px",
        borderBottom: "1px solid #f3f4f6",
        display: "flex",
        alignItems: "center",
        gap: 12,
      }}>
        {clientLogoUrl ? (
          <img
            src={clientLogoUrl}
            alt={clientName}
            style={{ height: 40, width: 40, borderRadius: "50%", objectFit: "cover", border: "1.5px solid #e5e7eb" }}
          />
        ) : (
          <div style={{
            height: 40, width: 40, borderRadius: "50%",
            background: "#25d366", color: "#fff",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontWeight: 800, fontSize: "1.1rem",
          }}>
            {clientName.charAt(0).toUpperCase()}
          </div>
        )}
        <span style={{ fontWeight: 700, fontSize: "1rem", color: "#111827" }}>
          {clientName}
        </span>
      </header>

      {/* Imagem da promo */}
      {promoImageUrl && (
        <div style={{
          width: "100%",
          maxWidth: promoImageAspect === "9:16" ? 420 : "100%",
          margin: "0 auto",
        }}>
          <div style={{ aspectRatio, width: "100%", overflow: "hidden" }}>
            <img
              src={promoImageUrl}
              alt={promoTitle ?? "Promoção"}
              style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
            />
          </div>
        </div>
      )}

      {/* Conteúdo */}
      <div style={{
        flex: 1,
        padding: "24px 20px 32px",
        maxWidth: 520,
        width: "100%",
        margin: "0 auto",
        display: "flex",
        flexDirection: "column",
        gap: 12,
      }}>
        {promoTitle && (
          <h1 style={{
            fontSize: "clamp(1.3rem, 5vw, 1.8rem)",
            fontWeight: 800,
            color: "#111827",
            lineHeight: 1.2,
            margin: 0,
          }}>
            {promoTitle}
          </h1>
        )}

        {promoDescription && (
          <p style={{
            fontSize: "0.97rem",
            color: "#4b5563",
            lineHeight: 1.65,
            margin: 0,
            whiteSpace: "pre-wrap",
          }}>
            {promoDescription}
          </p>
        )}

        <button
          type="button"
          onClick={handleCta}
          disabled={clicked}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
            width: "100%",
            height: 58,
            marginTop: 8,
            background: clicked ? "#6b7280" : "#25d366",
            color: "#fff",
            fontSize: "1.05rem",
            fontWeight: 700,
            border: "none",
            borderRadius: 14,
            cursor: clicked ? "default" : "pointer",
            boxShadow: clicked ? "none" : "0 4px 14px rgba(37,211,102,0.35)",
            transition: "background 0.15s",
          }}
        >
          {/* WhatsApp icon */}
          <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
          </svg>
          {clicked ? "Abrindo WhatsApp..." : ctaText}
        </button>

        <p style={{ fontSize: "0.75rem", color: "#9ca3af", textAlign: "center", margin: 0 }}>
          🔒 Atendimento gratuito e sem compromisso
        </p>
      </div>
    </main>
  );
}
