import { BrandLogo } from "@/components/BrandLogo";
import { getCurrentUser } from "@/lib/dashboard-auth";
import { isStripeConfigured } from "@/lib/stripe";

const SUPPORT_EMAIL = "suporte.zapfaturamento@gmail.com";

export default async function BillingCancelPage() {
  const user = await getCurrentUser();
  const stripeReady = isStripeConfigured();

  return (
    <div className="assinatura-page">
      <header className="assinatura-header">
        <BrandLogo variant="horizontal" className="assinatura-logo" priority />
      </header>

      <main className="assinatura-main">
        <div className="assinatura-card" style={{ textAlign: "center" }}>
          <div className="assinatura-icon" style={{ background: "rgba(107,114,128,0.1)", color: "#6b7280" }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>

          <h1 className="assinatura-title">Assinatura cancelada</h1>
          <p className="assinatura-desc">
            O processo de assinatura foi interrompido. Nenhuma cobranca foi realizada.
            Voce pode tentar novamente quando quiser.
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: 10, width: "100%", maxWidth: 320 }}>
            {user && stripeReady ? (
              <form action="/api/stripe/checkout" method="post" style={{ width: "100%" }}>
                <button type="submit" className="assinatura-cta assinatura-cta--stripe" style={{ width: "100%" }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ width: 18, height: 18, flexShrink: 0 }}>
                    <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
                    <line x1="1" y1="10" x2="23" y2="10" />
                  </svg>
                  Tentar novamente — R$ 97/mes
                </button>
              </form>
            ) : null}

            <a
              href="/dashboard"
              className="assinatura-cta"
              style={{ textDecoration: "none", background: "var(--surface, #f8fafc)", color: "var(--dark)", border: "1px solid var(--border)" }}
            >
              Voltar ao dashboard
            </a>

            <a
              href={`mailto:${SUPPORT_EMAIL}?subject=Problema%20ao%20assinar%20o%20Zap%20Faturamento`}
              style={{ fontSize: "0.8rem", color: "var(--muted)", textDecoration: "underline", textAlign: "center" }}
            >
              Suporte por e-mail
            </a>
          </div>
        </div>
      </main>
    </div>
  );
}
