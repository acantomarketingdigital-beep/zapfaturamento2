"use client";

import { useState } from "react";
import { BrandLogo } from "@/components/BrandLogo";

type DashboardLoginProps = {
  error?: string;
  configured: boolean;
};

function EyeIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" style={{ width: 16, height: 16 }}>
      <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
      <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" style={{ width: 16, height: 16 }}>
      <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clipRule="evenodd" />
      <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
    </svg>
  );
}

function MagicLoginForm({ configured }: { configured: boolean }) {
  const [emailOrPhone, setEmailOrPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [waUrl, setWaUrl] = useState<string | null>(null);
  const [magicUrl, setMagicUrl] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!emailOrPhone.trim()) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/magic-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emailOrPhone: emailOrPhone.trim() })
      });
      const data = await res.json() as { ok?: boolean; waUrl?: string | null; magicUrl?: string | null; error?: string };
      if (data.error) { setError(data.error); return; }
      setWaUrl(data.waUrl ?? null);
      setMagicUrl(data.magicUrl ?? null);
    } catch {
      setError("Erro de rede. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  function copyLink() {
    if (!magicUrl) return;
    navigator.clipboard.writeText(magicUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  if (waUrl || magicUrl) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <p style={{ fontSize: "0.85rem", color: "var(--muted)", margin: 0 }}>
          Link gerado! Clique abaixo para abrir o WhatsApp ou copie o link.
        </p>
        {waUrl ? (
          <a
            href={waUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="dashboard-button dashboard-button--brand"
            style={{ background: "#25d366", color: "#fff", textAlign: "center", textDecoration: "none" }}
          >
            Abrir no WhatsApp
          </a>
        ) : null}
        {magicUrl ? (
          <button
            type="button"
            className="dashboard-button dashboard-button--ghost"
            onClick={copyLink}
          >
            {copied ? "Copiado!" : "Copiar link"}
          </button>
        ) : null}
        {!waUrl && !magicUrl ? (
          <p style={{ fontSize: "0.85rem", color: "var(--muted)", textAlign: "center" }}>
            Cadastro nao encontrado ou sem WhatsApp vinculado.
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="dashboard-login-form">
      {error ? <div className="dashboard-alert dashboard-alert--error">{error}</div> : null}
      <label className="dashboard-field">
        <span>E-mail ou WhatsApp</span>
        <input
          type="text"
          value={emailOrPhone}
          onChange={(e) => setEmailOrPhone(e.target.value)}
          placeholder="voce@empresa.com ou (11) 99999-9999"
          autoComplete="email"
          disabled={!configured}
          required
        />
      </label>
      <button
        type="submit"
        className="dashboard-button dashboard-button--brand"
        disabled={!configured || loading}
        style={{ marginTop: 4, height: 42, fontSize: "0.92rem" }}
      >
        {loading ? "Gerando link..." : "Gerar link de acesso"}
      </button>
    </form>
  );
}

export function DashboardLogin({ error, configured }: DashboardLoginProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [magicMode, setMagicMode] = useState(false);

  const errorFromUrl = typeof window !== "undefined"
    ? new URLSearchParams(window.location.search).get("error")
    : "";
  const magicInvalid = errorFromUrl === "magic_invalid";

  return (
    <main className="dashboard-auth-shell">
      <section className="dashboard-auth-showcase">
        <span className="dashboard-auth-showcase__eyebrow">Zap Faturamento</span>
        <h1>Um painel moderno para medir leads, atendimento e receita.</h1>
        <p>
          Organize clientes, campanhas, WhatsApp, Kanban e faturamento em uma
          experiencia com cara de software premium.
        </p>

        <div className="dashboard-auth-showcase__stats">
          <article>
            <span>Tracking</span>
            <strong>Meta + Google</strong>
          </article>
          <article>
            <span>Kanban</span>
            <strong>Pipeline comercial</strong>
          </article>
          <article>
            <span>Performance</span>
            <strong>ROAS e receita</strong>
          </article>
        </div>
      </section>

      <section className="dashboard-auth-card">
        <BrandLogo variant="horizontal" className="dashboard-auth-card__logo" priority />

        <div>
          <h1>Bem-vindo de volta</h1>
          <p className="dashboard-auth-card__lead">
            Acompanhe leads, Kanban, investimentos e ROAS em um unico painel.
          </p>
        </div>

        {!configured ? (
          <div className="dashboard-alert dashboard-alert--warning">
            Defina <code>DASHBOARD_PASSWORD</code> no ambiente para liberar o login.
          </div>
        ) : null}

        {(error || magicInvalid) ? (
          <div className="dashboard-alert dashboard-alert--error">
            {magicInvalid ? "Link de acesso invalido ou expirado." : error}
          </div>
        ) : null}

        {magicMode ? (
          <>
            <p style={{ fontWeight: 600, marginBottom: 4 }}>Entrar sem senha</p>
            <MagicLoginForm configured={configured} />
            <div style={{ marginTop: 14, textAlign: "center" }}>
              <button
                type="button"
                onClick={() => setMagicMode(false)}
                className="dashboard-auth-card__forgot-link"
                style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}
              >
                Voltar para login com senha
              </button>
            </div>
          </>
        ) : (
          <>
            <form action="/api/auth/login" method="post" className="dashboard-login-form">
              <label className="dashboard-field">
                <span>E-mail</span>
                <input
                  type="email"
                  name="email"
                  placeholder="voce@empresa.com"
                  autoComplete="email"
                  disabled={!configured}
                />
                <small className="dashboard-field__help">
                  Se nao houver usuario cadastrado, entre usando apenas a senha administrativa.
                </small>
              </label>

              <label className="dashboard-field">
                <span>Senha</span>
                <div className="dashboard-password-wrap">
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    placeholder="••••••••"
                    autoComplete="current-password"
                    disabled={!configured}
                    required
                  />
                  <button
                    type="button"
                    className="dashboard-password-eye"
                    onClick={() => setShowPassword((v) => !v)}
                    tabIndex={-1}
                    aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                    disabled={!configured}
                  >
                    {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                  </button>
                </div>
              </label>

              <button
                type="submit"
                className="dashboard-button dashboard-button--brand"
                disabled={!configured}
                style={{ marginTop: 4, height: 42, fontSize: "0.92rem" }}
              >
                Entrar no painel
              </button>
            </form>

            <div style={{ marginTop: 14, textAlign: "center", display: "flex", flexDirection: "column", gap: 8 }}>
              <a href="/redefinir-senha" className="dashboard-auth-card__forgot-link">
                Esqueci minha senha
              </a>
              <button
                type="button"
                onClick={() => setMagicMode(true)}
                className="dashboard-auth-card__forgot-link"
                style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}
              >
                Entrar sem senha (link magico)
              </button>
            </div>
          </>
        )}
      </section>
    </main>
  );
}
