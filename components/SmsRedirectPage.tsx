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

type CreativeContext = { id: string; slug: string };

type Props = {
  client: ResolvedClientConfig;
  campaign?: CampaignContext;
  creative?: CreativeContext;
  smsPhone: string;
  smsMessage: string;
};

// ─── Locale detection ─────────────────────────────────────────────────────────

type Locale = "en" | "pt";

function detectLocale(phone: string): Locale {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("1") && digits.length >= 10 && digits.length <= 11) return "en";
  return "pt";
}

const STRINGS: Record<Locale, {
  subtitle: (name: string) => string;
  bullets: string[];
  cta: string;
  ctaLoading: string;
  trust: string;
  featuresTitle: (name: string) => string;
  features: { title: string; text: (name: string) => string }[];
  stepsTitle: string;
  steps: { title: string; text: string }[];
  faqTitle: string;
  faqs: { q: string; a: (name: string) => string }[];
  footerPrivacy: string;
  footerTerms: string;
}> = {
  en: {
    subtitle: (name) => `Our team at ${name} is ready to chat. Tap the button below to start a text conversation — no forms, no wait.`,
    bullets: ["Fast response via text", "Free consultation, no commitment", "Speak directly with the team"],
    cta: "Send us a text",
    ctaLoading: "Opening SMS app...",
    trust: "🔒 Free, no commitment — your carrier's standard SMS rates may apply",
    featuresTitle: (name) => `Why choose ${name}?`,
    features: [
      { title: "Fast response", text: () => "Our team replies quickly to answer your questions and offer the best service without any hassle." },
      { title: "Free estimate", text: () => "Request a free, no-obligation estimate. Text us and discover the best solution for you." },
      { title: "Direct support", text: (name) => `Talk directly with ${name}'s team via text — straightforward and personal.` },
    ],
    stepsTitle: "How does it work?",
    steps: [
      { title: "1. Tap the button", text: "Tap the SMS button to open your messaging app and start a direct conversation with our team." },
      { title: "2. Tell us what you need", text: "Describe your needs. We'll handle your request with speed and attention." },
      { title: "3. Get your answer", text: "Our team responds quickly with the best options and conditions for you." },
    ],
    faqTitle: "Frequently asked questions",
    faqs: [
      { q: "How do I get in touch?", a: (name) => `Click the "Send us a text" button on this page. You'll be directed straight to ${name}.` },
      { q: "Is the first contact free?", a: () => "Yes! The initial contact is completely free and with no commitment. Text us now." },
      { q: "How fast will you reply?", a: () => "We aim to reply as quickly as possible. Most texts are answered within minutes during business hours." },
    ],
    footerPrivacy: "Privacy Policy",
    footerTerms: "Terms of Service",
  },
  pt: {
    subtitle: (name) => `Nossa equipe da ${name} está pronta para te atender agora. Clique no botão abaixo para iniciar a conversa via SMS — sem formulários, sem espera.`,
    bullets: ["Resposta rápida via SMS", "Atendimento gratuito e sem compromisso", "Fale direto com a equipe"],
    cta: "Enviar mensagem",
    ctaLoading: "Abrindo app de SMS...",
    trust: "🔒 Gratuito e sem compromisso — tarifas padrão da sua operadora podem ser aplicadas",
    featuresTitle: (name) => `Por que escolher ${name}?`,
    features: [
      { title: "Resposta rápida pelo SMS", text: () => "Nossa equipe responde rapidamente para tirar suas dúvidas e oferecer o melhor atendimento sem complicação." },
      { title: "Orçamento gratuito", text: () => "Solicite seu orçamento sem nenhum custo. Fale com a equipe e descubra a melhor solução." },
      { title: "Atendimento direto", text: (name) => `Fale diretamente com a equipe de ${name} pelo SMS — sem intermediários.` },
    ],
    stepsTitle: "Como funciona o atendimento?",
    steps: [
      { title: "1. Clique no botão de SMS", text: "Toque no botão abaixo para abrir o seu app de SMS e iniciar uma conversa direta com nossa equipe, sem espera." },
      { title: "2. Descreva o que você precisa", text: "Conta pra gente sua necessidade. Atendemos sua demanda com agilidade e atenção." },
      { title: "3. Receba seu atendimento", text: "A equipe responde rapidamente com as melhores opções e condições para você." },
    ],
    faqTitle: "Perguntas frequentes",
    faqs: [
      { q: "Como entro em contato?", a: (name) => `Clique no botão "Enviar mensagem" nesta página. Você será direcionado diretamente ao atendimento de ${name}.` },
      { q: "O primeiro contato é gratuito?", a: () => "Sim! O atendimento inicial é totalmente gratuito e sem compromisso. Fale agora e tire todas as suas dúvidas." },
      { q: "Quanto tempo demora para responder?", a: () => "Nossa equipe responde o mais rápido possível. A maioria das mensagens é respondida em minutos durante o horário comercial." },
    ],
    footerPrivacy: "Política de Privacidade",
    footerTerms: "Termos de Uso",
  },
};

