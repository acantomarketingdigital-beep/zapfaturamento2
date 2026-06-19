"use client";

import { useEffect, useState } from "react";
import { CustomerLogo } from "@/components/CustomerLogo";

type Locale = "en" | "pt";

function detectLocale(phone: string): Locale {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("1") && digits.length >= 10 && digits.length <= 11) return "en";
  return "pt";
}

const STRINGS: Record<Locale, {
  headline: string;
  description: string;
  statusInitial: string;
  statusMid: string;
  statusLate: string;
  statusFinal: string;
  fallbackHint: string;
  fallbackBtn: string;
  trust: string;
}> = {
  en: {
    headline: "We're connecting you with our team",
    description: "Your conversation is being prepared. In a few seconds you'll be redirected to your SMS app.",
    statusInitial: "Preparing your conversation...",
    statusMid: "Almost there! Opening SMS...",
    statusLate: "Opening the conversation...",
    statusFinal: "Opening SMS app...",
    fallbackHint: "You're being redirected…",
    fallbackBtn: "Continue to SMS",
    trust: "🔒 Fast and secure service",
  },
  pt: {
    headline: "Estamos te conectando com um especialista agora",
    description: "Seu atendimento está sendo preparado. Em poucos segundos você será direcionado para o SMS.",
    statusInitial: "Preparando seu atendimento...",
    statusMid: "Quase lá! Abrindo o SMS...",
    statusLate: "Abrindo a conversa...",
    statusFinal: "Abrindo o app de SMS...",
    fallbackHint: "Você já está sendo direcionado…",
    fallbackBtn: "Continuar para o SMS",
    trust: "🔒 Atendimento rápido e seguro",
  },
};

function SmsIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}

type Props = {
  clientName?: string;
  logoUrl?: string;
  smsUrl?: string;
  smsPhone: string;
  statusText: string;
};

export function SmsRedirectScreen({ clientName, logoUrl, smsUrl, smsPhone, statusText }: Props) {
  const [showFallback, setShowFallback] = useState(false);
  const locale = detectLocale(smsPhone);
  const t = STRINGS[locale];

  useEffect(() => {
    if (!smsUrl) return;
    const timer = window.setTimeout(() => setShowFallback(true), 2000);
    return () => window.clearTimeout(timer);
  }, [smsUrl]);

  return (
    <main className="wzap-shell">
      <section className="wzap-card">
        {/* Logo */}
        <div className="wzap-logo-wrap">
          <CustomerLogo
            logoUrl={logoUrl}
            clientName={clientName ?? ""}
            imageClassName="wzap-logo"
            placeholderClassName="wzap-logo wzap-logo--placeholder"
          />
        </div>

        {clientName && (
          <span className="wzap-client-tag">{clientName}</span>
        )}

        <h1 className="wzap-headline">{t.headline}</h1>

        <p className="wzap-subheadline">{t.description}</p>

        <div className="wzap-progress-wrap" role="progressbar" aria-label="Progresso do redirecionamento">
          <div className="wzap-progress-fill" />
        </div>

        <p className="wzap-status-line">{statusText || t.statusInitial}</p>

        <p className="wzap-support-text">{t.trust}</p>

        {/* Fallback button — visible after ~2s */}
        <div
          className={`wzap-fallback${showFallback ? " wzap-fallback--visible" : ""}`}
          aria-hidden={!showFallback}
        >
          <p className="wzap-fallback-hint">{t.fallbackHint}</p>
          <a
            href={smsUrl ?? "#"}
            className="wzap-btn"
            style={{ background: "#2563eb", boxShadow: "0 4px 14px rgba(37,99,235,0.35)" }}
            tabIndex={showFallback ? 0 : -1}
          >
            <SmsIcon />
            {t.fallbackBtn}
          </a>
        </div>
      </section>
    </main>
  );
}
