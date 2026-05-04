import { DashboardLogin } from "@/components/dashboard/DashboardLogin";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { InvestmentForm } from "@/components/dashboard/InvestmentForm";
import { AutoImportSection } from "@/components/dashboard/AutoImportSection";
import { DeleteInvestmentButton } from "@/components/dashboard/DeleteInvestmentButton";
import { getCurrentUser, isDashboardConfigured } from "@/lib/dashboard-auth";
import { hasDatabaseConfig } from "@/lib/db";
import { formatCurrencyFromCents } from "@/lib/format";
import { listInvestments } from "@/lib/investments";
import { listManagedClinics } from "@/lib/clinics";

export const dynamic = "force-dynamic";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeZone: "America/Sao_Paulo"
  }).format(new Date(value));
}

export default async function InvestmentsPage() {
  const user = await getCurrentUser();

  if (!user) {
    return <DashboardLogin configured={isDashboardConfigured()} error="" />;
  }

  const scopeClientSlug = user.clientSlug;
  const [rows, clients] = await Promise.all([
    listInvestments(scopeClientSlug),
    listManagedClinics("", scopeClientSlug)
  ]);

  const clientOptions = clients.map((c) => ({
    clientSlug: c.clientSlug,
    clientName: c.clientName
  }));

  return (
    <main className="dashboard-shell">
      <DashboardSidebar
        activePath="/dashboard/investimentos"
        databaseReady={hasDatabaseConfig()}
        user={user}
      />

      <section className="dashboard-main">
        <header className="dashboard-topbar">
          <div>
            <span className="dashboard-eyebrow">Investimentos</span>
            <h2>Gasto por campanha</h2>
            <p>
              Cadastre o valor investido por campanha para liberar CPL e ROAS no
              relatorio de performance.
            </p>
          </div>
        </header>

        <article className="dashboard-card">
          <div className="dashboard-card__header">
            <h2>Novo investimento</h2>
          </div>
          <InvestmentForm
            clients={clientOptions}
            isAgencyAdmin={user.role === "agency_admin"}
            defaultClientSlug={scopeClientSlug || ""}
          />
        </article>

        <AutoImportSection clientSlug={scopeClientSlug || ""} />

        <article className="dashboard-card" style={{ marginTop: 20 }}>
          <div className="dashboard-card__header">
            <h2>Investimentos cadastrados</h2>
          </div>
          <div className="dashboard-table-wrap">
            <table className="dashboard-table">
              <thead>
                <tr>
                  <th>Data</th>
                  <th>Cliente</th>
                  <th>Campanha</th>
                  <th>Criativo</th>
                  <th>Publico</th>
                  <th>Investimento</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: "center", opacity: 0.5 }}>
                      Nenhum investimento cadastrado.
                    </td>
                  </tr>
                ) : (
                  rows.map((row) => (
                    <tr key={row.id}>
                      <td>{formatDate(row.created_at)}</td>
                      <td>{row.client_slug}</td>
                      <td>
                        <div>{row.campaign_name || row.campaign}</div>
                        {row.internal_campaign_slug && row.internal_campaign_slug !== row.campaign ? (
                          <div className="dashboard-table__sub">{row.internal_campaign_slug}</div>
                        ) : null}
                      </td>
                      <td>{row.creative || "-"}</td>
                      <td>{row.audience || "-"}</td>
                      <td>{formatCurrencyFromCents(row.investment_cents, row.currency)}</td>
                      <td><DeleteInvestmentButton id={row.id} /></td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </article>
      </section>
    </main>
  );
}
