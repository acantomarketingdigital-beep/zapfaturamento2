import { ClinicEditor } from "@/components/dashboard/ClinicEditor";
import { DashboardLogin } from "@/components/dashboard/DashboardLogin";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import {
  getClinicByIdOrSlug,
  listManagedClinics,
  toClinicFormValues
} from "@/lib/clinics";
import {
  canAccessClient,
  getCurrentUser,
  isAgencyAdmin,
  isDashboardConfigured
} from "@/lib/dashboard-auth";
import { hasDatabaseConfig } from "@/lib/db";

type EditClinicPageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditClinicPage({ params }: EditClinicPageProps) {
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
            Apenas agency_admin pode editar clientes.
          </div>
        </section>
      </main>
    );
  }

  const { id } = await params;
  const clinic = await getClinicByIdOrSlug(id);

  if (!clinic || !(await canAccessClient(user, clinic.clientSlug, clinic.workspaceSlug))) {
    return (
      <main className="dashboard-shell">
        <DashboardSidebar
          activePath="/dashboard/clinicas"
          databaseReady={databaseReady}
          user={user}
        />
        <section className="dashboard-main">
          <div className="dashboard-alert dashboard-alert--error">
            Cliente nao encontrado.
          </div>
        </section>
      </main>
    );
  }

  const clinics = await listManagedClinics("", user.clientSlug ?? null);

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
            <span className="dashboard-eyebrow">Editar Cliente</span>
            <h2>{clinic.clientName}</h2>
            <p>Ajuste tracking, CRM, WhatsApp e links do cliente.</p>
          </div>
        </header>

        <ClinicEditor
          mode="edit"
          values={toClinicFormValues(clinic)}
          cancelHref={`/dashboard/clinicas/${encodeURIComponent(clinic.clientSlug)}`}
          redirectTo={`/dashboard/clinicas/${encodeURIComponent(clinic.clientSlug)}/editar`}
          existingSlugs={clinics
            .map((item) => item.clientSlug)
            .filter((slug) => slug !== clinic.clientSlug)}
          databaseReady={databaseReady}
        />
      </section>
    </main>
  );
}
