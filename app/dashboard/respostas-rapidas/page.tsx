import { DashboardLogin } from "@/components/dashboard/DashboardLogin";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { QuickRepliesClient } from "@/components/dashboard/QuickRepliesClient";
import { getCurrentUser, isDashboardConfigured } from "@/lib/dashboard-auth";
import { hasDatabaseConfig } from "@/lib/db";

export default async function RespostasRapidasPage() {
  const user = await getCurrentUser();
  if (!user) return <DashboardLogin configured={isDashboardConfigured()} error="" />;

  return (
    <main className="dashboard-shell">
      <DashboardSidebar
        activePath="/dashboard/respostas-rapidas"
        databaseReady={hasDatabaseConfig()}
        user={user}
      />

      <section className="dashboard-main">
        <header className="dashboard-topbar">
          <div>
            <span className="dashboard-eyebrow">WhatsApp</span>
            <h2>Respostas Rapidas</h2>
            <p>Salve mensagens frequentes e use-as diretamente no Conversas.</p>
          </div>
        </header>

        <QuickRepliesClient />
      </section>
    </main>
  );
}
