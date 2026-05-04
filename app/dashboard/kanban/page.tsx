import { KanbanBoard } from "@/components/dashboard/KanbanBoard";
import { DashboardLogin } from "@/components/dashboard/DashboardLogin";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { getCurrentUser, isDashboardConfigured } from "@/lib/dashboard-auth";
import { hasDatabaseConfig } from "@/lib/db";
import { listKanbanLeads } from "@/lib/kanban";

export default async function KanbanPage() {
  const user = await getCurrentUser();

  if (!user) {
    return <DashboardLogin configured={isDashboardConfigured()} error="" />;
  }

  const leads = await listKanbanLeads(user.clientSlug);

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
            <span className="dashboard-eyebrow">Kanban CRM</span>
            <h2>Pipeline de leads e vendas</h2>
            <p>
              Mova leads manualmente quando nao usar Kommo. Leads com Kommo ficam
              prontos para atualizacao automatica por webhook.
            </p>
          </div>
        </header>

        <KanbanBoard leads={leads} />
      </section>
    </main>
  );
}
