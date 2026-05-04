import { type ReactNode } from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/dashboard-auth";
import { getCachedBillingStatus } from "@/lib/billing";
import { hasDatabaseConfig } from "@/lib/db";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const user = await getCurrentUser();

  if (!user) {
    return <>{children}</>;
  }

  if (user.kind === "env_admin" || !hasDatabaseConfig()) {
    return <>{children}</>;
  }

  try {
    const billing = await getCachedBillingStatus(user.id);
    if (billing.isBlocked) {
      redirect("/assinatura");
    }
  } catch {
    // billing query failed (e.g. migration not yet applied) — allow through
  }

  return <>{children}</>;
}
