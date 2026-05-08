import { DashboardLogin } from "@/components/dashboard/DashboardLogin";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { RelatorioTable } from "@/components/dashboard/RelatorioTable";
import { getCurrentUser, isDashboardConfigured } from "@/lib/dashboard-auth";
import { hasDatabaseConfig } from "@/lib/db";
import { formatCurrencyFromCents, formatPercent, type Currency } from "@/lib/format";
import { getRelatorioData } from "@/lib/relatorio";
import { getCreativeLeadsBreakdown } from "@/lib/campaign-creatives";
import { listManagedClinics } from "@/lib/clinics";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function param(value: string | string[] | undefined): string {
  return Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
}

export default async function RelatorioPage({ searchParams }: PageProps) {
  const user = await getCurrentUser();

  if (!user) {
    return <DashboardLogin configured={isDashboardConfigured()} error="" />;
  }

  const scopeClientSlug = user.clientSlug;
  const params = await searchParams;

  const clientSlug = scopeClientSlug || param(params.clientSlug) || null;
  const dateStart = param(params.dateStart) || null;
  const dateEnd = param(params.dateEnd) || null;
  const groupByBaseName = param(params.groupByBaseName) === "1";

  function dominantCurrency(rs: { currency?: string }[]): Currency {
    const counts: Record<string, number> = {};
    for (const r of rs) { const c = r.currency || "BRL"; counts[c] = (counts[c] ?? 0) + 1; }
    return (Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "BRL") as Currency;
  }

  let clients: Awaited<ReturnType<typeof listManagedClinics>> = [];
  let rows: Awaited<ReturnType<typeof getRelatorioData>>["rows"] = [];
  let summary: Awaited<ReturnType<typeof getRelatorioData>>["summary"] = {
    total_investment_cents: 0, total_leads: 0, total_leads_com_mensagem: 0,
    total_agendados: 0, total_fechados: 0, total_faturamento_cents: 0,
    cpl_cents: 0, taxa_agendamento: 0, taxa_fechamento: 0, roas: 0
  };
  let creativeBreakdown: Awaited<ReturnType<typeof getCreativeLeadsBreakdown>> = [];
  let fetchError = "";

  try {
    [clients, { rows, summary }, creativeBreakdown] = await Promise.all([
      listManagedClinics("", scopeClientSlug),
      getRelatorioData({ clientSlug, dateStart, dateEnd, groupByBaseName }),
      getCreativeLeadsBreakdown({ clientSlug, dateStart, dateEnd })
    ]);
  } catch (err) {
    fetchError = err instanceof Error ? err.message : "Erro ao carregar dados.";
  }

  const summCurrency = dominantCurrency(rows);

  return (
    <main className="dashboard-shell">
      <DashboardSidebar
        activePath="/dashboard/relatorio"
        databaseReady={hasDatabaseConfig()}
        user={user}
      />

      <section className="dashboard-main">
        <header className="dashboard-topbar">
          <div>
            <span className="dashboard-eyebrow">Relatorio</span>
            <h2>Performance por campanha</h2>
            <p>
              Cruza investimento, leads e faturamento para calcular CPL, ROAS e
              taxas de conversao.
            </p>
          </div>
        </header>

        {fetchError && (
          <div className="dashboard-notice dashboard-notice--error" style={{ marginBottom: 16 }}>
            <strong>Erro ao carregar dados:</strong> {fetchError}
          </div>
        )}

        {/* Filters */}
        <article className="dashboard-card">
          <div className="dashboard-card__header">
            <h2>Filtros</h2>
          </div>
          <form method="get" action="/dashboard/relatorio" className="dashboard-form-grid">
            {user.role === "agency_admin" ? (
              <label className="dashboard-field">
                <span>Cliente</span>
                <select name="clientSlug" defaultValue={clientSlug || ""}>
                  <option value="">Todos os clientes</option>
                  {clients.map((c) => (
                    <option key={c.clientSlug} value={c.clientSlug}>
                      {c.clientName}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}

            <label className="dashboard-field">
              <span>Data inicio</span>
              <input type="date" name="dateStart" defaultValue={dateStart || ""} />
            </label>

            <label className="dashboard-field">
              <span>Data fim</span>
              <input type="date" name="dateEnd" defaultValue={dateEnd || ""} />
            </label>

            <label className={`compact-checkbox-card${groupByBaseName ? " compact-checkbox-card--active" : ""}`}>
              <input type="checkbox" name="groupByBaseName" value="1" defaultChecked={groupByBaseName} />
              <div>
                <div className="compact-checkbox-card__label">Agrupar campanhas pelo nome base</div>
                <div className="compact-checkbox-card__desc">Unifica variacoes como &ldquo;vasinhos A&rdquo;, &ldquo;vasinhos B&rdquo; em apenas &ldquo;vasinhos&rdquo;.</div>
              </div>
            </label>

            <div className="dashboard-actions dashboard-field--full">
              <button type="submit" className="dashboard-button">Aplicar filtros</button>
            </div>
          </form>
        </article>

        <div className="dashboard-section-divider"><span>Resumo</span></div>

        {/* Summary cards */}
        <section className="dashboard-stats-grid" style={{ gridTemplateColumns: "repeat(3, minmax(0, 1fr))" }}>
          <article className="dashboard-stat-card dashboard-stat-card--brand">
            <span>Investimento total</span>
            <strong>{formatCurrencyFromCents(summary.total_investment_cents, summCurrency)}</strong>
          </article>
          <article className="dashboard-stat-card dashboard-stat-card--neutral">
            <span>Leads (cliques)</span>
            <strong>{summary.total_leads}</strong>
          </article>
          <article className="dashboard-stat-card dashboard-stat-card--neutral">
            <span>Leads com mensagem</span>
            <strong>{summary.total_leads_com_mensagem}</strong>
          </article>
          <article className="dashboard-stat-card dashboard-stat-card--success">
            <span>Agendados</span>
            <strong>{summary.total_agendados}</strong>
          </article>
          <article className="dashboard-stat-card dashboard-stat-card--success">
            <span>Fechados</span>
            <strong>{summary.total_fechados}</strong>
          </article>
          <article className="dashboard-stat-card dashboard-stat-card--revenue">
            <span>Faturamento</span>
            <strong>{formatCurrencyFromCents(summary.total_faturamento_cents, summCurrency)}</strong>
          </article>
          <article className="dashboard-stat-card dashboard-stat-card--meta" title="Custo por lead que enviou mensagem no WhatsApp">
            <span>CPL real</span>
            <strong>{formatCurrencyFromCents(summary.cpl_cents, summCurrency)}</strong>
          </article>
          <article className="dashboard-stat-card dashboard-stat-card--neutral">
            <span>Taxa agendamento</span>
            <strong>{formatPercent(summary.taxa_agendamento)}</strong>
          </article>
          <article className="dashboard-stat-card dashboard-stat-card--neutral">
            <span>Taxa fechamento</span>
            <strong>{formatPercent(summary.taxa_fechamento)}</strong>
          </article>
          <article className="dashboard-stat-card dashboard-stat-card--brand">
            <span>ROAS</span>
            <strong>{summary.roas.toFixed(2)}x</strong>
          </article>
        </section>

        <div className="dashboard-section-divider"><span>Por campanha</span></div>

        {/* Sortable table with CSV export — client component */}
        <RelatorioTable rows={rows} isAgencyAdmin={user.role === "agency_admin"} />

        {creativeBreakdown.length > 0 ? (
          <>
            <div className="dashboard-section-divider"><span>Por criativo</span></div>
            <article className="dashboard-card">
              <div className="dashboard-card__header">
                <h2>Leads por criativo</h2>
              </div>
              <div className="dashboard-table-wrap">
                <table className="dashboard-table">
                  <thead>
                    <tr>
                      <th>Campanha</th>
                      <th>Criativo</th>
                      <th>Leads</th>
                      <th>Agendados</th>
                      <th>Taxa ag.</th>
                      <th>Fechados</th>
                      <th>Taxa fech.</th>
                    </tr>
                  </thead>
                  <tbody>
                    {creativeBreakdown.map((row) => (
                      <tr key={`${row.campaign_slug}-${row.creative_slug}`}>
                        <td>{row.campaign_slug || "Sem campanha"}</td>
                        <td><strong>{row.creative_slug}</strong></td>
                        <td>{row.leads}</td>
                        <td>{row.agendados}</td>
                        <td>{formatPercent(row.taxa_agendamento)}</td>
                        <td>{row.fechados}</td>
                        <td>{formatPercent(row.taxa_conversao)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </article>
          </>
        ) : null}
      </section>
    </main>
  );
}
