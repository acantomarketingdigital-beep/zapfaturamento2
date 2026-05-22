import { DashboardLogin } from "@/components/dashboard/DashboardLogin";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { WorkspaceSettingsForm } from "@/components/dashboard/WorkspaceSettingsForm";
import { getCurrentUser, isDashboardConfigured } from "@/lib/dashboard-auth";
import { hasDatabaseConfig } from "@/lib/db";
import { getWorkspaceSettings } from "@/lib/workspace-settings";

export const dynamic = "force-dynamic";

export default async function WorkspaceSettingsPage() {
  const user = await getCurrentUser();
  if (!user) return <DashboardLogin configured={isDashboardConfigured()} error="" />;

  const databaseReady = hasDatabaseConfig();
  const settings = await getWorkspaceSettings(user.clientSlug);

  return (
    <main className="dashboard-shell">
      <DashboardSidebar
        activePath="/dashboard/configuracoes"
        databaseReady={databaseReady}
        user={user}
      />
      <section className="dashboard-main">
        <header className="dashboard-topbar">
          <div>
            <span className="dashboard-eyebrow">Configurações</span>
            <h2>Personalização do Workspace</h2>
            <p>Renomeie etapas, defina tags e gerencie membros da equipe. A estrutura interna do sistema não é alterada.</p>
          </div>
        </header>

        <article className="dashboard-card">
          <WorkspaceSettingsForm initial={settings} />
        </article>
      </section>
    </main>
  );
}
