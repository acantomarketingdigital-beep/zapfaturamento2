import { DashboardLogin } from "@/components/dashboard/DashboardLogin";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { getCurrentUser, isDashboardConfigured } from "@/lib/dashboard-auth";
import { getCachedBillingStatus } from "@/lib/billing";
import { isStripeConfigured } from "@/lib/stripe";
import { hasDatabaseConfig } from "@/lib/db";
import SubscribePlansClient from "@/app/billing/subscribe/SubscribePlansClient";
import { getWorkspaceUsage } from "@/lib/billing-usage";
import { getPlanById, PLAN_LIST } from "@/lib/plans";

const FEATURES = [
  "Links rastreáveis para Meta e Google Ads",
  "Campanhas ilimitadas por cliente",
  "Kanban de leads e vendas",
  "Exportação de públicos para Meta (Lookalike)",
  "Relatórios de performance, CPL e ROAS",
  "Suporte prioritário via WhatsApp",
];

const SUB_STATUS_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  active:    { label: "Ativa",                color: "#166534", bg: "rgba(34,197,94,0.12)" },
  trialing:  { label: "Trial",               color: "#92400e", bg: "rgba(234,179,8,0.12)" },
  past_due:  { label: "Pagamento atrasado",  color: "#9a3412", bg: "rgba(239,68,68,0.1)"  },
  canceled:  { label: "Cancelada",           color: "#6b7280", bg: "rgba(107,114,128,0.1)" },
  inactive:  { label: "Inativa",             color: "#6b7280", bg: "rgba(107,114,128,0.1)" },
};

function CheckIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" style={{ width: 16, height: 16, flexShrink: 0, color: "var(--brand)" }}>
      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
    </svg>
  );
}

