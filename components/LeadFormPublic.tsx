"use client";

import { useEffect, useRef, useState } from "react";
import type { LeadForm, CustomQuestion } from "@/lib/lead-forms";
import { initializeTrackingConfig, trackFormLead, type TrackingConfig } from "@/lib/tracking";
import type { SeoContent } from "@/lib/seo-content-generator";

type Props = { form: LeadForm; tracking?: TrackingConfig; seoContent?: SeoContent | null };

function CheckIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true" style={{ width: 16, height: 16, flexShrink: 0 }}>
      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
    </svg>
  );
}

type UTMs = {
  utmSource: string; utmMedium: string; utmCampaign: string;
  utmContent: string; utmTerm: string; fbclid: string; gclid: string; fbp: string;
};

function getCookieFbp(): string {
  if (typeof document === "undefined") return "";
  const match = document.cookie.match(/_fbp=([^;]+)/);
  return match?.[1] ?? "";
}

function captureUtms(): UTMs {
  const p = new URLSearchParams(window.location.search);
  return {
    utmSource:   p.get("utm_source")   ?? "",
    utmMedium:   p.get("utm_medium")   ?? "",
    utmCampaign: p.get("utm_campaign") ?? "",
    utmContent:  p.get("utm_content")  ?? "",
    utmTerm:     p.get("utm_term")     ?? "",
    fbclid:      p.get("fbclid")       ?? "",
    gclid:       p.get("gclid")        ?? "",
    fbp:         getCookieFbp(),
  };
}

function formatPhoneDisplay(value: string): string {
  const digits = value.replace(/\D/g, "");
  if (digits.length <= 2) return digits;
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 11) return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  return `+${digits.slice(0, 2)} (${digits.slice(2, 4)}) ${digits.slice(4, 9)}-${digits.slice(9, 13)}`;
}

