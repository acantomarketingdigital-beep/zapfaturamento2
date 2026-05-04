import { Suspense } from "react";
import { CustomerLogo } from "@/components/CustomerLogo";
import { CampaignSection } from "@/components/dashboard/CampaignSection";
import { ChartCard } from "@/components/dashboard/Charts";
import { DashboardLogin } from "@/components/dashboard/DashboardLogin";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { LeadTable } from "@/components/dashboard/LeadTable";
import { getBaseUrlFromHeaders } from "@/lib/app-url";
import { listCampaigns } from "@/lib/campaigns";
import { getClinicByIdOrSlug } from "@/lib/clinics";
import {
  canAccessClient,
  getCurrentUser,
  isAgencyAdmin,
  isDashboardConfigured
} from "@/lib/dashboard-auth";
import { hasDatabaseConfig } from "@/lib/db";
import { getDashboardData } from "@/lib/leads";

type ClinicDetailsPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function readParam(
  searchParams: Record<string, string | string[] | undefined>,
  key: string
) {
  const value = searchParams[key];
  return Array.isArray(value) ? value[0] || "" : value || "";
}

export default async function ClinicDetailsPage({
  params,
  searchParams
}: ClinicDetailsPageProps) {
  const user = await getCurrentUser();

  if (!user) {
    return <DashboardLogin configured={isDashboardConfigured()} error="" />;
  }

  const { id } = await params;
  const resolvedSearchParams = await searchParams;
  const clinic = await getClinicByIdOrSlug(id);
  const baseUrl = await getBaseUrlFromHeaders();
  const databaseReady = hasDatabaseConfig();

  if (!clinic || !canAccessClient(user, clinic.clientSlug)) {
    return (
      <main className="dashboard-shell">
        <DashboardSidebar
          activePath="/dashboard/clinicas"
          databaseReady={databaseReady}
          user={user}
        />
        <section className="dashboard-main">
          <div className="dashboard-alert dashboard-alert--error">
            Cliente nao encontrado ou sem permissao de acesso.
          </div>
        </section>
      </main>
    );
  }

  const [dashboardData, campaigns] = await Promise.all([
    getDashboardData(
      {
        period: "all",
        clientSlug: clinic.clientSlug,
        origin: "",
        campaign: "",
        creative: "",
        audience: "",
        kommoStatus: "all",
        query: "",
        leadType: "all"
      },
      user.role === "client_user" ? user.clientSlug : null
    ),
    listCampaigns(clinic.clientSlug)
  ]);

  const status = readParam(resolvedSearchParams, "status");

  return (
    <main className="dashboard-shell">
      <DashboardSidebar
        activePath="/dashboard/clinicas"
        databaseReady={dashboardData.databaseReady}
        user={user}
      />

      <section className="dashboard-main">
        {status === "saved" ? (
          <div className="dashboard-alert dashboard-alert--success">
            Cliente salvo com sucesso.
          </div>
        ) : null}

        <header className="dashboard-topbar">
          <div className="dashboard-clinic-hero">
            <CustomerLogo
              logoUrl={clinic.logoUrl}
              clientName={clinic.clientName}
              imageClassName="dashboard-clinic-hero__logo"
              placeholderClassName="dashboard-clinic-hero__logo dashboard-clinic-hero__logo--placeholder"
            />
            <div>
              <span className="dashboard-eyebrow">Detalhes do Cliente</span>
              <h2>{clinic.clientName}</h2>
              <p>Slug: /{clinic.clientSlug}</p>
              <div className="dashboard-inline-actions">
                <span
                  className={`dashboard-pill ${
                    clinic.isActive
                      ? "dashboard-pill--success"
                      : "dashboard-pill--error"
                  }`}
                >
                  {clinic.isActive ? "Ativo" : "Inativo"}
                </span>
                <span className="dashboard-pill dashboard-pill--crm">
                  {clinic.kommoEnabled ? "Kommo ativo" : "Sem CRM"}
                </span>
                <span className="dashboard-pill dashboard-pill--meta">
                  {clinic.metaCapiConfigured ? "CAPI ativa" : "CAPI off"}
                </span>
              </div>
            </div>
          </div>

          <div className="dashboard-inline-actions">
            {isAgencyAdmin(user) ? (
              <a
                href={`/dashboard/clinicas/${encodeURIComponent(clinic.clientSlug)}/editar`}
                className="dashboard-button"
              >
                Editar cliente
              </a>
            ) : null}
            <a
              href={`/dashboard?client=${encodeURIComponent(clinic.clientSlug)}`}
              className="dashboard-button dashboard-button--ghost"
            >
              Ver dashboard do cliente
            </a>
          </div>
        </header>

        <section className="dashboard-stats-grid dashboard-stats-grid--clinics">
          <article className="dashboard-stat-card">
            <span>Total de leads</span>
            <strong>{dashboardData.summary.totalLeads}</strong>
          </article>
          <article className="dashboard-stat-card dashboard-stat-card--success">
            <span>Leads hoje</span>
            <strong>{dashboardData.summary.leadsToday}</strong>
          </article>
          <article className="dashboard-stat-card dashboard-stat-card--meta">
            <span>Ultimos 7 dias</span>
            <strong>{dashboardData.summary.leadsLast7Days}</strong>
          </article>
          <article className="dashboard-stat-card">
            <span>WhatsApp</span>
            <strong>{clinic.whatsappNumber}</strong>
          </article>
        </section>

        <section className="dashboard-detail-grid">
          <article className="dashboard-card">
            <div className="dashboard-card__header">
              <div>
                <h3>Configuracao</h3>
              </div>
            </div>

            <div className="dashboard-summary-list">
              <div>
                <span>Logo</span>
                <strong>{clinic.logoUrl || "Nao configurada"}</strong>
              </div>
              <div>
                <span>Meta Pixel ID</span>
                <strong>{clinic.metaPixelId || "-"}</strong>
              </div>
              <div>
                <span>Meta CAPI</span>
                <strong>
                  {clinic.metaCapiConfigured ? "Configurada" : "Nao configurada"}
                </strong>
              </div>
              <div>
                <span>Test Event Code</span>
                <strong>{clinic.metaTestEventCode || "-"}</strong>
              </div>
              <div>
                <span>GTM ID</span>
                <strong>{clinic.gtmId || "-"}</strong>
              </div>
              <div>
                <span>GA4 ID</span>
                <strong>{clinic.ga4Id || "-"}</strong>
              </div>
              <div>
                <span>Google Ads</span>
                <strong>{clinic.googleAdsId || "-"}</strong>
              </div>
            </div>
          </article>
        </section>

        <Suspense fallback={null}>
          <CampaignSection
            initialCampaigns={campaigns}
            clientSlug={clinic.clientSlug}
            baseUrl={baseUrl}
            canManage={isAgencyAdmin(user) || canAccessClient(user, clinic.clientSlug)}
          />
        </Suspense>

        <section className="dashboard-chart-grid">
          <ChartCard title="Campanhas que mais geraram leads" data={dashboardData.leadsByCampaign} />
          <ChartCard title="Criativos com mais leads" data={dashboardData.leadsByCreative} />
          <ChartCard title="Publicos com mais leads" data={dashboardData.leadsByAudience} />
          <ChartCard title="Leads por origem" data={dashboardData.leadsBySource} />
        </section>

        <LeadTable rows={dashboardData.rows.slice(0, 20)} />
      </section>
    </main>
  );
}
