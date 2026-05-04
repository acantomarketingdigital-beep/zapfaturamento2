import { ChartCard } from "@/components/dashboard/Charts";
import { CleanTestLeadsButton } from "@/components/dashboard/CleanTestLeadsButton";
import { DashboardFiltersPanel } from "@/components/dashboard/DashboardFilters";
import { DashboardLogin } from "@/components/dashboard/DashboardLogin";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { LeadTable } from "@/components/dashboard/LeadTable";
import { SummaryCards } from "@/components/dashboard/SummaryCards";
import {
  getCurrentUser,
  isDashboardAuthenticated,
  isDashboardConfigured
} from "@/lib/dashboard-auth";
import {
  getDashboardData,
  getDefaultDashboardFilters
} from "@/lib/leads";
import { hasDatabaseConfig, queryDb } from "@/lib/db";

type DashboardPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function getErrorMessage(error?: string | string[]) {
  const value = Array.isArray(error) ? error[0] : error;

  if (value === "invalid") {
    return "Senha invalida. Tente novamente.";
  }

  if (value === "config") {
    return "Defina DASHBOARD_PASSWORD para liberar o acesso.";
  }

  return "";
}

export default async function DashboardPage({
  searchParams
}: DashboardPageProps) {
  const resolvedSearchParams = await searchParams;
  const user = await getCurrentUser();
  const authenticated = await isDashboardAuthenticated();

  if (!authenticated) {
    return (
      <DashboardLogin
        configured={isDashboardConfigured()}
        error={getErrorMessage(resolvedSearchParams.error)}
      />
    );
  }

  const filters = getDefaultDashboardFilters(resolvedSearchParams);
  const scopedClientSlug = user?.clientSlug ?? null;
  const data = await getDashboardData(filters, scopedClientSlug);

  // Onboarding state detection
  type OnboardRow = { has_connection: boolean; has_message: boolean; has_attended: boolean };
  let onboarding: OnboardRow | null = null;
  if (hasDatabaseConfig()) {
    try {
      const slug = scopedClientSlug;
      const slugWhere = slug ? "AND client_slug = $1" : "";
      const slugParam = slug ? [slug] : [];
      const ob = await queryDb<OnboardRow>(
        `SELECT
           (SELECT COUNT(*) FROM whatsapp_connections WHERE TRUE ${slugWhere}) > 0 AS has_connection,
           (SELECT COUNT(*) FROM whatsapp_messages WHERE TRUE ${slugWhere.replace("client_slug", "client_slug")}) > 0 AS has_message,
           (SELECT COUNT(*) FROM whatsapp_conversations WHERE pipeline_stage != 'novo_lead' ${slugWhere}) > 0 AS has_attended`,
        slugParam
      );
      onboarding = ob.rows[0] ?? null;
    } catch {}
  }
  const allDone = onboarding?.has_connection && onboarding?.has_message && onboarding?.has_attended;

  return (
    <main className="dashboard-shell">
      <DashboardSidebar
        activePath="/dashboard"
        databaseReady={data.databaseReady}
        user={user}
      />

      <section className="dashboard-main">
        <header className="dashboard-topbar">
          <div>
            <span className="dashboard-eyebrow">ZapFaturamento Overview</span>
            <h2>Leads, campanhas e resultados</h2>
            <p>
              Acompanhe a origem dos leads e a eficiencia das campanhas que
              terminam em conversa no WhatsApp.
            </p>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "flex-start", flexWrap: "wrap" }}>
            {user && user.role === "agency_admin" && data.databaseReady && (
              <CleanTestLeadsButton clients={data.filterOptions.clients} />
            )}
            {!data.databaseReady && (
              <div className="dashboard-alert dashboard-alert--warning">
                Configure <code>DATABASE_URL</code> e rode a migration para
                ativar o dashboard.
              </div>
            )}
          </div>
        </header>

        {!allDone && onboarding && (
          <article className="dashboard-card" style={{ marginBottom: 20, padding: "1.25rem" }}>
            <h3 style={{ fontWeight: 700, fontSize: "0.92rem", marginBottom: 12 }}>Configuracao inicial</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {[
                { done: onboarding.has_connection, label: "Conectar WhatsApp", href: "/dashboard/configuracoes/whatsapp" },
                { done: onboarding.has_message, label: "Receber primeira mensagem" },
                { done: onboarding.has_attended, label: "Iniciar atendimento", href: "/dashboard/inbox" },
              ].map((step) => (
                <div key={step.label} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: "0.85rem" }}>
                  <span style={{ fontSize: 16, width: 20, textAlign: "center" }}>{step.done ? "✅" : "⬜"}</span>
                  {step.done || !step.href ? (
                    <span style={{ color: step.done ? "var(--muted)" : "var(--dark)", textDecoration: step.done ? "line-through" : "none" }}>{step.label}</span>
                  ) : (
                    <a href={step.href} style={{ color: "var(--brand)", textDecoration: "none", fontWeight: 600 }}>{step.label} →</a>
                  )}
                </div>
              ))}
            </div>
          </article>
        )}

        <div className="dashboard-notice dashboard-notice--info">
          <strong>Aviso:</strong> O ZapFaturamento registra acessos reais ao link de redirecionamento. A Meta pode apresentar numeros diferentes por conta de atribuicao, bloqueadores de rastreamento e janelas de conversao.
        </div>

        <SummaryCards summary={data.summary} />
        <DashboardFiltersPanel filters={filters} options={data.filterOptions} />

        <section className="dashboard-chart-grid">
          <ChartCard title="Leads por dia" data={data.leadsByDay} mode="vertical" />
          <ChartCard title="Leads por origem" data={data.leadsBySource} />
          <ChartCard title="Leads por cliente" data={data.leadsByClinic} />
          <ChartCard title="Leads por campanha" data={data.leadsByCampaign} />
          <ChartCard title="Leads por criativo" data={data.leadsByCreative} />
          <ChartCard title="Leads por publico" data={data.leadsByAudience} />
        </section>

        <LeadTable rows={data.rows} />
      </section>
    </main>
  );
}
