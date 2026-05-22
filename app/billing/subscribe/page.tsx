import { redirect } from "next/navigation";
import { BrandLogo } from "@/components/BrandLogo";
import { getCurrentUser } from "@/lib/dashboard-auth";
import { getCachedBillingStatus } from "@/lib/billing";
import { hasDatabaseConfig } from "@/lib/db";
import SubscribePlansClient from "./SubscribePlansClient";

export default async function BillingSubscribePage() {
  const user = await getCurrentUser();

  let activePlan: string | null = null;

  if (user && hasDatabaseConfig() && user.kind !== "env_admin") {
    try {
      const billing = await getCachedBillingStatus(user.id);
      if (!billing.isBlocked) {
        // Active subscriber: redirect unless they want to see plans
        // (keep them here so they can see their current plan highlighted)
        activePlan = billing.subscriptionPlan ?? null;
        if (!activePlan) redirect("/dashboard");
      }
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

      <main className="assinatura-main" style={{ flexDirection: "column", gap: 32, maxWidth: "none", padding: "48px 24px" }}>

        {/* Heading */}
        <div style={{ textAlign: "center", maxWidth: 560 }}>
          <h1 style={{ fontSize: "1.75rem", fontWeight: 900, color: "var(--dark)", margin: "0 0 10px", letterSpacing: "-0.03em", lineHeight: 1.2 }}>
            Escolha seu plano
          </h1>
          <p style={{ color: "var(--muted)", fontSize: "0.95rem", margin: 0, lineHeight: 1.6 }}>
            Acesso completo a todas as funcionalidades. Cancele quando quiser.
          </p>
        </div>

        {/* Plan cards */}
        <SubscribePlansClient isLoggedIn={isLoggedIn} activePlan={activePlan} />

        {/* Footer */}
        <p style={{ fontSize: "0.75rem", color: "var(--muted)", margin: 0, textAlign: "center" }}>
          Pagamento seguro via Stripe · Sem fidelidade · Cancele a qualquer momento
        </p>
      </main>
    </div>
  );
}
