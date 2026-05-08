"use client";

import { useRef, useState } from "react";
import { PLAN_LIST, type Plan } from "@/lib/plans";

function CheckIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" style={{ width: 14, height: 14, flexShrink: 0, color: "var(--brand)" }}>
      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
    </svg>
  );
}

function SpinnerIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} style={{ width: 15, height: 15, flexShrink: 0, animation: "spin 0.8s linear infinite" }}>
      <path strokeLinecap="round" d="M12 2a10 10 0 0 1 10 10" />
    </svg>
  );
}

function formatLeads(n: number) {
  return n.toLocaleString("pt-BR");
}

interface PlanCardProps {
  plan: Plan;
  isActive: boolean;
  isLoggedIn: boolean;
  loadingId: string | null;
  onLoadingChange: (id: string | null) => void;
}

function PlanCard({ plan, isActive, isLoggedIn, loadingId, onLoadingChange }: PlanCardProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const [loading, setLoading] = useState(false);
  const loadingOther = loadingId !== null && loadingId !== plan.id;

  function handleClick() {
    if (loading || loadingOther || isActive || !isLoggedIn) return;
    setLoading(true);
    onLoadingChange(plan.id);
    formRef.current?.submit();
  }

  const disabled = loading || loadingOther || isActive || !isLoggedIn;

  return (
    <div
      style={{
        background: "var(--surface)",
        border: plan.featured ? "2.5px solid var(--brand)" : "1.5px solid var(--border)",
        borderRadius: 16,
        padding: "28px 24px",
        display: "flex",
        flexDirection: "column",
        gap: 16,
        position: "relative",
        boxShadow: plan.featured
          ? "0 8px 40px rgba(22,163,74,0.13)"
          : "0 2px 12px rgba(0,0,0,0.06)",
        transition: "transform 0.15s, box-shadow 0.15s",
      }}
      className="subscribe-plan-card"
      data-featured={plan.featured}
    >
      {plan.badge && (
        <div style={{
          position: "absolute",
          top: -13,
          left: "50%",
          transform: "translateX(-50%)",
          background: "var(--brand)",
          color: "#fff",
          fontSize: "0.68rem",
          fontWeight: 800,
          letterSpacing: "0.05em",
          padding: "3px 14px",
          borderRadius: 20,
          whiteSpace: "nowrap",
        }}>
          {plan.badge}
        </div>
      )}

      {/* Header */}
      <div>
        <div style={{
          fontSize: "0.68rem",
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: "0.07em",
          color: plan.featured ? "var(--brand)" : "var(--muted)",
          marginBottom: 6,
        }}>
          {plan.name}
        </div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 3 }}>
          <span style={{ fontSize: "2rem", fontWeight: 900, color: "var(--dark)", lineHeight: 1, letterSpacing: "-0.03em" }}>
            R${plan.monthlyPrice}
          </span>
          <span style={{ fontSize: "0.8rem", color: "var(--muted)" }}>/mês</span>
        </div>
        <p style={{ fontSize: "0.75rem", color: "var(--muted)", margin: "4px 0 0" }}>
          {plan.description}
        </p>
      </div>

      {/* Limits chips */}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        <span style={{
          fontSize: "0.72rem",
          fontWeight: 600,
          padding: "3px 9px",
          borderRadius: 6,
          background: plan.featured ? "rgba(22,163,74,0.1)" : "rgba(0,0,0,0.05)",
          color: plan.featured ? "var(--brand)" : "var(--muted)",
        }}>
          {plan.clientsLimit === null ? "∞ clientes" : `${plan.clientsLimit} clientes`}
        </span>
        <span style={{
          fontSize: "0.72rem",
          fontWeight: 600,
          padding: "3px 9px",
          borderRadius: 6,
          background: plan.featured ? "rgba(22,163,74,0.1)" : "rgba(0,0,0,0.05)",
          color: plan.featured ? "var(--brand)" : "var(--muted)",
        }}>
          {formatLeads(plan.leadsLimit)} leads/mês
        </span>
      </div>

      {/* Features */}
      <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 8, flexGrow: 1 }}>
        {plan.features.map((f) => (
          <li key={f} style={{ display: "flex", alignItems: "flex-start", gap: 8, fontSize: "0.8rem", color: "var(--dark)", lineHeight: 1.4 }}>
            <CheckIcon />
            {f}
          </li>
        ))}
      </ul>

      {/* Overage note */}
      <p style={{ fontSize: "0.7rem", color: "var(--muted)", margin: 0 }}>
        Excedente: R${plan.overagePerLead.toFixed(2).replace(".", ",")}/lead
      </p>

      {/* CTA */}
      <div style={{ marginTop: "auto" }}>
        {isActive ? (
          <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            height: 46,
            borderRadius: 10,
            background: "rgba(22,163,74,0.1)",
            border: "1.5px solid rgba(22,163,74,0.3)",
            color: "var(--brand)",
            fontSize: "0.86rem",
            fontWeight: 700,
            gap: 8,
          }}>
            <svg viewBox="0 0 20 20" fill="currentColor" style={{ width: 15, height: 15 }}>
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
              height: 46,
              borderRadius: 10,
              background: "#1a1a2e",
              color: "#fff",
              fontWeight: 700,
              fontSize: "0.86rem",
              textDecoration: "none",
            }}
          >
            Fazer login para assinar
          </a>
        ) : (
          // TODO: wire Stripe price IDs for each new plan (starter/agency/scale/enterprise)
          // Currently posts plan ID; checkout API needs updating with per-plan price IDs
          <form ref={formRef} action="/api/stripe/checkout" method="post">
            <input type="hidden" name="plan" value={plan.id} />
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
                height: 46,
                borderRadius: 10,
                border: "none",
                background: plan.featured ? "var(--brand)" : "#1a1a2e",
                color: "#fff",
                fontWeight: 700,
                fontSize: "0.86rem",
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
                `Assinar ${plan.name}`
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
  activePlan: string | null;
}

export default function SubscribePlansClient({ isLoggedIn, activePlan }: Props) {
  const [loadingId, setLoadingId] = useState<string | null>(null);

  return (
    <>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .subscribe-plan-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 40px rgba(0,0,0,0.10) !important;
        }
        .subscribe-plan-card[data-featured="true"]:hover {
          box-shadow: 0 12px 40px rgba(22,163,74,0.18) !important;
        }
      `}</style>

      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
        gap: 20,
        width: "100%",
      }}>
        {PLAN_LIST.map((plan) => (
          <PlanCard
            key={plan.id}
            plan={plan}
            isActive={activePlan === plan.id}
            isLoggedIn={isLoggedIn}
            loadingId={loadingId}
            onLoadingChange={setLoadingId}
          />
        ))}
      </div>
    </>
  );
}
