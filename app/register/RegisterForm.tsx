"use client";

import { useState } from "react";
import { BrandLogo } from "@/components/BrandLogo";

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

interface Props {
  error?: string;
  plan?: string;
}

export function RegisterForm({ error, plan }: Props) {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const isCrm = plan === "crm";

  return (
    <main className="dashboard-auth-shell">
      <section className="dashboard-auth-showcase">
        <span className="dashboard-auth-showcase__eyebrow">
          {isCrm ? "ZapFaturamento CRM" : "Zap Faturamento"}
        </span>
        <h1>
          {isCrm
            ? "CRM para WhatsApp. 7 dias grátis."
            : "Comece grátis por 7 dias. Sem cartão de crédito."}
        </h1>
        <p>
          {isCrm
            ? "Organize leads, atendimento e follow-up no WhatsApp — tudo em um painel feito para o seu negócio."
            : "Organize clientes, campanhas, WhatsApp, Kanban e faturamento em uma experiência com cara de software premium."}
        </p>

        <div className="dashboard-auth-showcase__stats">
          {isCrm ? (
            <>
              <article>
                <span>Trial</span>
                <strong>7 dias grátis</strong>
              </article>
              <article>
                <span>Kanban</span>
                <strong>Pipeline de leads</strong>
              </article>
              <article>
                <span>CRM</span>
                <strong>WhatsApp nativo</strong>
              </article>
            </>
          ) : (
            <>
              <article>
                <span>Trial</span>
                <strong>7 dias grátis</strong>
              </article>
              <article>
                <span>Kanban</span>
                <strong>Pipeline comercial</strong>
              </article>
              <article>
                <span>Performance</span>
                <strong>ROAS e receita</strong>
              </article>
            </>
          )}
        </div>
      </section>

      <section className="dashboard-auth-card">
        <BrandLogo variant="horizontal" className="dashboard-auth-card__logo" priority />

        {isCrm && (
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            padding: "5px 12px", borderRadius: 20,
            background: "rgba(22,163,74,0.1)", border: "1px solid rgba(22,163,74,0.3)",
            fontSize: "0.72rem", fontWeight: 700, color: "var(--brand)",
            marginBottom: 4,
          }}>
            Plano CRM · R$79,90/mês após o trial
          </div>
        )}

        <div>
          <h1>{isCrm ? "Testar CRM grátis" : "Criar sua conta"}</h1>
          <p className="dashboard-auth-card__lead">
            {isCrm
              ? "7 dias grátis, sem cartão. Acesso completo ao CRM."
              : "7 dias grátis, depois escolha o plano que faz mais sentido."}
          </p>
        </div>

        {error && (
          <div className="dashboard-alert dashboard-alert--error">{error}</div>
        )}

        <form
          action="/api/auth/register"
          method="post"
          className="dashboard-login-form"
          onSubmit={() => setLoading(true)}
        >
          {isCrm && <input type="hidden" name="plan" value="crm" />}

          <label className="dashboard-field">
            <span>Nome completo</span>
            <input
              type="text"
              name="name"
              placeholder="Seu nome"
              autoComplete="name"
              required
            />
          </label>

          <label className="dashboard-field">
            <span>E-mail</span>
            <input
              type="email"
              name="email"
              placeholder="voce@empresa.com"
              autoComplete="email"
              required
            />
          </label>

          <label className="dashboard-field">
            <span>{isCrm ? "Nome do seu negócio" : "Nome da agência / empresa"}</span>
            <input
              type="text"
              name="agency_name"
              placeholder={isCrm ? "Clínica Bem Estar" : "Minha Agência Digital"}
              autoComplete="organization"
              required
            />
          </label>

          <label className="dashboard-field">
            <span>Senha</span>
            <div className="dashboard-password-wrap">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="Mínimo 6 caracteres"
                autoComplete="new-password"
                required
                minLength={6}
              />
              <button
                type="button"
                className="dashboard-password-eye"
                onClick={() => setShowPassword((v) => !v)}
                tabIndex={-1}
                aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
              >
                {showPassword ? <EyeOffIcon /> : <EyeIcon />}
              </button>
            </div>
          </label>

          <button
            type="submit"
            className="dashboard-button dashboard-button--brand"
            disabled={loading}
            style={{ marginTop: 4, height: 42, fontSize: "0.92rem" }}
          >
            {loading
              ? "Criando conta…"
              : isCrm
                ? "Testar CRM grátis →"
                : "Criar conta grátis →"}
          </button>

          <p style={{ textAlign: "center", fontSize: "0.78rem", color: "var(--muted)", margin: "12px 0 0" }}>
            Sem cartão de crédito · Cancele quando quiser
          </p>

          <div style={{ marginTop: 16, textAlign: "center", borderTop: "1px solid var(--border)", paddingTop: 16 }}>
            <span style={{ fontSize: "0.84rem", color: "var(--muted)" }}>
              Já tem uma conta?{" "}
              <a href="/login" style={{ color: "var(--brand)", fontWeight: 600, textDecoration: "none" }}>
                Fazer login
              </a>
            </span>
          </div>
        </form>
      </section>
    </main>
  );
}
