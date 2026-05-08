"use client";

import { useRef, useState } from "react";
import { PLAN_LIST, type Plan } from "@/lib/plans";

function CheckIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" style={{ width: 13, height: 13, flexShrink: 0, color: "var(--brand)" }}>
      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
    </svg>
  );
}

function SpinnerIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} style={{ width: 14, height: 14, animation: "spin 0.8s linear infinite" }}>
      <path strokeLinecap="round" d="M12 2a10 10 0 0 1 10 10" />
    </svg>
  );
}

function n(v: number | null, unlimited = "Ilimitado") {
  return v === null ? unlimited : v.toLocaleString("pt-BR");
}

const SYSTEM_FEATURES = [
  "CAPI 100% de cobertura",
  "Campanhas e criativos ilimitados",
  "Kanban e Pipeline de leads",
  "Inbox WhatsApp nativo",
  "Relatórios de performance e ROAS",
  "Lead Express (formulários)",
  "Exportação de públicos para Meta",
];

interface PlanCardProps {
  plan: Plan;
  isActive: boolean;
  isLoggedIn: boolean;
  loadingId: string | null;
  onLoadingChange: (id: string | null) => void;
  showAddons?: boolean;
}

function PlanCard({ plan, isActive, isLoggedIn, loadingId, onLoadingChange, showAddons = true }: PlanCardProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const [loading, setLoading] = useState(false);
  const loadingOther = loadingId !== null && loadingId !== plan.key;
  const disabled = loading || loadingOther || isActive || !isLoggedIn;

  function handleClick() {
    if (disabled) return;
    setLoading(true);
    onLoadingChange(plan.key);
    formRef.current?.submit();
  }

  return (
    <div
      style={{
        background: "var(--surface, #fff)",
        border: plan.featured ? "2.5px solid var(--brand)" : "1.5px solid var(--border, #e5e7eb)",
        borderRadius: 16,
        padding: "24px 20px",
        display: "flex",
        flexDirection: "column",
        gap: 14,
        position: "relative",
        boxShadow: plan.featured ? "0 8px 40px rgba(22,163,74,0.13)" : "0 2px 12px rgba(0,0,0,0.05)",
      }}
      className="subscribe-plan-card"
      data-featured={plan.featured}
    >
      {plan.badge && (
        <div style={{
          position: "absolute", top: -12, left: "50%", transform: "translateX(-50%)",
          background: "var(--brand)", color: "#fff",
          fontSize: "0.65rem", fontWeight: 800, letterSpacing: "0.06em",
          padding: "3px 12px", borderRadius: 20, whiteSpace: "nowrap",
        }}>
          {plan.badge}
        </div>
      )}

      {/* Price */}
      <div>
        <div style={{ fontSize: "0.65rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: plan.featured ? "var(--brand)" : "var(--muted, #64748b)", marginBottom: 4 }}>
          {plan.name}
        </div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 3 }}>
          <span style={{ fontSize: "1.9rem", fontWeight: 900, color: "var(--dark, #111)", lineHeight: 1, letterSpacing: "-0.03em" }}>
            R${plan.priceMonthly}
          </span>
          <span style={{ fontSize: "0.78rem", color: "var(--muted, #64748b)" }}>/mês</span>
        </div>
      </div>

      {/* Capacity limits */}
      <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
        {[
          { label: "Clientes", value: n(plan.clientsIncluded) },
          { label: "Leads/mês", value: n(plan.billableLeadsIncluded) },
          { label: "Formulários Lead Express", value: n(plan.leadFormsIncluded) },
          { label: "WhatsApps ativos", value: n(plan.activeWhatsappsIncluded) },
        ].map(({ label, value }) => (
          <div key={label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.78rem" }}>
            <span style={{ color: "var(--muted, #64748b)" }}>{label}</span>
            <span style={{ fontWeight: 700, color: "var(--dark, #111)" }}>{value}</span>
          </div>
        ))}
      </div>

      <div style={{ height: 1, background: "var(--border, #e5e7eb)" }} />

      {/* Full system badge */}
      <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.75rem", fontWeight: 700, color: "var(--brand)", background: "rgba(22,163,74,0.07)", borderRadius: 7, padding: "5px 9px" }}>
        <CheckIcon />
        Sistema completo liberado
      </div>

      {/* System features */}
      <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 6 }}>
        {SYSTEM_FEATURES.map((f) => (
          <li key={f} style={{ display: "flex", alignItems: "flex-start", gap: 7, fontSize: "0.75rem", color: "var(--dark, #111)", lineHeight: 1.4 }}>
            <CheckIcon />
            {f}
          </li>
        ))}
      </ul>

      {/* Add-ons */}
      {showAddons && (plan.extraFormPriceMonthly !== null || plan.extraWhatsappPriceMonthly !== null) && (
        <>
          <div style={{ height: 1, background: "var(--border, #e5e7eb)" }} />
          <div>
            <div style={{ fontSize: "0.65rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--muted, #64748b)", marginBottom: 5 }}>Add-ons</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
              {plan.extraFormPriceMonthly !== null && (
                <div style={{ fontSize: "0.73rem", color: "var(--dark, #111)" }}>
                  + Formulário extra: <strong>R${plan.extraFormPriceMonthly}/mês</strong>
                </div>
              )}
              {plan.extraWhatsappPriceMonthly !== null && (
                <div style={{ fontSize: "0.73rem", color: "var(--dark, #111)" }}>
                  + WhatsApp ativo extra: <strong>R${plan.extraWhatsappPriceMonthly}/mês</strong>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Overage */}
      <div style={{ fontSize: "0.7rem", color: "var(--muted, #64748b)" }}>
        Excedente de lead: R${plan.leadOveragePrice.toFixed(2).replace(".", ",")}/lead
      </div>

      {/* CTA */}
      <div style={{ marginTop: "auto" }}>
        {isActive ? (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 44, borderRadius: 9, background: "rgba(22,163,74,0.1)", border: "1.5px solid rgba(22,163,74,0.3)", color: "var(--brand)", fontSize: "0.84rem", fontWeight: 700, gap: 7 }}>
            <CheckIcon />
            Plano ativo
          </div>
        ) : !isLoggedIn ? (
          <a href="/dashboard" style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 44, borderRadius: 9, background: "#1a1a2e", color: "#fff", fontWeight: 700, fontSize: "0.84rem", textDecoration: "none" }}>
            Fazer login para assinar
          </a>
        ) : (
          // TODO (Stripe): criar price_id por plano (starter/agency/scale/enterprise)
          // TODO (Stripe): atualizar checkout API para mapear plan.key → price_id correto
          <form ref={formRef} action="/api/stripe/checkout" method="post">
            <input type="hidden" name="plan" value={plan.key} />
            <button
              type="button"
              onClick={handleClick}
              disabled={disabled}
              style={{
                display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
                width: "100%", height: 44, borderRadius: 9, border: "none",
                background: plan.featured ? "var(--brand)" : "#1a1a2e",
                color: "#fff", fontWeight: 700, fontSize: "0.84rem",
                cursor: disabled ? "not-allowed" : "pointer",
                opacity: disabled ? 0.7 : 1,
                fontFamily: "inherit",
              }}
            >
              {loading ? <><SpinnerIcon />Redirecionando...</> : `Assinar ${plan.name}`}
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
  showAddons?: boolean;
}

export default function SubscribePlansClient({ isLoggedIn, activePlan, showAddons = true }: Props) {
  const [loadingId, setLoadingId] = useState<string | null>(null);

  return (
    <>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .subscribe-plan-card { transition: transform 0.15s, box-shadow 0.15s; }
        .subscribe-plan-card:hover { transform: translateY(-2px); box-shadow: 0 10px 36px rgba(0,0,0,0.10) !important; }
        .subscribe-plan-card[data-featured="true"]:hover { box-shadow: 0 10px 36px rgba(22,163,74,0.18) !important; }
      `}</style>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: 18, width: "100%" }}>
        {PLAN_LIST.map((plan) => (
          <PlanCard
            key={plan.key}
            plan={plan}
            isActive={activePlan === plan.key}
            isLoggedIn={isLoggedIn}
            loadingId={loadingId}
            onLoadingChange={setLoadingId}
            showAddons={showAddons}
          />
        ))}
      </div>
    </>
  );
}