// ─── Icons ────────────────────────────────────────────────────────────────────

function SmsIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
    </svg>
  );
}

// ─── MediaSlot ────────────────────────────────────────────────────────────────

function MediaSlot({ url, type, onSmsClick, disabled }: {
  url: string;
  type: "image" | "video" | null;
  onSmsClick: () => void;
  disabled: boolean;
}) {
  if (!url) return null;
  if (type === "video") {
    return (
      <div className="smart-media-slot">
        <div className="smart-media-video-wrap">
          <video src={url} autoPlay muted loop playsInline className="smart-media-video" />
        </div>
        <button type="button" className="smart-media-wa-btn" onClick={onSmsClick} disabled={disabled}>
          <SmsIcon /> Enviar mensagem
        </button>
      </div>
    );
  }
  return (
    <div className="smart-media-slot">
      <img src={url} alt="Mídia da campanha" className="smart-media-img" />
      <button type="button" className="smart-media-wa-btn" onClick={onSmsClick} disabled={disabled}>
        <SmsIcon /> Enviar mensagem
      </button>
    </div>
  );
}

// ─── Tracking helpers ─────────────────────────────────────────────────────────

function createEventId() {
  if (typeof window !== "undefined" && window.crypto?.randomUUID) return window.crypto.randomUUID();
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
  } catch { /* best-effort */ }
  finally { window.clearTimeout(timeoutId); }
}

// ─── Main component ───────────────────────────────────────────────────────────

