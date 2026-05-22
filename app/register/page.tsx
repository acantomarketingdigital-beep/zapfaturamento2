import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/dashboard-auth";
import { getCachedBillingStatus } from "@/lib/billing";
import { hasDatabaseConfig } from "@/lib/db";
import { RegisterForm } from "./RegisterForm";

interface Props {
  searchParams: Promise<{ error?: string; plan?: string }>;
}

export default async function RegisterPage({ searchParams }: Props) {
  const user = await getCurrentUser();

  // Already logged in: send to right place
  if (user && user.kind !== "env_admin" && hasDatabaseConfig()) {
    try {
      const billing = await getCachedBillingStatus(user.id);
      if (!billing.isBlocked) {
        redirect("/dashboard");
      } else {
        redirect("/billing/subscribe");
      }
    } catch {
      redirect("/dashboard");
    }
  } else if (user) {
    redirect("/dashboard");
  }

  const { error, plan } = await searchParams;

  return <RegisterForm error={error} plan={plan} />;
}
