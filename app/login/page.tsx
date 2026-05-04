import { redirect } from "next/navigation";
import { DashboardLogin } from "@/components/dashboard/DashboardLogin";
import { getCurrentUser, isDashboardConfigured } from "@/lib/dashboard-auth";

type LoginPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function getErrorMessage(error?: string | string[]) {
  const value = Array.isArray(error) ? error[0] : error;

  if (value === "invalid") {
    return "E-mail ou senha invalidos.";
  }

  if (value === "config") {
    return "Defina DASHBOARD_PASSWORD para liberar o acesso.";
  }

  return "";
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const user = await getCurrentUser();

  if (user) {
    redirect("/dashboard");
  }

  const resolvedSearchParams = await searchParams;

  return (
    <DashboardLogin
      configured={isDashboardConfigured()}
      error={getErrorMessage(resolvedSearchParams.error)}
    />
  );
}