export function LeadFormPublic({ form, tracking = {}, seoContent }: Props) {
  const [name, setName]             = useState("");
  const [phone, setPhone]           = useState("");
  const [email, setEmail]           = useState("");
  const [procedure, setProcedure]   = useState("");
  const [city, setCity]             = useState("");
  const [observation, setObservation] = useState("");
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState("");
  const [success, setSuccess]       = useState(false);
  const [customAnswers, setCustomAnswers] = useState<Record<string, string>>({});
  const utmsRef                     = useRef<UTMs | null>(null);

  useEffect(() => {
    utmsRef.current = captureUtms();

    // Initialize GTM / GA4 / Google Ads / Meta Pixel for this client
    initializeTrackingConfig(tracking);

    // Track view (fire-and-forget)
    fetch("/api/f/view", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        formId:      form.id,
        clientSlug:  form.clientSlug,
        ...utmsRef.current,
      }),
    }).catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.id, form.clientSlug]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!name.trim()) { setError("Informe seu nome."); return; }
    const digits = phone.replace(/\D/g, "");
    if (digits.length < 10) { setError("Informe um WhatsApp valido."); return; }

    for (const q of (form.customQuestions ?? [])) {
      if (q.required && !customAnswers[q.id]?.trim()) {
        setError(`Responda: "${q.question}"`);
        return;
      }
    }

    setLoading(true);
    try {
      const res = await fetch("/api/f/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientSlug:      form.clientSlug,
          formSlug:        form.slug,
          leadName:        name.trim(),
          leadPhone:       digits,
          leadEmail:       email.trim() || undefined,
          leadProcedure:   procedure.trim() || undefined,
          leadCity:        city.trim() || undefined,
          leadObservation: observation.trim() || undefined,
          customAnswers: Object.keys(customAnswers).length > 0 ? customAnswers : undefined,
          pageUrl:         window.location.href,
          ...utmsRef.current,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError((data as { error?: string }).error || "Erro ao enviar. Tente novamente.");
        return;
      }

      // Fire conversion events — generate_lead → GA4 → Google Ads → Meta Pixel
      const utms = utmsRef.current;
      trackFormLead(tracking, {
        formName:    form.name,
        clientSlug:  form.clientSlug,
        utmSource:   utms?.utmSource,
        utmMedium:   utms?.utmMedium,
        utmCampaign: utms?.utmCampaign,
        utmContent:  utms?.utmContent,
        utmTerm:     utms?.utmTerm,
        gclid:       utms?.gclid,
        fbclid:      utms?.fbclid,
      });

      setSuccess(true);
    } catch {
      setError("Erro de conexao. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  const primary = form.primaryColor || "#16a34a";
  const bg      = form.backgroundColor || "#f0fdf4";

  if (success) {
    return (
      <div className="lf-shell" style={{ background: bg }}>
        <div className="lf-card">
          {form.logoUrl ? (
            <div className="lf-logo-wrap">
              <img src={form.logoUrl} alt="Logo" className="lf-logo" />
            </div>
          ) : null}
          <div className="lf-success-icon" style={{ color: primary }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="lf-title" style={{ color: primary }}>Cadastro enviado!</h1>
          <p className="lf-subtitle">{form.successMessage}</p>
          <button
            type="button"
            className="lf-btn-ghost"
            style={{ borderColor: primary, color: primary }}
            onClick={() => {
              setSuccess(false);
              setName(""); setPhone(""); setEmail("");
              setProcedure(""); setCity(""); setObservation("");
            }}
          >
            Voltar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="lf-shell" style={{ background: bg }}>
      <div className="lf-card">
        {/* Logo */}
        {form.logoUrl ? (
          <div className="lf-logo-wrap">
            <img src={form.logoUrl} alt="Logo" className="lf-logo" />
          </div>
        ) : null}

        {/* Banner image */}
        {form.imageUrl ? (
          <div className="lf-banner-wrap">
            <img src={form.imageUrl} alt="" className="lf-banner" />
          </div>
        ) : null}

        {/* SEO block — only for Google Ads forms, never for Meta */}
        {seoContent ? (
          <div className="lf-seo-block">
            <div className="smart-badge">⭐ {seoContent.badgeText}</div>
            <h1 className="lf-seo-headline">{seoContent.title}</h1>
            <p className="lf-seo-desc">{seoContent.description}</p>
            <ul className="smart-benefits" aria-label="Benefícios">
              {seoContent.bullets.map((b, i) => (
                <li key={i} className="smart-benefit">
                  <span className="smart-benefit__icon" style={{ color: primary }}><CheckIcon /></span>
                  <span>{b}</span>
                </li>
              ))}
            </ul>
            <div className="lf-seo-divider" />
          </div>
        ) : (
          <>
            {/* Default headline (only when no SEO content) */}
            {form.title ? <h1 className="lf-title">{form.title}</h1> : null}
            {form.subtitle ? <p className="lf-subtitle">{form.subtitle}</p> : null}
          </>
        )}

        {/* Form */}
        <form className="lf-form" onSubmit={handleSubmit} noValidate>
          <div className="lf-field">
            <label className="lf-label" htmlFor="lf-name">Nome completo *</label>
            <input
              id="lf-name"
              type="text"
              className="lf-input"
              placeholder="Seu nome"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="name"
              required
            />
          </div>

          <div className="lf-field">
            <label className="lf-label" htmlFor="lf-phone">WhatsApp *</label>
            <input
              id="lf-phone"
              type="tel"
              className="lf-input"
              placeholder="(00) 90000-0000"
              value={phone}
              onChange={(e) => setPhone(formatPhoneDisplay(e.target.value))}
              autoComplete="tel"
              inputMode="numeric"
              required
            />
          </div>

          {form.showEmail ? (
            <div className="lf-field">
              <label className="lf-label" htmlFor="lf-email">E-mail</label>
              <input
                id="lf-email"
                type="email"
                className="lf-input"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
              />
            </div>
          ) : null}

          {form.showProcedure ? (
            <div className="lf-field">
              <label className="lf-label" htmlFor="lf-procedure">Procedimento de interesse</label>
              <input
                id="lf-procedure"
                type="text"
                className="lf-input"
                placeholder="Ex: Botox, Preenchimento..."
                value={procedure}
                onChange={(e) => setProcedure(e.target.value)}
              />
            </div>
          ) : null}

          {form.showCity ? (
            <div className="lf-field">
              <label className="lf-label" htmlFor="lf-city">Cidade</label>
              <input
                id="lf-city"
                type="text"
                className="lf-input"
                placeholder="Sua cidade"
                value={city}
                onChange={(e) => setCity(e.target.value)}
              />
            </div>
          ) : null}

          {form.showObservation ? (
            <div className="lf-field">
              <label className="lf-label" htmlFor="lf-obs">Observacao</label>
              <textarea
                id="lf-obs"
                className="lf-input lf-textarea"
                placeholder="Alguma informacao adicional?"
                value={observation}
                onChange={(e) => setObservation(e.target.value)}
                rows={3}
              />
            </div>
          ) : null}

          {(form.customQuestions ?? []).map((q: CustomQuestion) => (
            <div key={q.id} className="lf-field">
              <label className="lf-label">
                {q.question}{q.required ? " *" : ""}
              </label>
              {q.type === "open_text" ? (
                <input
                  type="text"
                  className="lf-input"
                  placeholder="Sua resposta..."
                  value={customAnswers[q.id] ?? ""}
                  onChange={(e) => setCustomAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))}
                />
              ) : (
                <div className="lf-options">
                  {q.options.filter(Boolean).map((opt, oi) => (
                    <label key={oi} className="lf-option">
                      <input
                        type="radio"
                        name={`cq_${q.id}`}
                        value={opt}
                        checked={customAnswers[q.id] === opt}
                        onChange={() => setCustomAnswers((prev) => ({ ...prev, [q.id]: opt }))}
                      />
                      <span>{opt}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          ))}

          {error ? <p className="lf-error">{error}</p> : null}

          <button
            type="submit"
            className="lf-btn"
            style={{ background: primary }}
            disabled={loading}
          >
            {loading ? "Enviando..." : (form.buttonText || "Enviar")}
          </button>

          <p className="lf-trust">Seus dados estao seguros.</p>
        </form>
      </div>
    </div>
  );
}
