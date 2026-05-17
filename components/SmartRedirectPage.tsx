"use client";

import { useEffect, useRef, useState } from "react";
import { CustomerLogo } from "@/components/CustomerLogo";
import type { ResolvedClientConfig } from "@/lib/clients";
import type { SeoContent } from "@/lib/seo-content-generator";
import {
  buildLeadCapturePayload,
  buildWhatsAppUrl,
  type LeadCapturePayload,
} from "@/lib/utm";
import {
  initializeTracking,
  trackRedirectEvent,
  trackRedirectPageView,
} from "@/lib/tracking";

type CampaignContext = { id: string; slug: string; name: string; defaultMessage: string };
type CreativeContext = { id: string; slug: string };

type Props = {
  client: ResolvedClientConfig;
  campaign?: CampaignContext;
  creative?: CreativeContext;
  seoContent?: SeoContent | null;
};

function createEventId() {
  if (typeof window !== "undefined" && window.crypto?.randomUUID) return window.crypto.randomUUID();
  return `zf-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function readCookie(name: string): string {
  const match = document.cookie.match(new RegExp("(?:^|; )" + name + "=([^;]*)"));
  return match ? decodeURIComponent(match[1]) : "";
}

async function sendLeadToBackend(payload: LeadCapturePayload) {
  try {
    const ctrl = new AbortController();
    const t = window.setTimeout(() => ctrl.abort(), 3000);
    const res = await fetch("/api/kommo/create-lead", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: ctrl.signal,
    });
    window.clearTimeout(t);
    await res.json().catch(() => null);
  } catch { /* best-effort */ }
}

const DEFAULT_BENEFITS = [
  "Atendimento personalizado para você",
  "Resposta rápida da nossa equipe",
  "Sem compromisso, fale agora",
];

function CheckIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true" style={{ width: 18, height: 18, flexShrink: 0 }}>
      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
    </svg>
  );
}

function WhatsAppIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" style={{ width: 22, height: 22, flexShrink: 0 }}>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

export function SmartRedirectPage({ client, campaign, creative, seoContent }: Props) {
  const [whatsappUrl, setWhatsappUrl] = useState("");
  const [payload, setPayload] = useState<LeadCapturePayload | null>(null);
  const [clicked, setClicked] = useState(false);
  const initialized = useRef(false);

  const headline = seoContent?.title ?? `Fale com ${client.clientName} pelo WhatsApp`;
  const bullets = seoContent?.bullets ?? DEFAULT_BENEFITS;
  const ctaText = seoContent?.ctaText ?? "Falar no WhatsApp agora";

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const url = new URL(window.location.href);
    const eventId = createEventId();

    const base = buildLeadCapturePayload({
      client,
      url,
      redirectUrl: "",
      referrer: document.referrer,
      userAgent: navigator.userAgent,
      language: navigator.language,
      eventId,
      campaign,
      creative,
    });

    history.replaceState(null, "", window.location.pathname);

    const waUrl = buildWhatsAppUrl(client.whatsappNumber, base.whatsappMessage);
    const full: LeadCapturePayload = {
      ...base,
      redirectUrl: waUrl,
      fbp: readCookie("_fbp"),
      fbc: readCookie("_fbc"),
    };

    setWhatsappUrl(waUrl);
    setPayload(full);

    initializeTracking(client);
    trackRedirectPageView(client, full);
    void sendLeadToBackend(full);
  }, [client, campaign, creative]);

  function handleClick() {
    if (clicked || !payload || !whatsappUrl) return;
    setClicked(true);
    trackRedirectEvent(client, payload);
    window.location.href = whatsappUrl;
  }

  return (
    <main className="smart-shell">
      <header className="smart-header">
        <div className="smart-header__inner">
          <CustomerLogo
            logoUrl={client.logoUrl}
            clientName={client.clientName}
            imageClassName="smart-logo"
            placeholderClassName="smart-logo smart-logo--placeholder"
          />
          <span className="smart-client-name">{client.clientName}</span>
        </div>
      </header>

      <section className="smart-content">
        {seoContent && (
          <div className="smart-badge">⭐ {seoContent.badgeText}</div>
        )}

        <h1 className="smart-headline">{headline}</h1>

        {seoContent?.description ? (
          <p className="smart-subtitle">{seoContent.description}</p>
        ) : (
          <p className="smart-subtitle">
            Nossa equipe está pronta para te atender agora. Clique no botão abaixo para iniciar a conversa.
          </p>
        )}

        <ul className="smart-benefits" aria-label="Benefícios">
          {bullets.map((b, i) => (
            <li key={i} className="smart-benefit">
              <span className="smart-benefit__icon"><CheckIcon /></span>
              <span>{b}</span>
            </li>
          ))}
        </ul>

        <button
          type="button"
          className={`smart-cta${clicked ? " smart-cta--loading" : ""}`}
          onClick={handleClick}
          disabled={clicked || !whatsappUrl}
          aria-label="Falar no WhatsApp"
        >
          <WhatsAppIcon />
          {clicked ? "Abrindo WhatsApp..." : ctaText}
        </button>

        <p className="smart-trust">🔒 Atendimento gratuito e sem compromisso</p>

        {seoContent && seoContent.keywords.length > 0 && (
          <section aria-label="Serviços atendidos" className="smart-keywords">
            <p className="smart-keywords__label">Serviços que atendemos:</p>
            <ul className="smart-keywords__list">
              {seoContent.keywords.map((kw, i) => (
                <li key={i} className="smart-keywords__tag">{kw}</li>
              ))}
            </ul>
          </section>
        )}
      </section>

      <footer className="smart-footer">
        <span>© {new Date().getFullYear()} {client.clientName}</span>
        <span className="smart-footer__sep">·</span>
        <a href="/politica-de-privacidade" className="smart-footer__link">Política de Privacidade</a>
        <span className="smart-footer__sep">·</span>
        <a href="/termos-de-uso" className="smart-footer__link">Termos de Uso</a>
      </footer>
    </main>
  );
}
