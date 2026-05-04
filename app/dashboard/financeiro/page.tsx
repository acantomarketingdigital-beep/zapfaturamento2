import { DashboardLogin } from "@/components/dashboard/DashboardLogin";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { getCurrentUser, isDashboardConfigured } from "@/lib/dashboard-auth";
import { hasDatabaseConfig } from "@/lib/db";
import { getFinancialMetrics, type FinancialDeal } from "@/lib/whatsapp-connections";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function p(v: string | string[] | undefined) {
  return Array.isArray(v) ? (v[0] ?? "") : (v ?? "");
}

function brl(n: number) {
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function pct(n: number) {
  return n.toFixed(1) + "%";
}

const TEMP_LABEL: Record<string, string> = { hot: "🔴 Quente", warm: "🟡 Morno", cold: "⚪ Frio" };
const STATUS_LABEL: Record<string, string> = { won: "✅ Ganho", lost: "❌ Perdido", open: "🔄 Aberto" };
const STAGE_LABEL: Record<string, string> = {
  novo_lead: "Novo Lead", primeiro_contato: "Primeiro Contato",
  em_atendimento: "Atendimento", orcamento_enviado: "Orcamento",
  agendamento: "Agendamento", compareceu: "Compareceu",
  fechado: "Fechado", perdido: "Perdido"
};

const PERIODS = [
  { key: "hoje", label: "Hoje" },
  { key: "7d", label: "7 dias" },
  { key: "30d", label: "30 dias" },
  { key: "custom", label: "Personalizado" },
];

function periodDates(period: string): { dateStart: string | null; dateEnd: string | null } {
  const now = new Date();
  const today = now.toISOString().slice(0, 10);
  if (period === "hoje") return { dateStart: today, dateEnd: today };
  if (period === "7d") {
    const d = new Date(now); d.setDate(d.getDate() - 6);
    return { dateStart: d.toISOString().slice(0, 10), dateEnd: today };
  }
  if (period === "30d") {
    const d = new Date(now); d.setDate(d.getDate() - 29);
    return { dateStart: d.toISOString().slice(0, 10), dateEnd: today };
  }
  return { dateStart: null, dateEnd: null };
}

export default async function FinanceiroPage({ searchParams }: PageProps) {
  const user = await getCurrentUser();
  if (!user) return <DashboardLogin configured={isDashboardConfigured()} error="" />;

  const params = await searchParams;
  const period = p(params.period) || "30d";
  const rawStart = p(params.dateStart) || null;
  const rawEnd = p(params.dateEnd) || null;

  const { dateStart, dateEnd } =
    period === "custom"
      ? { dateStart: rawStart, dateEnd: rawEnd }
      : periodDates(period);

  const clientSlug = user.clientSlug;

  const { metrics, deals } = await getFinancialMetrics({ clientSlug, dateStart, dateEnd });

  const wonDeals = deals.filter((d) => d.deal_status === "won");
  const openDeals = deals.filter((d) => d.deal_status === "open");
  const lostDeals = deals.filter((d) => d.deal_status === "lost");

  return (
    <main className="dashboard-shell">
      <DashboardSidebar
        activePath="/dashboard/financeiro"
        databaseReady={hasDatabaseConfig()}
        user={user}
      />

      <section className="dashboard-main">
        <header className="dashboard-topbar">
          <div>
            <span className="dashboard-eyebrow">Analise</span>
            <h2>Financeiro</h2>
            <p>Faturamento, conversoes e desempenho do funil de vendas.</p>
          </div>
        </header>

        {/* Period filter */}
        <form method="get" action="/dashboard/financeiro" style={{ marginBottom: 20, display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
          {PERIODS.map((per) => (
            <button
              key={per.key}
              type="submit"
              name="period"
              value={per.key}
              className={`dashboard-button${period === per.key ? "" : " dashboard-button--ghost"}`}
              style={{ fontSize: "0.78rem", height: 32 }}
            >
              {per.label}
            </button>
          ))}
          {period === "custom" && (
            <>
              <input type="date" name="dateStart" defaultValue={rawStart ?? ""} style={{ fontSize: "0.78rem", border: "1px solid var(--border)", borderRadius: 6, padding: "4px 8px" }} />
              <input type="date" name="dateEnd" defaultValue={rawEnd ?? ""} style={{ fontSize: "0.78rem", border: "1px solid var(--border)", borderRadius: 6, padding: "4px 8px" }} />
              <input type="hidden" name="period" value="custom" />
              <button type="submit" className="dashboard-button" style={{ fontSize: "0.78rem", height: 32 }}>Filtrar</button>
            </>
          )}
          {dateStart && dateEnd && period !== "custom" && (
            <span style={{ fontSize: "0.75rem", color: "var(--muted)" }}>{dateStart} — {dateEnd}</span>
          )}
        </form>

        {/* KPI Cards */}
        <section className="dashboard-stats-grid" style={{ gridTemplateColumns: "repeat(5, minmax(0, 1fr))", marginBottom: 24 }}>
          <article className="dashboard-stat-card dashboard-stat-card--revenue">
            <span>Faturamento</span>
            <strong>{brl(metrics.faturamento_total)}</strong>
          </article>
          <article className="dashboard-stat-card dashboard-stat-card--neutral">
            <span>Leads</span>
            <strong>{metrics.leads_total}</strong>
          </article>
          <article className="dashboard-stat-card dashboard-stat-card--brand">
            <span>Leads Quentes</span>
            <strong>{metrics.leads_quentes}</strong>
          </article>
          <article className="dashboard-stat-card dashboard-stat-card--success">
            <span>Conversao</span>
            <strong>{pct(metrics.taxa_conversao)}</strong>
          </article>
          <article className="dashboard-stat-card dashboard-stat-card--meta">
            <span>Ticket Medio</span>
            <strong>{brl(metrics.ticket_medio)}</strong>
          </article>
        </section>

        {/* Won Deals */}
        <DealTable title={`Vendas Ganhas (${wonDeals.length})`} deals={wonDeals} showValue />

        {/* Open Deals */}
        <DealTable title={`Em Andamento (${openDeals.length})`} deals={openDeals} />

        {/* Lost Deals */}
        {lostDeals.length > 0 && (
          <DealTable title={`Perdidos (${lostDeals.length})`} deals={lostDeals} />
        )}
      </section>
    </main>
  );
}

function DealTable({ title, deals, showValue }: { title: string; deals: FinancialDeal[]; showValue?: boolean }) {
  if (deals.length === 0) return null;
  return (
    <article className="dashboard-card" style={{ marginBottom: 20 }}>
      <div className="dashboard-card__header">
        <h2>{title}</h2>
      </div>
      <div className="dashboard-table-wrap">
        <table className="dashboard-table">
          <thead>
            <tr>
              <th>Contato</th>
              <th>Temperatura</th>
              <th>Etapa</th>
              <th>Status</th>
              {showValue && <th>Valor</th>}
              <th>Data</th>
            </tr>
          </thead>
          <tbody>
            {deals.map((d) => (
              <tr key={d.id}>
                <td>
                  <strong>{d.contact_name ?? d.contact_phone}</strong>
                  {d.contact_name && <div className="dashboard-table__sub">{d.contact_phone}</div>}
                  {d.connection_name && <div className="dashboard-table__sub">{d.connection_name}</div>}
                </td>
                <td>{TEMP_LABEL[d.temperature] ?? d.temperature}</td>
                <td>{STAGE_LABEL[d.pipeline_stage] ?? d.pipeline_stage}</td>
                <td>{STATUS_LABEL[d.deal_status] ?? d.deal_status}</td>
                {showValue && (
                  <td><strong>{d.deal_value != null ? d.deal_value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) : "—"}</strong></td>
                )}
                <td style={{ fontSize: "0.8rem", color: "var(--muted)" }}>
                  {d.deal_closed_at
                    ? new Date(d.deal_closed_at).toLocaleDateString("pt-BR")
                    : new Date(d.created_at).toLocaleDateString("pt-BR")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </article>
  );
}
