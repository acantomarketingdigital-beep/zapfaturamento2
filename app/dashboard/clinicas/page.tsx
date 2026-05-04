import { ClinicCardsGrid } from "@/components/dashboard/ClinicCardsGrid";
import { DashboardLogin } from "@/components/dashboard/DashboardLogin";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { listManagedClinics } from "@/lib/clinics";
import {
  getCurrentUser,
  isAgencyAdmin,
  isDashboardConfigured
} from "@/lib/dashboard-auth";
import { hasDatabaseConfig } from "@/lib/db";

type ClinicsPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function readParam(
  searchParams: Record<string, string | string[] | undefined>,
  key: string
) {
  const value = searchParams[key];
  return Array.isArray(value) ? value[0] || "" : value || "";
}

function getFlashMessage(
  searchParams: Record<string, string | string[] | undefined>
) {
  const status = readParam(searchParams, "status");
  const message = readParam(searchParams, "message");

  if (!status) {
    return null;
  }

  return {
    variant: status === "error" ? "error" : "success",
    text:
      message ||
      (status === "saved"
        ? "Cliente salvo com sucesso."
        : status === "deleted"
          ? "Cliente removido com sucesso."
          : status === "toggled"
            ? "Status do cliente atualizado."
            : "Operacao concluida.")
  };
}

export default async function ClinicsDashboardPage({
  searchParams
}: ClinicsPageProps) {
  const resolvedSearchParams = await searchParams;
  const user = await getCurrentUser();

  if (!user) {
    return (
      <DashboardLogin configured={isDashboardConfigured()} error="" />
    );
  }

  const databaseReady = hasDatabaseConfig();
  const query = readParam(resolvedSearchParams, "q");
  const scopeClientSlug = user.clientSlug;
  const clinics = await listManagedClinics(query, scopeClientSlug);
  const flash = getFlashMessage(resolvedSearchParams);
  const totalClients = clinics.length;
  const activeClients = clinics.filter((clinic) => clinic.isActive).length;
  const kommoClients = clinics.filter((clinic) => clinic.kommoEnabled).length;
  const totalLeads = clinics.reduce((sum, clinic) => sum + clinic.totalLeads, 0);
  const canManage = isAgencyAdmin(user);
  const redirectTo = query
    ? `/dashboard/clinicas?q=${encodeURIComponent(query)}`
    : "/dashboard/clinicas";

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
            <span className="dashboard-eyebrow">Clientes</span>
            <h2>Gestao de clientes e links de campanha</h2>
            <p>
              Cadastre, acompanhe e mantenha clientes prontos para tracking,
              CRM, WhatsApp e faturamento.
            </p>
          </div>
          <div className="dashboard-inline-actions">
            {canManage ? (
              <a href="/dashboard/clinicas/nova" className="dashboard-button">
                Novo cliente
              </a>
            ) : null}
            {!databaseReady ? (
              <div className="dashboard-alert dashboard-alert--warning">
                Configure <code>DATABASE_URL</code> para persistir clientes e
                leads.
              </div>
            ) : null}
          </div>
        </header>

        {flash ? (
          <div
            className={`dashboard-alert ${
              flash.variant === "error"
                ? "dashboard-alert--error"
                : "dashboard-alert--success"
            }`}
          >
            {flash.text}
          </div>
        ) : null}

        <section className="dashboard-stats-grid dashboard-stats-grid--clinics">
          <article className="dashboard-stat-card">
            <span>Total de clientes</span>
            <strong>{totalClients}</strong>
          </article>
          <article className="dashboard-stat-card dashboard-stat-card--success">
            <span>Ativos</span>
            <strong>{activeClients}</strong>
          </article>
          <article className="dashboard-stat-card dashboard-stat-card--meta">
            <span>Kommo ativo</span>
            <strong>{kommoClients}</strong>
          </article>
          <article className="dashboard-stat-card dashboard-stat-card--brand">
            <span>Total de leads</span>
            <strong>{totalLeads}</strong>
          </article>
        </section>

        <article className="dashboard-card">
          <div className="dashboard-card__header">
            <div>
              <h2>Buscar clientes</h2>
              <p className="dashboard-helper">
                Busque por nome, slug ou numero de WhatsApp.
              </p>
            </div>
          </div>

          <form className="dashboard-searchbar" method="get">
            <input
              type="text"
              name="q"
              defaultValue={query}
              placeholder="Ex.: premium, empresa-premium, 551199..."
            />
            <button type="submit" className="dashboard-button">
              Buscar
            </button>
            <a href="/dashboard/clinicas" className="dashboard-button dashboard-button--ghost">
              Limpar
            </a>
          </form>
        </article>

        <ClinicCardsGrid
          clinics={clinics}
          redirectTo={redirectTo}
          databaseReady={databaseReady}
          canManage={canManage}
        />
      </section>
    </main>
  );
}
