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
  sms: { headline: string; description: string; fallbackBtn: string; trust: string };
  messenger: { headline: string; description: string; fallbackBtn: string; trust: string };
  statusInitial: string;
  statusMid: string;
  statusLate: string;
  statusFinal: string;
  fallbackHint: string;
}> = {
  en: {
    sms: {
      headline: "We're connecting you with our team",
      description: "Your conversation is being prepared. In a few seconds you'll be redirected to your SMS app.",
      fallbackBtn: "Continue to SMS",
      trust: "🔒 Fast and secure service",
    },
    messenger: {
      headline: "We're connecting you on Messenger",
      description: "Opening Messenger to chat with our team. Click the button below if not redirected automatically.",
      fallbackBtn: "Continue to Messenger",
      trust: "🔒 Fast and secure service",
    },
    statusInitial: "Preparing your conversation...",
    statusMid: "Almost there! Opening Messenger...",
    statusLate: "Opening the conversation...",
    statusFinal: "Opening Messenger...",
    fallbackHint: "You're being redirected…",
  },
  pt: {
    sms: {
      headline: "Estamos te conectando com um especialista agora",
      description: "Seu atendimento está sendo preparado. Em poucos segundos você será direcionado para o SMS.",
      fallbackBtn: "Continuar para o SMS",
      trust: "🔒 Atendimento rápido e seguro",
    },
    messenger: {
      headline: "Estamos te conectando pelo Messenger",
      description: "Abrindo o Messenger para falar com nossa equipe. Clique no botão abaixo caso não seja redirecionado.",
      fallbackBtn: "Continuar para o Messenger",
      trust: "🔒 Atendimento rápido e seguro",
    },
    statusInitial: "Preparando seu atendimento...",
    statusMid: "Quase lá! Abrindo o Messenger...",
    statusLate: "Abrindo a conversa...",
    statusFinal: "Abrindo o Messenger...",
    fallbackHint: "Você já está sendo direcionado…",
  },
};

function SmsIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}

function MessengerIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2C6.477 2 2 6.145 2 11.243c0 2.88 1.325 5.453 3.414 7.22V22l3.108-1.71A10.7 10.7 0 0 0 12 20.486c5.523 0 10-4.145 10-9.243S17.523 2 12 2zm1.04 12.45-2.548-2.716-4.974 2.716 5.474-5.811 2.612 2.716 4.91-2.716-5.474 5.811z" />
    </svg>
  );
}

type Props = {
  clientName?: string;
  logoUrl?: string;
  smsUrl?: string;
  smsPhone: string;
  statusText: string;
  channel?: "sms" | "messenger";
};

export function SmsRedirectScreen({ clientName, logoUrl, smsUrl, smsPhone, statusText, channel = "sms" }: Props) {
  const [showFallback, setShowFallback] = useState(false);
  const locale = detectLocale(smsPhone);
  const t = STRINGS[locale];
  const isMessenger = channel === "messenger";
  const channelCopy = isMessenger ? t.messenger : t.sms;
  const accentColor = isMessenger ? "#1877F2" : "#2563eb";
  const accentShadow = isMessenger ? "rgba(24,119,242,0.35)" : "rgba(37,99,235,0.35)";

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

        <h1 className="wzap-headline">{channelCopy.headline}</h1>

        <p className="wzap-subheadline">{channelCopy.description}</p>

        <div className="wzap-progress-wrap" role="progressbar" aria-label="Progresso do redirecionamento">
          <div className="wzap-progress-fill" />
        </div>

        <p className="wzap-status-line">{statusText || t.statusInitial}</p>

        <p className="wzap-support-text">{channelCopy.trust}</p>

        {/* Fallback button — visible after ~2s */}
        <div
          className={`wzap-fallback${showFallback ? " wzap-fallback--visible" : ""}`}
          aria-hidden={!showFallback}
        >
          <p className="wzap-fallback-hint">{t.fallbackHint}</p>
          <a
            href={smsUrl ?? "#"}
            className="wzap-btn"
            style={{ background: accentColor, boxShadow: `0 4px 14px ${accentShadow}` }}
            tabIndex={showFallback ? 0 : -1}
          >
            {isMessenger ? <MessengerIcon /> : <SmsIcon />}
            {channelCopy.fallbackBtn}
          </a>
        </div>
      </section>
    </main>
  );
}
