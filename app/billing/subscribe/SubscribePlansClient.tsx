"use client";

import { useRef, useState } from "react";

const FEATURES = [
  "Kanban de leads e vendas ilimitado",
  "Campanhas e criativos ilimitados por cliente",
  "Relatórios de performance, CPL e ROAS",
  "Exportação de públicos para Meta (Lookalike)",
  "Instagram Direct e Facebook Messenger no CRM",
  "Suporte prioritário via WhatsApp",
];

function CheckIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" style={{ width: 15, height: 15, flexShrink: 0, color: "var(--brand)" }}>
      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
    </svg>
  );
}

function SpinnerIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} style={{ width: 16, height: 16, flexShrink: 0, animation: "spin 0.8s linear infinite" }}>
      <path strokeLinecap="round" d="M12 2a10 10 0 0 1 10 10" />
    </svg>
  );
}

interface PlanCardProps {
  plan: "monthly" | "yearly";
  name: string;
  price: string;
  period: string;
  sub: string;
  badge?: string;
  featured?: boolean;
  isActive?: boolean;
  isLoggedIn: boolean;
  loadingOther: boolean;
  onLoadingChange: (plan: "monthly" | "yearly" | null) => void;
}

function PlanCard({
  plan,
  name,
  price,
  period,
  sub,
  badge,
  featured,
  isActive,
  isLoggedIn,
  loadingOther,
  onLoadingChange,
}: PlanCardProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const [loading, setLoading] = useState(false);

  function handleClick() {
    if (loading || loadingOther || isActive || !isLoggedIn) return;
    setLoading(true);
    onLoadingChange(plan);
    formRef.current?.submit();
  }

  const disabled = loading || loadingOther || isActive || !isLoggedIn;

  return (
    <div
      style={{
        background: featured ? "var(--surface)" : "var(--surface)",
        border: featured ? "2.5px solid var(--brand)" : "1.5px solid var(--border)",
        borderRadius: 18,
        padding: "32px 28px",
        display: "flex",
        flexDirection: "column",
        gap: 20,
        position: "relative",
        boxShadow: featured
          ? "0 8px 40px rgba(22,163,74,0.13)"
          : "0 2px 16px rgba(0,0,0,0.06)",
        transition: "transform 0.15s, box-shadow 0.15s",
      }}
      className="subscribe-plan-card"
      data-featured={featured}
    >
      {badge && (
        <div style={{
          position: "absolute",
          top: -14,
          left: "50%",
          transform: "translateX(-50%)",
          background: "var(--brand)",
          color: "#fff",
          fontSize: "0.72rem",
          fontWeight: 800,
          letterSpacing: "0.04em",
          padding: "4px 16px",
          borderRadius: 20,
          whiteSpace: "nowrap",
        }}>
          {badge}
        </div>
      )}

      {/* Header */}
      <div>
        <div style={{
          fontSize: "0.72rem",
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: "0.07em",
          color: featured ? "var(--brand)" : "var(--muted)",
          marginBottom: 10,
        }}>
          {name}
        </div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
          <span style={{ fontSize: "2.4rem", fontWeight: 900, color: "var(--dark)", lineHeight: 1, letterSpacing: "-0.03em" }}>
            {price}
          </span>
          <span style={{ fontSize: "0.88rem", color: "var(--muted)" }}>{period}</span>
        </div>
        <p style={{ fontSize: "0.8rem", color: "var(--muted)", margin: "6px 0 0" }}>
          {sub}
        </p>
      </div>

      {/* Features */}
      <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 10 }}>
        {FEATURES.map((f) => (
          <li key={f} style={{ display: "flex", alignItems: "flex-start", gap: 9, fontSize: "0.84rem", color: "var(--dark)", lineHeight: 1.45 }}>
            <CheckIcon />
            {f}
          </li>
        ))}
      </ul>

      {/* CTA */}
      <div style={{ marginTop: "auto" }}>
        {isActive ? (
          <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            height: 50,
            borderRadius: 10,
            background: "rgba(22,163,74,0.1)",
            border: "1.5px solid rgba(22,163,74,0.3)",
            color: "var(--brand)",
            fontSize: "0.9rem",
            fontWeight: 700,
            gap: 8,
          }}>
            <svg viewBox="0 0 20 20" fill="currentColor" style={{ width: 16, height: 16 }}>
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            Plano ativo
          </div>
        ) : !isLoggedIn ? (
          <a
            href="/dashboard"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              height: 50,
              borderRadius: 10,
              background: "#1a1a2e",
              color: "#fff",
              fontWeight: 700,
              fontSize: "0.9rem",
              textDecoration: "none",
            }}
          >
            Fazer login para assinar
          </a>
        ) : (
          <form ref={formRef} action="/api/stripe/checkout" method="post">
            <input type="hidden" name="plan" value={plan} />
            <button
              type="button"
              onClick={handleClick}
              disabled={disabled}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                width: "100%",
                height: 50,
                borderRadius: 10,
                border: "none",
                background: featured ? "var(--brand)" : "#1a1a2e",
                color: "#fff",
                fontWeight: 700,
                fontSize: "0.9rem",
                cursor: disabled ? "not-allowed" : "pointer",
                opacity: disabled ? 0.7 : 1,
                transition: "opacity 0.15s, transform 0.1s",
                fontFamily: "inherit",
              }}
            >
              {loading ? (
                <>
                  <SpinnerIcon />
                  Redirecionando...
                </>
              ) : (
                `Assinar ${name}`
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

interface Props {
  isLoggedIn: boolean;
  activePlan: "monthly" | "yearly" | null;
}

export default function SubscribePlansClient({ isLoggedIn, activePlan }: Props) {
  const [loadingPlan, setLoadingPlan] = useState<"monthly" | "yearly" | null>(null);

  return (
    <>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .subscribe-plan-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 48px rgba(0,0,0,0.12) !important;
        }
        .subscribe-plan-card[data-featured="true"]:hover {
          box-shadow: 0 12px 48px rgba(22,163,74,0.2) !important;
        }
      `}</style>

      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
        gap: 24,
        width: "100%",
        maxWidth: 740,
      }}>
        <PlanCard
          plan="monthly"
          name="Pro Mensal"
          price="R$97"
          period="/mês"
          sub="Cobrado mensalmente · Cancele quando quiser"
          isActive={activePlan === "monthly"}
          isLoggedIn={isLoggedIn}
          loadingOther={loadingPlan === "yearly"}
          onLoadingChange={setLoadingPlan}
        />
        <PlanCard
          plan="yearly"
          name="Pro Anual"
          price="R$997"
          period="/ano"
          sub="R$83/mês · Economize R$167 por ano"
          badge="Mais vantajoso"
          featured
          isActive={activePlan === "yearly"}
          isLoggedIn={isLoggedIn}
          loadingOther={loadingPlan === "monthly"}
          onLoadingChange={setLoadingPlan}
        />
      </div>
    </>
  );
}
