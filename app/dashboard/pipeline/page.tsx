import { DashboardLogin } from "@/components/dashboard/DashboardLogin";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { PipelineClient } from "@/components/dashboard/PipelineClient";
import { getCurrentUser, isDashboardConfigured } from "@/lib/dashboard-auth";
import { hasDatabaseConfig } from "@/lib/db";
import { listConversationsByStage } from "@/lib/whatsapp-connections";

export default async function PipelinePage() {
  const user = await getCurrentUser();
  if (!user) return <DashboardLogin configured={isDashboardConfigured()} error="" />;

  const clientSlug = user.clientSlug;
  const conversations = await listConversationsByStage(clientSlug);

  return (
    <main className="dashboard-shell" style={{ overflow: "hidden" }}>
      <DashboardSidebar
        activePath="/dashboard/pipeline"
        databaseReady={hasDatabaseConfig()}
        user={user}
      />

      <section className="dashboard-main" style={{ overflow: "auto" }}>
        <header className="dashboard-topbar">
          <div>
            <span className="dashboard-eyebrow">Vendas</span>
            <h2>Pipeline</h2>
            <p>Acompanhe o progresso de cada conversa pelo funil de vendas.</p>
          </div>
        </header>

        <PipelineClient initialConversations={conversations} />
      </section>
    </main>
  );
}
