"use client";

import { useEffect, useState } from "react";
import { CustomerLogo } from "@/components/CustomerLogo";

export type WhatsAppRedirectScreenProps = {
  clientName?: string;
  logoUrl?: string;
  title: string;
  description: string;
  statusText?: string;
  isError?: boolean;
  whatsappUrl?: string;
};

function WhatsAppIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      style={{ width: 20, height: 20, flexShrink: 0 }}
    >
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

function WarningIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
      style={{ width: 28, height: 28 }}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
      />
    </svg>
  );
}


export function WhatsAppRedirectScreen({
  clientName,
  logoUrl,
  title,
  description,
  statusText,
  isError = false,
  whatsappUrl
}: WhatsAppRedirectScreenProps) {
  const [showFallback, setShowFallback] = useState(false);

  useEffect(() => {
    if (isError || !whatsappUrl) return;
    const t = window.setTimeout(() => setShowFallback(true), 2000);
    return () => window.clearTimeout(t);
  }, [isError, whatsappUrl]);

  if (isError) {
    return (
      <main className="wzap-shell">
        <section className="wzap-card wzap-card--error">
          <div className="wzap-error-icon">
            <WarningIcon />
          </div>
          <h1 className="wzap-error-title">{title}</h1>
          <p className="wzap-error-desc">{description}</p>
          {statusText ? <p className="wzap-error-status">{statusText}</p> : null}
        </section>
      </main>
    );
  }

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

        {/* Client name tag */}
        {clientName ? (
          <span className="wzap-client-tag">{clientName}</span>
        ) : null}

        {/* Main headline */}
        <h1 className="wzap-headline">
          Estamos te conectando com um especialista agora
        </h1>

        {/* Sub headline */}
        <p className="wzap-subheadline">
          Seu atendimento esta sendo preparado. Em poucos segundos voce sera
          direcionado para o WhatsApp.
        </p>

        {/* Progress bar */}
        <div className="wzap-progress-wrap" role="progressbar" aria-label="Progresso do redirecionamento">
          <div className="wzap-progress-fill" />
        </div>

        {/* Dynamic status */}
        <p className="wzap-status-line">
          {statusText ?? "Isso pode levar ate 3 segundos..."}
        </p>

        {/* Support text */}
        <p className="wzap-support-text">
          Aguarde um instante para ser atendido mais rápido.
        </p>

        {/* Fallback button — visible after ~2s */}
        <div
          className={`wzap-fallback${showFallback ? " wzap-fallback--visible" : ""}`}
          aria-hidden={!showFallback}
        >
          <p className="wzap-fallback-hint">
            Você já está sendo direcionado…
          </p>
          <a
            href={whatsappUrl ?? "#"}
            className="wzap-btn"
            rel="noopener noreferrer"
            tabIndex={showFallback ? 0 : -1}
          >
            <WhatsAppIcon />
            Continuar para o WhatsApp
          </a>
        </div>

        {/* Trust badge */}
        <div className="wzap-trust">
          <span>🔒 Atendimento rápido e seguro</span>
        </div>
      </section>
    </main>
  );
}
