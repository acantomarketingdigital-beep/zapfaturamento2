import { BrandLogo } from "@/components/BrandLogo";
import { getCurrentUser } from "@/lib/dashboard-auth";

interface Props {
  searchParams: Promise<{ plan?: string }>;
}

export default async function BillingSuccessPage({ searchParams }: Props) {
  const user = await getCurrentUser();
  const { plan: planParam } = await searchParams;

  const plan: "monthly" | "yearly" | null =
    planParam === "yearly" ? "yearly" : planParam === "monthly" ? "monthly" : null;

  const planLabel = plan === "yearly" ? "Anual" : "Mensal";
  const planPrice = plan === "yearly" ? "R$997/ano" : "R$97/mês";
  const planDetail = plan === "yearly"
    ? "Voce economizou R$167 ao escolher o plano anual."
    : "Seu plano e renovado automaticamente todo mes.";

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
              Zap Faturamento Pro {plan ? `— ${planLabel} (${planPrice})` : ""}
            </strong>{" "}
            foi ativado com sucesso. Voce ja tem acesso completo a plataforma.
          </p>

          {plan && (
            <p style={{ fontSize: "0.8rem", color: "var(--muted)", margin: "0 0 20px" }}>
              {planDetail}
            </p>
          )}

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
