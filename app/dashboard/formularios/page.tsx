import { DashboardLogin } from "@/components/dashboard/DashboardLogin";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { LeadFormsManager } from "@/components/dashboard/LeadFormsManager";
import { getCurrentUser, isDashboardConfigured, isAgencyAdmin } from "@/lib/dashboard-auth";
import { hasDatabaseConfig } from "@/lib/db";
import { listLeadForms, MAX_FORMS_PER_CLIENT } from "@/lib/lead-forms";
import { listManagedClinics } from "@/lib/clinics";

export const dynamic = "force-dynamic";

export default async function FormulariosPage() {
  const user = await getCurrentUser();

  if (!user) {
    return <DashboardLogin configured={isDashboardConfigured()} error="" />;
  }

  const scopeSlug = user.clientSlug ?? null;
  const adminUser = isAgencyAdmin(user);

  const [forms, clinicsRaw] = await Promise.all([
    hasDatabaseConfig() && scopeSlug
      ? listLeadForms(scopeSlug)
      : Promise.resolve([]),
    hasDatabaseConfig()
      ? listManagedClinics("", scopeSlug)
      : Promise.resolve([]),
  ]);

  const clients = clinicsRaw.map((c) => ({ slug: c.clientSlug, name: c.clientName }));
  const baseUrl = (process.env.NEXT_PUBLIC_BASE_URL ?? "https://zapfaturamento.com.br")
    .trim()
    .replace(/\/$/, "");

  return (
    <main className="dashboard-shell">
      <DashboardSidebar
        activePath="/dashboard/formularios"
        databaseReady={hasDatabaseConfig()}
        user={user}
      />

      <section className="dashboard-main">
        <header className="dashboard-topbar">
          <div>
            <span className="dashboard-eyebrow">Captacao</span>
            <h2>Lead Express</h2>
            <p>Formularios proprios para captar leads sem landing page externa.</p>
          </div>
        </header>

        <LeadFormsManager
          initialForms={forms}
          clients={clients}
          currentClientSlug={scopeSlug}
          isAgencyAdmin={adminUser}
          baseUrl={baseUrl}
          limit={MAX_FORMS_PER_CLIENT}
        />
      </section>
    </main>
  );
}
