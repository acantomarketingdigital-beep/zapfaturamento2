import { BrandLogo } from "@/components/BrandLogo";
import { getCurrentUser } from "@/lib/dashboard-auth";
import { fmtPrice, getPlanByKey } from "@/lib/plans";

interface Props {
  searchParams: Promise<{ plan?: string; billing?: string }>;
}

export default async function BillingSuccessPage({ searchParams }: Props) {
  const user = await getCurrentUser();
  const { plan: planParam, billing: billingParam } = await searchParams;

  const billing = billingParam === "yearly" || planParam === "yearly" ? "yearly" : "monthly";
  const planData = getPlanByKey(planParam);

  const planName = planData?.name ?? "Zap Faturamento Pro";
  const planLabel = billing === "yearly" ? "Anual" : "Mensal";
  const planPrice = planData
    ? billing === "yearly"
      ? `${fmtPrice(planData.priceYearly)}/ano`
      : `${fmtPrice(planData.priceMonthly)}/mês`
    : billing === "yearly" ? "R$997/ano" : "R$97/mês";
  const planDetail = billing === "yearly"
    ? "Sua assinatura anual será renovada automaticamente."
    : "Seu plano é renovado automaticamente todo mês.";

  return (
    <div className="assinatura-page">
      <header className="assinatura-header">
        <BrandLogo variant="horizontal" className="assinatura-logo" priority />
      </header>

      <main className="assinatura-main">
        <div className="assinatura-card" style={{ textAlign: "center" }}>
          <div className="assinatura-icon" style={{ background: "rgba(34,197,94,0.12)", color: "#16a34a" }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>

          <h1 className="assinatura-title" style={{ color: "#16a34a" }}>
            Assinatura ativada!
          </h1>
          <p className="assinatura-desc">
            Seu plano{" "}
            <strong>
              {planName} — {planLabel} ({planPrice})
            </strong>{" "}
            foi ativado com sucesso. Você já tem acesso completo à plataforma.
          </p>

          <p style={{ fontSize: "0.8rem", color: "var(--muted)", margin: "0 0 20px" }}>
            {planDetail}
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: 10, width: "100%", maxWidth: 320 }}>
            <a href="/dashboard" className="assinatura-cta assinatura-cta--stripe" style={{ textDecoration: "none", textAlign: "center" }}>
              Ir para o Dashboard
            </a>
            {user && (
              <a
                href="/dashboard/assinatura"
                style={{ fontSize: "0.8rem", color: "var(--muted)", textDecoration: "underline", textAlign: "center" }}
              >
                Ver detalhes da assinatura
              </a>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
