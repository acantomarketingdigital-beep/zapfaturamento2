import { AutoRefresh } from "@/components/dashboard/AutoRefresh";
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
  type OnboardRow = { has_client: boolean; has_connection: boolean; has_message: boolean; has_attended: boolean };
  let onboarding: OnboardRow | null = null;
  if (hasDatabaseConfig()) {
    try {
      const slug = scopedClientSlug;
      const slugWhere = slug ? "AND client_slug = $1" : "";
      const slugParam = slug ? [slug] : [];
      const ob = await queryDb<OnboardRow>(
        `SELECT
           (SELECT COUNT(*) FROM clinics WHERE TRUE ${slug ? "AND slug = $1" : ""}) > 0 AS has_client,
           (SELECT COUNT(*) FROM whatsapp_connections WHERE TRUE ${slugWhere}) > 0 AS has_connection,
           (SELECT COUNT(*) FROM whatsapp_messages WHERE TRUE ${slugWhere}) > 0 AS has_message,
           (SELECT COUNT(*) FROM whatsapp_conversations WHERE pipeline_stage != 'novo_lead' ${slugWhere}) > 0 AS has_attended`,
        slugParam
      );
      onboarding = ob.rows[0] ?? null;
    } catch {}
  }
  const allDone = onboarding?.has_client && onboarding?.has_connection && onboarding?.has_message && onboarding?.has_attended;

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
            <AutoRefresh intervalSeconds={30} />
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
          <article className="dashboard-card" style={{ marginBottom: 20, padding: "1.5rem", border: "1px solid rgba(34,211,238,0.15)", background: "rgba(34,211,238,0.03)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div>
                <span style={{ display: "inline-block", fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--brand)", marginBottom: 4 }}>
                  Configuração inicial
                </span>
                <h3 style={{ fontWeight: 800, fontSize: "1rem", margin: 0, color: "var(--dark)" }}>
                  Primeiros passos para colocar em funcionamento
                </h3>
              </div>
              <a href="/dashboard/academia" style={{ fontSize: "0.78rem", color: "var(--brand)", textDecoration: "none", fontWeight: 700, whiteSpace: "nowrap", flexShrink: 0 }}>
                Ver guia completo →
              </a>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {[
                { done: onboarding.has_client, label: "Criar o primeiro cliente", href: "/dashboard/clinicas", desc: "Cadastre o cliente que vai receber os leads das campanhas" },
                { done: onboarding.has_connection, label: "Conectar o WhatsApp", href: "/dashboard/configuracoes/whatsapp", desc: "Configure a conexão via QR Code ou API Oficial da Meta" },
                { done: onboarding.has_message, label: "Receber o primeiro lead", href: "/dashboard/academia", desc: "Crie a campanha e aguarde o primeiro lead entrar" },
                { done: onboarding.has_attended, label: "Iniciar o atendimento", href: "/dashboard/inbox", desc: "Abra o Inbox e responda o primeiro lead" },
              ].map((step, i) => (
                <div key={step.label} style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "10px 14px", borderRadius: 10, background: step.done ? "transparent" : "var(--bg)", border: `1px solid ${step.done ? "transparent" : "var(--border)"}` }}>
                  <div style={{ flexShrink: 0, width: 26, height: 26, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.7rem", fontWeight: 800, background: step.done ? "var(--brand)" : "var(--border)", color: step.done ? "#fff" : "var(--muted)" }}>
                    {step.done ? (
                      <svg viewBox="0 0 20 20" fill="currentColor" style={{ width: 12, height: 12 }}>
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    ) : i + 1}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    {step.done ? (
                      <span style={{ color: "var(--muted)", textDecoration: "line-through", fontSize: "0.85rem" }}>{step.label}</span>
                    ) : (
                      <a href={step.href} style={{ color: "var(--dark)", textDecoration: "none", fontWeight: 700, fontSize: "0.85rem" }}>{step.label}</a>
                    )}
                    {!step.done && (
                      <div style={{ fontSize: "0.75rem", color: "var(--muted)", marginTop: 2 }}>{step.desc}</div>
                    )}
                  </div>
                  {!step.done && (
                    <a href={step.href} style={{ flexShrink: 0, fontSize: "0.75rem", fontWeight: 700, color: "var(--brand)", textDecoration: "none", alignSelf: "center" }}>
                      Fazer →
                    </a>
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
