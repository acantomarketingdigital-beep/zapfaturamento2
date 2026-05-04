import { DashboardLogin } from "@/components/dashboard/DashboardLogin";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { CreativeHighlights } from "@/components/dashboard/CreativeHighlights";
import { getCurrentUser, isDashboardConfigured } from "@/lib/dashboard-auth";
import { hasDatabaseConfig } from "@/lib/db";
import { formatCurrencyFromCents, formatPercent, type Currency } from "@/lib/format";
import { getRelatorioData } from "@/lib/relatorio";

function cleanCampaignName(name: string | null | undefined): string | null {
  if (!name) return null;
  if (name.includes("{{") || name.includes("}}")) return null;
  return name;
}

function dominantCurrency(currencies: string[]): Currency {
  const counts: Record<string, number> = {};
  for (const c of currencies) counts[c] = (counts[c] ?? 0) + 1;
  return (Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "BRL") as Currency;
}

export default async function PerformancePage() {
  const user = await getCurrentUser();

  if (!user) {
    return <DashboardLogin configured={isDashboardConfigured()} error="" />;
  }

  const scopeClientSlug = user.clientSlug;
  const { rows } = await getRelatorioData({ clientSlug: scopeClientSlug });

  const totalInvestment  = rows.reduce((s, r) => s + r.investment_cents, 0);
  const totalLeads       = rows.reduce((s, r) => s + r.leads, 0);
  const totalAgendados   = rows.reduce((s, r) => s + r.agendados, 0);
  const totalFechados    = rows.reduce((s, r) => s + r.fechados, 0);
  const totalFaturamento = rows.reduce((s, r) => s + r.faturamento_cents, 0);
  const roas = totalInvestment > 0
    ? Math.round((totalFaturamento / totalInvestment) * 100) / 100
    : 0;

  // Summary uses the dominant currency across all campaigns
  const summCurrency = dominantCurrency(rows.map((r) => r.currency));

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
            <span className="dashboard-eyebrow">Performance</span>
            <h2>Resultado das campanhas</h2>
            <p>
              Visao geral de investimento, leads e faturamento. Use{" "}
              <a href="/dashboard/relatorio" style={{ color: "var(--brand-dark)", fontWeight: 600 }}>
                Relatorio
              </a>{" "}
              para filtrar por periodo e campanha.
            </p>
          </div>
        </header>

        <div className="dashboard-section-divider">
          <span>Resumo geral</span>
        </div>

        <section className="dashboard-stats-grid">
          <article className="dashboard-stat-card dashboard-stat-card--brand">
            <span>Investimento</span>
            <strong>{formatCurrencyFromCents(totalInvestment, summCurrency)}</strong>
          </article>
          <article className="dashboard-stat-card dashboard-stat-card--neutral">
            <span>Leads</span>
            <strong>{totalLeads}</strong>
          </article>
          <article className="dashboard-stat-card dashboard-stat-card--success">
            <span>Agendados</span>
            <strong>{totalAgendados}</strong>
          </article>
          <article className="dashboard-stat-card dashboard-stat-card--success">
            <span>Fechados</span>
            <strong>{totalFechados}</strong>
          </article>
          <article className="dashboard-stat-card dashboard-stat-card--revenue">
            <span>Faturamento</span>
            <strong>{formatCurrencyFromCents(totalFaturamento, summCurrency)}</strong>
          </article>
          <article className="dashboard-stat-card dashboard-stat-card--meta">
            <span>ROAS</span>
            <strong>{roas.toFixed(2)}x</strong>
          </article>
        </section>

        <CreativeHighlights clientSlug={scopeClientSlug} />

        <div className="dashboard-section-divider">
          <span>Performance por campanha</span>
        </div>

        <article className="dashboard-card">
          <div className="dashboard-table-wrap">
            <table className="dashboard-table">
              <thead>
                <tr>
                  <th>Campanha</th>
                  <th>Investimento</th>
                  <th>Leads</th>
                  <th>CPL</th>
                  <th>Agendados</th>
                  <th>Fechados</th>
                  <th>Faturamento</th>
                  <th>ROAS</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="dashboard-empty">
                      Nenhum dado disponivel. Cadastre investimentos e leads para ver a performance aqui.
                    </td>
                  </tr>
                ) : (
                  rows.map((row) => {
                    const displayName =
                      cleanCampaignName(row.campaign_name) ||
                      cleanCampaignName(row.campaign_key) ||
                      "Sem campanha";
                    const cur = (row.currency || "BRL") as Currency;

                    return (
                      <tr key={`${row.client_slug}-${row.campaign_key}`}>
                        <td>
                          <strong>{displayName}</strong>
                          {user.role === "agency_admin" ? (
                            <div className="dashboard-table__sub">{row.client_slug}</div>
                          ) : null}
                        </td>
                        <td>{formatCurrencyFromCents(row.investment_cents, cur)}</td>
                        <td>{row.leads}</td>
                        <td>
                          {row.cpl_cents > 0
                            ? formatCurrencyFromCents(row.cpl_cents, cur)
                            : <span style={{ color: "var(--muted)" }}>—</span>}
                        </td>
                        <td>
                          {row.agendados > 0 ? (
                            <>
                              {row.agendados}
                              <span className="dashboard-table__sub">
                                {formatPercent(row.taxa_agendamento)} dos leads
                              </span>
                            </>
                          ) : <span style={{ color: "var(--muted)" }}>—</span>}
                        </td>
                        <td>
                          {row.fechados > 0 ? (
                            <>
                              {row.fechados}
                              <span className="dashboard-table__sub">
                                {formatPercent(row.taxa_conversao)} dos leads
                              </span>
                            </>
                          ) : <span style={{ color: "var(--muted)" }}>—</span>}
                        </td>
                        <td>
                          {row.faturamento_cents > 0
                            ? <strong style={{ color: "var(--brand-dark)" }}>{formatCurrencyFromCents(row.faturamento_cents, cur)}</strong>
                            : <span style={{ color: "var(--muted)" }}>—</span>}
                        </td>
                        <td>
                          {row.roas > 0
                            ? <strong>{row.roas.toFixed(2)}x</strong>
                            : <span style={{ color: "var(--muted)" }}>—</span>}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </article>
      </section>
    </main>
  );
}
