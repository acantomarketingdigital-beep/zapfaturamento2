import { DashboardLogin } from "@/components/dashboard/DashboardLogin";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { ExportForm } from "@/components/dashboard/ExportForm";
import { getCurrentUser, isAgencyAdmin, isDashboardConfigured } from "@/lib/dashboard-auth";
import { hasDatabaseConfig } from "@/lib/db";
import { getExportableLeads } from "@/lib/export";
import { EXPORTABLE_STATUSES } from "@/lib/export-shared";
import { listManagedClinics } from "@/lib/clinics";

export const dynamic = "force-dynamic";

export default async function ExportarPage() {
  const user = await getCurrentUser();

  if (!user) {
    return <DashboardLogin configured={isDashboardConfigured()} error="" />;
  }

  const databaseReady = hasDatabaseConfig();
  const scopeSlug = user.role === "client_user" ? user.clientSlug : null;

  const clients = isAgencyAdmin(user)
    ? await listManagedClinics("", null)
    : await listManagedClinics("", user.clientSlug);

  const [allLeads, todosLeads] = databaseReady
    ? await Promise.all([
        getExportableLeads({ clientSlug: scopeSlug, statuses: [...EXPORTABLE_STATUSES] }),
        getExportableLeads({ clientSlug: scopeSlug, statuses: null })
      ])
    : [[], []];

  const totalTodos        = todosLeads.length;
  const totalQualificados = allLeads.length;
  const totalAgendados    = allLeads.filter((l) => l.lead_status === "agendado").length;
  const totalFechados     = allLeads.filter((l) => ["pago", "finalizado"].includes(l.lead_status)).length;

  return (
    <main className="dashboard-shell">
      <DashboardSidebar
        activePath="/dashboard/configuracoes"
        databaseReady={databaseReady}
        user={user}
      />

      <section className="dashboard-main">
        <div className="export-hero">
          <span className="export-hero__eyebrow">Meta Ads</span>
          <h2 className="export-hero__title" style={{ margin: 0 }}>
            Leads prontos para escalar suas campanhas
          </h2>
          <p className="export-hero__desc">
            Exporte todos os leads ou listas qualificadas para criar Publicos Personalizados e Semelhantes no Meta Ads.
          </p>
        </div>

        <section className="dashboard-stats-grid" style={{ gridTemplateColumns: "repeat(4, minmax(0, 1fr))" }}>
          <article className="dashboard-stat-card dashboard-stat-card--neutral">
            <span>Todos os leads</span>
            <strong>{totalTodos}</strong>
          </article>
          <article className="dashboard-stat-card dashboard-stat-card--success">
            <span>Qualificados</span>
            <strong>{totalQualificados}</strong>
          </article>
          <article className="dashboard-stat-card dashboard-stat-card--brand">
            <span>Agendados</span>
            <strong>{totalAgendados}</strong>
          </article>
          <article className="dashboard-stat-card dashboard-stat-card--revenue">
            <span>Fechados</span>
            <strong>{totalFechados}</strong>
          </article>
        </section>

        <ExportForm
          clients={clients.map((c) => ({ value: c.clientSlug, label: c.clientName }))}
          isAgencyAdmin={isAgencyAdmin(user)}
          defaultClientSlug={user.role === "client_user" ? user.clientSlug ?? "" : ""}
        />

        <article className="dashboard-card">
          <div className="dashboard-card__header">
            <h2>Privacidade e LGPD</h2>
          </div>
          <div style={{ fontSize: "0.84rem", color: "var(--muted)", lineHeight: 1.7 }}>
            <p style={{ margin: "0 0 8px" }}>
              Os dados exportados (telefone, e-mail, nome) sao de leads que entraram em contato
              voluntariamente e devem ser tratados conforme a LGPD.
            </p>
            <p style={{ margin: "0 0 8px" }}>
              Ao fazer upload para o Meta Ads, os dados sao hasheados pelo Meta antes de serem
              processados. Nao compartilhe o arquivo CSV com terceiros nao autorizados.
            </p>
            <p style={{ margin: 0 }}>
              Duplicados sao removidos automaticamente antes da exportacao (criterio: telefone normalizado, depois e-mail).
            </p>
          </div>
        </article>
      </section>
    </main>
  );
}
