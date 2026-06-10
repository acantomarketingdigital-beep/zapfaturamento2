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
        <header className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-500 mb-2">
              ZapFaturamento
            </p>
            <h1 className="text-2xl font-bold text-slate-100 tracking-tight">
              Leads, campanhas e resultados
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Acompanhe a origem dos leads e a eficiência das campanhas que terminam em conversa no WhatsApp.
            </p>
          </div>
          <div className="flex gap-2 items-start flex-wrap mt-1">
            <AutoRefresh intervalSeconds={30} />
            {user && user.role === "agency_admin" && data.databaseReady && (
              <CleanTestLeadsButton clients={data.filterOptions.clients} />
            )}
            {!data.databaseReady && (
              <span className="inline-flex items-center gap-1.5 rounded-lg border border-amber-500/20 bg-amber-500/8 px-3 py-1.5 text-xs font-medium text-amber-400">
                Configure <code className="font-mono text-amber-300">DATABASE_URL</code>
              </span>
            )}
            <span
              title="O ZapFaturamento registra acessos reais ao link de redirecionamento. A Meta pode apresentar números diferentes por conta de atribuição, bloqueadores de rastreamento e janelas de conversão."
              className="flex h-8 w-8 cursor-help items-center justify-center rounded-lg border border-slate-800 text-slate-600 transition-colors hover:border-slate-700 hover:text-slate-400"
            >
              <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </span>
          </div>
        </header>

        {!allDone && onboarding && (
          <div className="rounded-xl border border-cyan-400/15 bg-cyan-400/3 p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-cyan-400 mb-1">
                  Configuração inicial
                </p>
                <h3 className="text-sm font-bold text-slate-200">
                  Primeiros passos para colocar em funcionamento
                </h3>
              </div>
              <a
                href="/dashboard/academia"
                className="text-xs font-bold text-cyan-400 hover:text-cyan-300 transition-colors whitespace-nowrap shrink-0"
              >
                Ver guia →
              </a>
            </div>
            <div className="flex flex-col gap-2">
              {[
                { done: onboarding.has_client, label: "Criar o primeiro cliente", href: "/dashboard/clinicas", desc: "Cadastre o cliente que vai receber os leads das campanhas" },
                { done: onboarding.has_connection, label: "Conectar o WhatsApp", href: "/dashboard/configuracoes/whatsapp", desc: "Configure a conexão via QR Code ou API Oficial da Meta" },
                { done: onboarding.has_message, label: "Receber o primeiro lead", href: "/dashboard/academia", desc: "Crie a campanha e aguarde o primeiro lead entrar" },
                { done: onboarding.has_attended, label: "Iniciar o atendimento", href: "/dashboard/inbox", desc: "Abra o Inbox e responda o primeiro lead" },
              ].map((step, i) => (
                <div
                  key={step.label}
                  className={`flex items-start gap-3 rounded-lg px-3 py-2.5 border ${step.done ? "border-transparent bg-transparent" : "border-slate-800/80 bg-slate-900/40"}`}
                >
                  <div className={`shrink-0 h-6 w-6 rounded-full flex items-center justify-center text-[11px] font-bold ${step.done ? "bg-cyan-400 text-[#020817]" : "bg-slate-800 text-slate-500"}`}>
                    {step.done ? (
                      <svg viewBox="0 0 20 20" fill="currentColor" style={{ width: 10, height: 10 }}>
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    ) : i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    {step.done ? (
                      <span className="text-sm text-slate-600 line-through">{step.label}</span>
                    ) : (
                      <a href={step.href} className="text-sm font-semibold text-slate-200 hover:text-cyan-400 transition-colors">{step.label}</a>
                    )}
                    {!step.done && <p className="text-xs text-slate-600 mt-0.5">{step.desc}</p>}
                  </div>
                  {!step.done && (
                    <a href={step.href} className="shrink-0 text-xs font-bold text-cyan-400 hover:text-cyan-300 transition-colors self-center">
                      Fazer →
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

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