export function SmsRedirectPage({ client, campaign, creative, smsPhone, smsMessage }: Props) {
  const [clicked, setClicked] = useState(false);
  const payloadRef = useRef<Record<string, unknown> | null>(null);

  const locale = detectLocale(smsPhone);
  const t = STRINGS[locale];

  const smsUrl = `sms:${smsPhone}${smsMessage ? `?body=${encodeURIComponent(smsMessage)}` : ""}`;
  const displayPhone = smsPhone.startsWith("+") ? smsPhone : `+${smsPhone}`;

  const media1Url = campaign?.media1Url ?? null;
  const media1Type = campaign?.media1Type ?? null;
  const media2Url = campaign?.media2Url ?? null;
  const media2Type = campaign?.media2Type ?? null;
  const hasMedia = !!(media1Url || media2Url);

  useEffect(() => {
    const url = new URL(window.location.href);
    const eventId = createEventId();
    const base = buildLeadCapturePayload({
      client, url, redirectUrl: smsUrl,
      referrer: document.referrer, userAgent: navigator.userAgent,
      language: navigator.language, eventId, campaign, creative,
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

  const mediaDisabled = clicked;

  // ─── Content section (mirrors SmartRedirectPage contentSection) ──────────────
  const contentSection = (
    <section className="smart-content">
      <h1 className="smart-headline">{client.clientName}</h1>

      <p className="smart-subtitle">{t.subtitle(client.clientName)}</p>

      <ul className="smart-benefits" aria-label="Benefícios">
        {t.bullets.map((b, i) => (
          <li key={i} className="smart-benefit">
            <span className="smart-benefit__icon"><CheckIcon /></span>
            <span>{b}</span>
          </li>
        ))}
      </ul>

      <p style={{ fontSize: "0.88rem", color: "var(--text-muted, #9ca3af)", margin: "0 0 16px" }}>
        {displayPhone}
      </p>

      <button
        type="button"
        className={`smart-cta${clicked ? " smart-cta--loading" : ""}`}
        onClick={handleClick}
        disabled={clicked}
        aria-label={t.cta}
        style={{ background: clicked ? "#6b7280" : "#2563eb", boxShadow: clicked ? "none" : "0 4px 14px rgba(37,99,235,0.35)" }}
      >
        <SmsIcon />
        {clicked ? t.ctaLoading : t.cta}
      </button>

      <p className="smart-trust">{t.trust}</p>

      {/* Features section (H2 + H3) */}
      <section className="smart-section">
        <h2 className="smart-section__title">{t.featuresTitle(client.clientName)}</h2>
        <div className="smart-features">
          {t.features.map((f, i) => (
            <div key={i} className="smart-feature">
              <h3>{f.title}</h3>
              <p>{f.text(client.clientName)}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Steps section (H2 + H3) */}
      <section className="smart-section">
        <h2 className="smart-section__title">{t.stepsTitle}</h2>
        <div className="smart-steps">
          {t.steps.map((s, i) => (
            <div key={i} className="smart-step">
              <h3>{s.title}</h3>
              <p>{s.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ section (H2 + H3) */}
      <section className="smart-section">
        <h2 className="smart-section__title">{t.faqTitle}</h2>
        <div className="smart-faq">
          {t.faqs.map((faq, i) => (
            <div key={i} className="smart-faq-item">
              <h3>{faq.q}</h3>
              <p>{faq.a(client.clientName)}</p>
            </div>
          ))}
        </div>
      </section>
    </section>
  );

  return (
    <main className="smart-shell">
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

      {/* Identical structure to SmartRedirectPage */}
      <div className="smart-body">
        {hasMedia && (
          <aside className="smart-sidebar" aria-label="Mídia principal">
            {media1Url && (
              <MediaSlot url={media1Url} type={media1Type} onSmsClick={handleClick} disabled={mediaDisabled} />
            )}
          </aside>
        )}

        {contentSection}

        {hasMedia && (
          <aside className="smart-sidebar" aria-label="Mídia secundária">
            {media2Url && (
              <MediaSlot url={media2Url} type={media2Type} onSmsClick={handleClick} disabled={mediaDisabled} />
            )}
          </aside>
        )}
      </div>

      {/* Mobile-only media — outside smart-body, same as SmartRedirectPage */}
      {hasMedia && (
        <div className="smart-media-mobile">
          {media1Url && (
            <MediaSlot url={media1Url} type={media1Type} onSmsClick={handleClick} disabled={mediaDisabled} />
          )}
          {media2Url && (
            <MediaSlot url={media2Url} type={media2Type} onSmsClick={handleClick} disabled={mediaDisabled} />
          )}
        </div>
      )}

      <footer className="smart-footer">
        <span>© {new Date().getFullYear()} {client.clientName}</span>
        <span className="smart-footer__sep">·</span>
        <a href="/politica-de-privacidade" className="smart-footer__link">{t.footerPrivacy}</a>
        <span className="smart-footer__sep">·</span>
        <a href="/termos-de-uso" className="smart-footer__link">{t.footerTerms}</a>
      </footer>
    </main>
  );
}
