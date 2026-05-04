import { DashboardLogin } from "@/components/dashboard/DashboardLogin";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import {
  getCurrentUser,
  isAgencyAdmin,
  isDashboardConfigured,
} from "@/lib/dashboard-auth";
import { hasDatabaseConfig } from "@/lib/db";
import { listConnections } from "@/lib/whatsapp-connections";
import { isEvolutionConfigured } from "@/lib/evolution-api";
import { ConnectionsManager } from "@/components/dashboard/ConnectionsManager";

export default async function WhatsappConnectionsPage() {
  const user = await getCurrentUser();
  if (!user) {
    return <DashboardLogin configured={isDashboardConfigured()} error="" />;
  }

  const databaseReady = hasDatabaseConfig();
  const admin = isAgencyAdmin(user);
  const evolutionOk = isEvolutionConfigured();

  const connections = databaseReady
    ? await listConnections(user.clientSlug)
    : [];

  return (
    <main className="dashboard-shell">
      <DashboardSidebar
        activePath="/dashboard/configuracoes/whatsapp"
        databaseReady={databaseReady}
        user={user}
      />

      <section className="dashboard-main">
        <header className="dashboard-topbar">
          <div>
            <span className="dashboard-eyebrow">Configuracoes</span>
            <h2>Conexoes WhatsApp</h2>
            <p>
              Conecte o WhatsApp via QR Code para receber mensagens e
              identificar leads automaticamente.
            </p>
          </div>
        </header>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            marginBottom: 20,
            padding: "10px 14px",
            borderRadius: 8,
            border: "1px solid var(--border)",
            background: "var(--surface)"
          }}
        >
          <span style={{ fontSize: 18 }}>{evolutionOk ? "✅" : "⚠️"}</span>
          <span style={{ fontSize: "0.88rem", fontWeight: 600 }}>
            {evolutionOk
              ? "Servico de WhatsApp ativo"
              : "Servico nao configurado — entre em contato com o suporte"}
          </span>
        </div>

        <ConnectionsManager
          initialConnections={connections}
          isAgencyAdmin={admin}
          evolutionConfigured={evolutionOk}
          currentUserClientSlug={user.clientSlug}
        />
      </section>
    </main>
  );
}
