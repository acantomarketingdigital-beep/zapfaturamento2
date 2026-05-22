import { KanbanBoard } from "@/components/dashboard/KanbanBoard";
import { DashboardLogin } from "@/components/dashboard/DashboardLogin";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { getCurrentUser, isDashboardConfigured } from "@/lib/dashboard-auth";
import { hasDatabaseConfig } from "@/lib/db";
import { listKanbanLeads } from "@/lib/kanban";
import { getWorkspaceSettings } from "@/lib/workspace-settings";

export default async function KanbanPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  const user = await getCurrentUser();

  if (!user) {
    return <DashboardLogin configured={isDashboardConfigured()} error="" />;
  }

  const params = await searchParams;
  const trafficOnly = params.mode === "traffic";

  let leads: Awaited<ReturnType<typeof listKanbanLeads>> = [];
  let kanbanError = "";
  try {
    leads = await listKanbanLeads(user.clientSlug, trafficOnly);
  } catch (err) {
    kanbanError = err instanceof Error ? err.message : "Erro ao carregar leads.";
  }

  const wsSettings = await getWorkspaceSettings(user.clientSlug).catch(() => null);

  return (
    <main className="dashboard-shell">
      <DashboardSidebar
        activePath="/dashboard/kanban"
        databaseReady={hasDatabaseConfig()}
        user={user}
      />

      <section className="dashboard-main">
        <header className="dashboard-topbar">
          <div>
            <span className="dashboard-eyebrow">Leads</span>
            <h2>Pipeline de leads e vendas</h2>
            <p>Mova leads pelo funil. Leads com Kommo ficam prontos para atualizacao automatica.</p>
          </div>
          <div style={{ display: "flex", gap: 4, alignSelf: "center" }}>
            <a href="/dashboard/kanban" className="dashboard-button" style={{ textDecoration: "none", background: "var(--brand)", color: "#fff" }}>Kanban</a>
            <a href="/dashboard/pipeline" className="dashboard-button dashboard-button--ghost" style={{ textDecoration: "none" }}>Pipeline</a>
          </div>
        </header>

        {kanbanError && (
          <div className="dashboard-notice dashboard-notice--error">
            <strong>Erro ao carregar leads:</strong> {kanbanError}
          </div>
        )}
        <KanbanBoard leads={leads} trafficOnly={trafficOnly} wsSettings={wsSettings} />
      </section>
    </main>
  );
}