export default async function DashboardAssinaturaPage() {
  const user = await getCurrentUser();
  const databaseReady = hasDatabaseConfig();

  if (!user) {
    return <DashboardLogin configured={isDashboardConfigured()} error="" />;
  }

  let billing = null;
  if (databaseReady && user.kind !== "env_admin") {
    try {
      billing = await getCachedBillingStatus(user.id);
    } catch {
      // ignore billing errors
    }
  }

  const stripeReady       = isStripeConfigured();
  const isEnvAdmin        = user.kind === "env_admin";
  const isPro             = isEnvAdmin || billing?.planType === "pro";
  const isTrial           = !isEnvAdmin && billing?.planType === "trial" && !billing.isBlocked;
  const daysLeft          = isTrial ? (billing?.daysLeft ?? 0) : null;
  const isPastDue         = billing?.subscriptionStatus === "past_due";
  const hasStripeCustomer = Boolean(billing?.stripeCustomerId);
  const activePlan        = billing?.subscriptionPlan ?? null;
  const subStatusInfo     = billing?.subscriptionStatus
    ? (SUB_STATUS_LABELS[billing.subscriptionStatus] ?? null)
    : null;

  const knownPlan = getPlanById(activePlan);
  const planLabel = knownPlan
    ? `${knownPlan.name} — R$${knownPlan.monthlyPrice}/mês`
    : activePlan === "yearly" ? "Pro Anual (legado)"
    : activePlan === "monthly" ? "Pro Mensal (legado)"
    : "Zap Faturamento";
  const planPrice = knownPlan
    ? `R$${knownPlan.monthlyPrice}/mês`
    : activePlan === "yearly" ? "R$997/ano"
    : activePlan === "monthly" ? "R$97/mês"
    : "—";

  let usage = null;
  if (databaseReady && !isEnvAdmin) {
    try {
      usage = await getWorkspaceUsage(user.clientSlug, activePlan);
    } catch {
      // non-critical
    }
  }

  return (
    <main className="dashboard-shell">
      <DashboardSidebar
        activePath="/dashboard/configuracoes"
        databaseReady={databaseReady}
        user={user}
      />

      <section className="dashboard-main">
        <header className="dashboard-topbar">
          <div>
            <span className="dashboard-eyebrow">Conta</span>
            <h2>Assinatura</h2>
            <p>Seu plano e status de acesso ao Zap Faturamento.</p>
          </div>
        </header>

        {/* Stat cards */}
        <div className="dashboard-stats-grid" style={{ gridTemplateColumns: "repeat(3, minmax(0, 1fr))" }}>
          <article className={`dashboard-stat-card ${isPro ? "dashboard-stat-card--success" : "dashboard-stat-card--neutral"}`}>
            <span>Status</span>
            <strong style={{ fontSize: "1rem", letterSpacing: 0 }}>
              {isEnvAdmin ? "Admin" : isPro ? "Plano ativo" : isTrial ? "Trial ativo" : "Expirado"}
            </strong>
          </article>

          <article className="dashboard-stat-card dashboard-stat-card--neutral">
            <span>Plano</span>
            <strong style={{ fontSize: "1rem", letterSpacing: 0 }}>{planLabel}</strong>
          </article>

          <article className="dashboard-stat-card dashboard-stat-card--neutral">
            <span>Valor</span>
            <strong>{planPrice}</strong>
          </article>
        </div>

        {/* Stripe status badge */}
        {subStatusInfo && (
          <div style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "6px 14px",
            borderRadius: 8,
            background: subStatusInfo.bg,
            color: subStatusInfo.color,
            fontSize: "0.82rem",
            fontWeight: 600,
          }}>
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: subStatusInfo.color, display: "inline-block" }} />
            Stripe: {subStatusInfo.label}
          </div>
        )}

        {/* Trial countdown */}
        {isTrial && daysLeft !== null && (
          <div style={{
            background: daysLeft <= 2 ? "rgba(239,68,68,0.07)" : "rgba(234,179,8,0.08)",
            border: `1px solid ${daysLeft <= 2 ? "rgba(239,68,68,0.25)" : "rgba(234,179,8,0.3)"}`,
            color: "var(--dark)",
            borderRadius: 12,
            padding: "14px 18px",
            display: "flex",
            alignItems: "center",
            gap: 10,
            fontSize: "0.88rem",
          }}>
            <svg viewBox="0 0 20 20" fill="currentColor" style={{ width: 18, height: 18, flexShrink: 0, color: daysLeft <= 2 ? "#dc2626" : "#ca8a04" }}>
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
            </svg>
            <span>
              Você está no <strong>teste grátis</strong>.{" "}
              {daysLeft === 0
                ? "Seu trial expira hoje."
                : daysLeft === 1
                  ? "Falta 1 dia para o encerramento."
                  : `Faltam ${daysLeft} dias para o encerramento.`}
              {" "}Assine para continuar com acesso completo.
            </span>
          </div>
        )}

        {/* Past due alert */}
        {isPastDue && (
          <div style={{
            background: "rgba(239,68,68,0.07)",
            border: "1px solid rgba(239,68,68,0.3)",
            borderRadius: 12,
            padding: "14px 18px",
            display: "flex",
            alignItems: "center",
            gap: 10,
            fontSize: "0.88rem",
            color: "#9a3412",
          }}>
            <svg viewBox="0 0 20 20" fill="currentColor" style={{ width: 18, height: 18, flexShrink: 0 }}>
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <span>
              <strong>Pagamento com problema.</strong> Acesse o portal da Stripe abaixo para regularizar.
            </span>
          </div>
        )}

        {/* Usage block */}
        {usage && (
          <article className="dashboard-card">
            <div className="dashboard-card__header">
              <h3>Uso do mês atual</h3>
              <p style={{ fontSize: "0.82rem", color: "var(--muted)" }}>
                {usage.billingMonth} · Reinicia todo dia 1º
              </p>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 16, marginBottom: 20 }}>
              <div style={{ padding: "14px 16px", background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 10 }}>
                <div style={{ fontSize: "0.72rem", color: "var(--muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>Leads faturáveis</div>
                <div style={{ fontSize: "1.6rem", fontWeight: 900, color: "var(--dark)", lineHeight: 1.2, marginTop: 4 }}>
                  {usage.billableLeads.toLocaleString("pt-BR")}
                </div>
                <div style={{ fontSize: "0.75rem", color: "var(--muted)" }}>
                  de {usage.leadsLimit.toLocaleString("pt-BR")} inclusos
                </div>
              </div>

              <div style={{ padding: "14px 16px", background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 10 }}>
                <div style={{ fontSize: "0.72rem", color: "var(--muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>Clientes ativos</div>
                <div style={{ fontSize: "1.6rem", fontWeight: 900, color: "var(--dark)", lineHeight: 1.2, marginTop: 4 }}>
                  {usage.clientsActive}
                </div>
                <div style={{ fontSize: "0.75rem", color: "var(--muted)" }}>
                  {usage.clientsLimit === null ? "ilimitados no plano" : `de ${usage.clientsLimit} no plano`}
                </div>
              </div>

              {usage.estimatedOverage > 0 && (
                <div style={{ padding: "14px 16px", background: "rgba(239,68,68,0.05)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 10 }}>
                  <div style={{ fontSize: "0.72rem", color: "#dc2626", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>Excedente estimado</div>
                  <div style={{ fontSize: "1.6rem", fontWeight: 900, color: "#dc2626", lineHeight: 1.2, marginTop: 4 }}>
                    R${usage.estimatedOverage.toFixed(2).replace(".", ",")}
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "#dc2626" }}>
                    R${usage.overagePerLead.toFixed(2).replace(".", ",")}/lead excedente
                  </div>
                </div>
              )}
            </div>

            {/* Progress bar */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", color: "var(--muted)", marginBottom: 6 }}>
                <span>Leads utilizados</span>
                <span style={{ fontWeight: 700, color: usage.leadsPercent >= 90 ? "#dc2626" : usage.leadsPercent >= 70 ? "#ca8a04" : "var(--brand)" }}>
                  {usage.leadsPercent}%
                </span>
              </div>
              <div style={{ height: 8, borderRadius: 99, background: "var(--border)", overflow: "hidden" }}>
                <div style={{
                  height: "100%",
                  width: `${usage.leadsPercent}%`,
                  borderRadius: 99,
                  background: usage.leadsPercent >= 90 ? "#dc2626" : usage.leadsPercent >= 70 ? "#ca8a04" : "var(--brand)",
                  transition: "width 0.4s ease",
                }} />
              </div>
            </div>
          </article>
        )}

        {/* Features list */}
        <article className="dashboard-card">
          <div className="dashboard-card__header">
            <h3>O que está incluído no plano</h3>
          </div>
          <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 10 }}>
            {(knownPlan?.features ?? FEATURES).map((f) => (
              <li key={f} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: "0.88rem", color: "var(--dark)" }}>
                <CheckIcon />
                {f}
              </li>
            ))}
          </ul>

          {/* Stripe portal for active subscribers */}
          {hasStripeCustomer && stripeReady && !isEnvAdmin && (
            <div style={{ marginTop: 24 }}>
              <form action="/api/stripe/portal" method="post" style={{ maxWidth: 280 }}>
                <button type="submit" className="dashboard-button" style={{ width: "100%" }}>
                  Gerenciar assinatura (Stripe)
                </button>
              </form>
            </div>
          )}
        </article>

        {/* Plan upgrade section: only for non-pro users */}
        {!isPro && !isEnvAdmin && stripeReady && (
          <article className="dashboard-card">
            <div className="dashboard-card__header">
              <h3>Escolha seu plano</h3>
              <p>Ative sua assinatura para continuar com acesso completo.</p>
            </div>
            <SubscribePlansClient isLoggedIn={true} activePlan={activePlan} />
          </article>
        )}
      </section>
    </main>
  );
}
