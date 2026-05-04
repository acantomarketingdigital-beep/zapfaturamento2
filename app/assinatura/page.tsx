import { BrandLogo } from "@/components/BrandLogo";
import { getCurrentUser } from "@/lib/dashboard-auth";
import { getCachedBillingStatus } from "@/lib/billing";
import { hasDatabaseConfig } from "@/lib/db";
import { redirect } from "next/navigation";
import SubscribePlansClient from "@/app/billing/subscribe/SubscribePlansClient";

export default async function AssinaturaPage() {
  const user = await getCurrentUser();

  let activePlan: "monthly" | "yearly" | null = null;

  if (user && hasDatabaseConfig() && user.kind !== "env_admin") {
    try {
      const billing = await getCachedBillingStatus(user.id);
      if (!billing.isBlocked) {
        redirect("/dashboard");
      }
      activePlan = billing.subscriptionPlan ?? null;
    } catch {
      // allow through on DB error
    }
  }

  const isLoggedIn = Boolean(user && user.kind !== "env_admin");

  return (
    <div className="assinatura-page">
      <header className="assinatura-header">
        <BrandLogo variant="horizontal" className="assinatura-logo" priority />
      </header>

      <main
        className="assinatura-main"
        style={{ flexDirection: "column", gap: 32, maxWidth: "none", padding: "48px 24px" }}
      >
        {/* Heading */}
        <div style={{ textAlign: "center", maxWidth: 560 }}>
          <div style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: 52,
            height: 52,
            borderRadius: "50%",
            background: "rgba(234,179,8,0.1)",
            border: "1px solid rgba(234,179,8,0.3)",
            marginBottom: 20,
          }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="#ca8a04" strokeWidth={1.5} style={{ width: 26, height: 26 }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 style={{
            fontSize: "1.75rem",
            fontWeight: 900,
            color: "var(--dark)",
            margin: "0 0 10px",
            letterSpacing: "-0.03em",
            lineHeight: 1.2,
          }}>
            {isLoggedIn ? "Seu período de teste encerrou" : "Assine o Zap Faturamento"}
          </h1>
          <p style={{ color: "var(--muted)", fontSize: "0.95rem", margin: 0, lineHeight: 1.6 }}>
            {isLoggedIn
              ? "Escolha um plano para continuar com acesso completo à plataforma."
              : "Acesso completo a todas as funcionalidades. Cancele quando quiser."}
          </p>
        </div>

        {/* Plan cards */}
        <SubscribePlansClient isLoggedIn={isLoggedIn} activePlan={activePlan} />

        {/* Footer */}
        <div style={{ textAlign: "center", display: "flex", flexDirection: "column", gap: 8, alignItems: "center" }}>
          <p style={{ fontSize: "0.75rem", color: "var(--muted)", margin: 0 }}>
            Pagamento seguro via Stripe · Sem fidelidade · Cancele a qualquer momento
          </p>
          {isLoggedIn && (
            <form action="/api/auth/logout" method="post">
              <button type="submit" className="assinatura-logout">
                Sair da conta
              </button>
            </form>
          )}
        </div>
      </main>
    </div>
  );
}
