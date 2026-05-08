import { ClinicEditor } from "@/components/dashboard/ClinicEditor";
import { DashboardLogin } from "@/components/dashboard/DashboardLogin";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { listManagedClinics, toClinicFormValues } from "@/lib/clinics";
import {
  getCurrentUser,
  isAgencyAdmin,
  isDashboardConfigured
} from "@/lib/dashboard-auth";
import { hasDatabaseConfig } from "@/lib/db";

export default async function NewClinicPage() {
  const user = await getCurrentUser();

  if (!user) {
    return <DashboardLogin configured={isDashboardConfigured()} error="" />;
  }

  const databaseReady = hasDatabaseConfig();

  if (!isAgencyAdmin(user)) {
    return (
      <main className="dashboard-shell">
        <DashboardSidebar
          activePath="/dashboard/clinicas"
          databaseReady={databaseReady}
          user={user}
        />
        <section className="dashboard-main">
          <div className="dashboard-alert dashboard-alert--warning">
            Apenas agency_admin pode cadastrar novos clientes.
          </div>
        </section>
      </main>
    );
  }

  const clinics = await listManagedClinics("", user.clientSlug ?? null);
  const values = toClinicFormValues(null);

  return (
    <main className="dashboard-shell">
      <DashboardSidebar
        activePath="/dashboard/clinicas"
        databaseReady={databaseReady}
        user={user}
      />

      <section className="dashboard-main">
        <header className="dashboard-topbar">
          <div>
            <span className="dashboard-eyebrow">Novo Cliente</span>
            <h2>Cadastrar novo cliente</h2>
            <p>
              Monte a estrutura completa com tracking, WhatsApp e CRM opcional.
            </p>
          </div>
        </header>

        <ClinicEditor
          mode="create"
          values={values}
          cancelHref="/dashboard/clinicas"
          redirectTo="/dashboard/clinicas/nova"
          existingSlugs={clinics.map((clinic) => clinic.clientSlug)}
          databaseReady={databaseReady}
        />
      </section>
    </main>
  );
}
