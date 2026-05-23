import { getCachedBillingStatus } from "@/lib/billing";
import { hasDatabaseConfig } from "@/lib/db";

type TrialBannerProps = {
  userId: string | undefined;
  planKind: "user" | "env_admin" | undefined;
};

export async function TrialBanner({ userId, planKind }: TrialBannerProps) {
  if (!userId || planKind === "env_admin" || !hasDatabaseConfig()) {
    return null;
  }

  let billing;
  try {
    billing = await getCachedBillingStatus(userId);
  } catch {
    return null;
  }

  if (billing.planType !== "trial" || billing.isBlocked) {
    return null;
  }

  const daysLeft = billing.daysLeft ?? 0;

  const label =
    daysLeft === 0
      ? "Seu trial expira hoje"
      : daysLeft === 1
        ? "1 dia restante no trial"
        : `${daysLeft} dias restantes no trial`;

  const urgency = daysLeft <= 2 ? "trial-banner--urgent" : "";
  const ctaLabel = billing.subscriptionPlan === "crm" ? "Assinar CRM" : "Assinar Pro";

  return (
    <div className={`trial-banner ${urgency}`}>
      <svg viewBox="0 0 20 20" fill="currentColor" className="trial-banner__icon" aria-hidden="true">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
      </svg>
      <div className="trial-banner__text">
        <strong>{label}</strong>
        <a href="/dashboard/assinatura" className="trial-banner__cta">{ctaLabel}</a>
      </div>
    </div>
  );
}
