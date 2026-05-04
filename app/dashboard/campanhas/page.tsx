import { DashboardLogin } from "@/components/dashboard/DashboardLogin";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { listAllCampaigns } from "@/lib/campaigns";
import { listManagedClinics } from "@/lib/clinics";
import {
  getCurrentUser,
  isDashboardConfigured
} from "@/lib/dashboard-auth";
import { hasDatabaseConfig } from "@/lib/db";
import { formatCurrencyFromCents } from "@/lib/format";
import { getUserPermissions } from "@/lib/permissions";

export default async function CampanhasPage() {
  const user = await getCurrentUser();
  if (!user) {
    return <DashboardLogin configured={isDashboardConfigured()} error="" />;
  }

  const databaseReady = hasDatabaseConfig();
  const scopeSlug = user.clientSlug;

  const [campaigns, clients, perms] = databaseReady
    ? await Promise.all([
        listAllCampaigns(scopeSlug),
        listManagedClinics("", scopeSlug),
        getUserPermissions(user.id, user.role),
      ])
    : [[], [], await getUserPermissions(user.id, user.role)];

  const clientNameMap = new Map(clients.map((c) => [c.clientSlug, c.clientName]));

  const groupedMap = new Map<string, typeof campaigns>();
  for (const campaign of campaigns) {
    const group = groupedMap.get(campaign.clientSlug) ?? [];
    group.push(campaign);
    groupedMap.set(campaign.clientSlug, group);
  }
  const groups = Array.from(groupedMap.entries()).map(([slug, camps]) => ({
    clientSlug: slug,
    clientName: clientNameMap.get(slug) ?? slug,
    campaigns: camps
  }));

  return (
    <main className="dashboard-shell">
      <DashboardSidebar
        activePath="/dashboard/campanhas"
        databaseReady={databaseReady}
        user={user}
      />

      <section className="dashboard-main">
        <header className="dashboard-topbar">
          <div>
            <span className="dashboard-eyebrow">Gestao de Campanhas</span>
            <h2>Campanhas</h2>
            <p>
              Todas as campanhas ativas e inativas cadastradas por cliente.
            </p>
          </div>
        </header>

        {!databaseReady && (
          <div className="dashboard-alert dashboard-alert--warning" style={{ marginBottom: 20 }}>
            Configure <code>DATABASE_URL</code> para visualizar campanhas.
          </div>
        )}

        {databaseReady && campaigns.length === 0 && (
          <div className="dashboard-card">
            <div className="dashboard-empty">
              Nenhuma campanha cadastrada ainda.{" "}
              <a href="/dashboard/clinicas" style={{ color: "#2563EB" }}>
                Acesse um cliente para criar campanhas.
              </a>
            </div>
          </div>
        )}

        {groups.map(({ clientSlug, clientName, campaigns: camps }) => (
          <article key={clientSlug} className="dashboard-card" style={{ marginBottom: 20 }}>
            <div className="dashboard-card__header">
              <div>
                <h3>{clientName}</h3>
                <code className="dashboard-inline-code">/{clientSlug}</code>
              </div>
              {perms.campanhas_create ? (
                <a
                  href={`/dashboard/clinicas/${encodeURIComponent(clientSlug)}?novaCampanha=1`}
                  className="dashboard-button dashboard-button--ghost"
                  style={{ textDecoration: "none", fontSize: "0.82rem", height: 32 }}
                >
                  + Nova campanha
                </a>
              ) : null}
            </div>

            <div className="dashboard-table-wrap">
              <table className="dashboard-table">
                <thead>
                  <tr>
                    <th>Campanha</th>
                    <th>Status</th>
                    <th>Orcamento diario</th>
                    <th>Acoes</th>
                  </tr>
                </thead>
                <tbody>
                  {camps.map((campaign) => (
                    <tr key={campaign.id}>
                      <td>
                        <strong>{campaign.name}</strong>
                        <div className="dashboard-table__sub">/{campaign.slug}</div>
                      </td>
                      <td>
                        <span
                          className={`dashboard-pill ${
                            campaign.isActive
                              ? "dashboard-pill--success"
                              : "dashboard-pill--error"
                          }`}
                        >
                          {campaign.isActive ? "Ativa" : "Inativa"}
                        </span>
                      </td>
                      <td>
                        {campaign.dailyBudgetCents
                          ? formatCurrencyFromCents(campaign.dailyBudgetCents)
                          : "-"}
                      </td>
                      <td>
                        <a
                          href={`/dashboard/clinicas/${encodeURIComponent(clientSlug)}`}
                          className="dashboard-button dashboard-button--ghost"
                          style={{
                            textDecoration: "none",
                            fontSize: "0.8rem",
                            height: 28
                          }}
                        >
                          Ver cliente
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}
